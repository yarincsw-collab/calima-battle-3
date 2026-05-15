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
