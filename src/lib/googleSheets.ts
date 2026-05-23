import { google } from "googleapis";

// Lazy-init so missing env in dev doesn't crash module load.
function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error("Google service account env vars missing");
  }
  const auth = new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export const HEADER_ROW = [
  "Timestamp",
  "Registration ID",
  "Full Name",
  "DOB",
  "Age",
  "Email",
  "Phone",
  "Categories",
  "Total Price (₪)",
  "Freestyle Video",
  "Endurance Video",
  "Health Doc URL",
  "Parent Consent URL",
  "Signature URL",
  "Parent Name",
  "Parent Phone",
  "Payment Token",
  "Payment Status",
  "Notes",
];

export interface SheetRow {
  registrationId: string;
  fullName: string;
  dob: string;
  age: number;
  email: string;
  phone: string;
  categories: string;
  totalPrice: number;
  freestyleVideoUrl: string;
  enduranceVideoUrl: string;
  healthDocUrl: string;
  parentConsentUrl: string;
  signatureUrl: string;
  parentName: string;
  parentPhone: string;
  paymentToken: string;
  paymentStatus: string;
  notes?: string;
}

/** Ensure the destination tab exists and has the header row. */
async function ensureHeader(sheetId: string, tabName: string) {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const tab = meta.data.sheets?.find((s) => s.properties?.title === tabName);
  if (!tab) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
  }
  // Read first row; if empty, write header.
  const first = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!1:1`,
  });
  if (!first.data.values || first.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADER_ROW] },
    });
  }
}

export async function appendRegistration(row: SheetRow): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME || "Registrations";
  if (!sheetId) throw new Error("GOOGLE_SHEETS_ID is not set");

  await ensureHeader(sheetId, tabName);

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tabName}!A:S`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          row.registrationId,
          row.fullName,
          row.dob,
          row.age,
          row.email,
          row.phone,
          row.categories,
          row.totalPrice,
          row.freestyleVideoUrl,
          row.enduranceVideoUrl,
          row.healthDocUrl,
          row.parentConsentUrl,
          row.signatureUrl,
          row.parentName,
          row.parentPhone,
          row.paymentToken,
          row.paymentStatus,
          row.notes ?? "",
        ],
      ],
    },
  });
}

/* ──────────────────────────── helpers for the charge workflow */

export interface FullRow extends SheetRow {
  rowNumber: number; // 1-based, includes the header row, so first data row = 2
}

/** Load every row from the registrations tab as typed objects. */
export async function loadAllRegistrations(): Promise<FullRow[]> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME || "Registrations";
  if (!sheetId) throw new Error("GOOGLE_SHEETS_ID is not set");

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!A2:S`,
  });
  const rows = res.data.values ?? [];

  return rows.map((r, idx) => ({
    rowNumber: idx + 2, // +1 for header, +1 for 0→1 base
    registrationId: r[1] ?? "",
    fullName: r[2] ?? "",
    dob: r[3] ?? "",
    age: Number(r[4]) || 0,
    email: r[5] ?? "",
    phone: r[6] ?? "",
    categories: r[7] ?? "",
    totalPrice: Number(r[8]) || 0,
    freestyleVideoUrl: r[9] ?? "",
    enduranceVideoUrl: r[10] ?? "",
    healthDocUrl: r[11] ?? "",
    parentConsentUrl: r[12] ?? "",
    signatureUrl: r[13] ?? "",
    parentName: r[14] ?? "",
    parentPhone: r[15] ?? "",
    paymentToken: r[16] ?? "",
    paymentStatus: r[17] ?? "",
    notes: r[18] ?? "",
  }));
}

/** Find a single registration by its UUID. Returns null if missing. */
export async function findRegistration(registrationId: string): Promise<FullRow | null> {
  const all = await loadAllRegistrations();
  return all.find((r) => r.registrationId === registrationId) ?? null;
}

/**
 * Update the payment-status (and optional notes) for a registration.
 * Writes to columns R (status) and S (notes) on the row found by Registration ID.
 */
export async function updateRegistrationStatus(
  registrationId: string,
  updates: { paymentStatus?: string; notes?: string }
): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME || "Registrations";
  if (!sheetId) throw new Error("GOOGLE_SHEETS_ID is not set");

  const row = await findRegistration(registrationId);
  if (!row) throw new Error(`registration ${registrationId} not found in sheet`);

  const sheets = getSheetsClient();
  const data: { range: string; values: string[][] }[] = [];
  if (updates.paymentStatus !== undefined) {
    data.push({ range: `${tabName}!R${row.rowNumber}`, values: [[updates.paymentStatus]] });
  }
  if (updates.notes !== undefined) {
    data.push({ range: `${tabName}!S${row.rowNumber}`, values: [[updates.notes]] });
  }
  if (!data.length) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data },
  });
}
