/**
 * iCount (חשבונית אונליין) integration — replaces the older Israkart code.
 *
 * Why iCount instead of direct Israkart?
 * - One API for BOTH charging and issuing invoices/receipts
 * - Receipts go straight into your iCount account and get auto-reported to
 *   רשות המסים — no manual book-keeping
 * - PCI scope stays SAQ-A because card data is entered on iCount's hosted
 *   iframe (we never see the PAN)
 *
 * Auth model — every request takes:
 *   cid          (company id, e.g. "325741783")
 *   user         (icount username)
 *   api_token    (long token from Settings → Show API)
 *
 * Two-stage flow for our use case:
 *   1) On registration submit → cc/iframe to get a hosted page URL.
 *      User enters card there. iCount calls our `notify_url` with the
 *      cc_token + last4 + masked PAN. We store the token.
 *   2) On 16.7 → cc/charge_token for each approved athlete. iCount charges
 *      the card AND creates a חשבונית מס/קבלה automatically.
 *
 * Local dev: PAYMENT_MODE=mock returns fake tokens / fake "OK" charges so
 * the whole flow is testable without hitting the live gateway.
 */

const BASE = "https://api.icount.co.il/api/v3.php";

export type PaymentMode = "mock" | "live";
export const PAYMENT_MODE: PaymentMode =
  process.env.PAYMENT_MODE === "live" ? "live" : "mock";

function auth() {
  return {
    cid: process.env.ICOUNT_CID || "",
    user: process.env.ICOUNT_USER || "",
    api_token: process.env.ICOUNT_API_TOKEN || "",
  };
}

async function call<T = any>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...auth(), ...body }),
  });
  const json = await res.json();
  if (!res.ok || json.status === false) {
    throw new Error(json.reason || json.error_description || `iCount ${endpoint} failed`);
  }
  return json as T;
}

/* ─────────────────────────────────────────── tokenisation iframe */

export interface IframeResult {
  iframe_url: string;
  external_id: string;
}

/**
 * Returns a URL we embed in an <iframe> on the payment step.
 * iCount renders the secure card form; on success it POSTs the token
 * to `notify_url` (server-to-server) and redirects the user to `success_url`.
 *
 * `j5` mode = authorisation only — no actual charge happens yet.
 */
export async function createTokenIframe(opts: {
  registrationId: string;
  amount: number;            // NIS
  customerName: string;
  customerEmail: string;
  notifyUrl: string;         // server-to-server webhook
  successUrl: string;        // browser redirect on success
  failureUrl: string;        // browser redirect on failure
}): Promise<IframeResult> {
  if (PAYMENT_MODE === "mock") {
    const params = new URLSearchParams({
      reg: opts.registrationId,
      amount: String(opts.amount),
      return: opts.successUrl,
    });
    return {
      iframe_url: `/api/payment/mock?${params.toString()}`,
      external_id: opts.registrationId,
    };
  }
  return call<IframeResult>("cc/iframe", {
    sum: opts.amount,
    currency_code: "ILS",
    j5: 1,                          // J5 = auth + tokenize, no real charge
    description: `Calima Battles 3 — ${opts.registrationId}`,
    client_name: opts.customerName,
    email: opts.customerEmail,
    external_id: opts.registrationId,
    notify_url: opts.notifyUrl,
    success_url: opts.successUrl,
    failure_url: opts.failureUrl,
    lang: "he",
  });
}

/* ─────────────────────────────────────────── charge a saved token */

export interface ChargeResult {
  approved: boolean;
  transactionId: string;
  docNumber?: string;        // receipt/invoice number, if produced
  message?: string;
}

/**
 * Charge a previously-stored token AND create a tax-document.
 * Issues a חשבונית מס/קבלה (invrec) automatically — emailed to the athlete.
 */
export async function chargeToken(opts: {
  ccToken: string;
  amount: number;
  registrationId: string;
  customerName: string;
  customerEmail: string;
  itemDescription: string;
}): Promise<ChargeResult> {
  if (PAYMENT_MODE === "mock") {
    return {
      approved: true,
      transactionId: `mock-${Date.now()}`,
      docNumber: `mock-doc-${Date.now()}`,
    };
  }

  // iCount: create an invrec document with the cc_token as the payment method.
  // This both charges the card and produces the receipt in one shot.
  const res = await call<{ doc_uuid: string; docnum: string; status: boolean }>("doc/create", {
    doctype: "invrec",                  // חשבונית מס/קבלה
    client_name: opts.customerName,
    email: opts.customerEmail,
    lang: "he",
    currency_code: "ILS",
    items: [{
      description: opts.itemDescription,
      unitprice: opts.amount,
      quantity: 1,
    }],
    cc: [{
      sum: opts.amount,
      card_type: 0,         // 0 = unknown / auto-detect by token
      payments: 1,          // single payment
      cc_token: opts.ccToken,
      confirmation_code: opts.registrationId,
    }],
    send_email: 1,          // email the receipt to the customer
    email_to_client: 1,
  });

  return {
    approved: res.status !== false,
    transactionId: res.doc_uuid,
    docNumber: res.docnum,
  };
}

/* ─────────────────────────────────────────── helpers */

export function envIsConfigured(): boolean {
  return Boolean(process.env.ICOUNT_CID && process.env.ICOUNT_USER && process.env.ICOUNT_API_TOKEN);
}
