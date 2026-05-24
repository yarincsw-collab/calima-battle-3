/**
 * iCredit (icredit.rivhit.co.il) integration — replaces the previous iCount code.
 *
 * Architecture:
 *  - iCredit = the card-acquiring gateway (Rivhit group's processor)
 *  - When iCredit charges a card, it automatically pushes a receipt into
 *    ריווחית אונליין (the linked accounting product), giving us auto-receipts
 *    with continuity of the existing receipt numbering.
 *
 * PCI: SAQ-A. Card data is entered on iCredit's hosted iframe — we only ever
 * see an opaque token in the IPN callback.
 *
 * Two-stage flow:
 *  1) On registration submit → PaymentPageRequest.svc/GetUrl with SaleType=4
 *     ("J5" / Sign-in only). User enters card on the iframe; iCredit POSTs the
 *     token to our IPN URL and redirects the user back.
 *  2) On 16.7 → CardTokenCharge.svc/Charge with the saved Token. iCredit
 *     processes the charge; ריווחית אונליין auto-issues the receipt.
 *
 * Mock mode: set PAYMENT_MODE=mock to bypass live calls during dev.
 */

const BASE = "https://icredit.rivhit.co.il/API";

export type PaymentMode = "mock" | "live";
export const PAYMENT_MODE: PaymentMode =
  process.env.PAYMENT_MODE === "live" ? "live" : "mock";

function token() {
  return process.env.ICREDIT_GROUP_PRIVATE_TOKEN || "";
}

async function call<T = any>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const url = `${BASE}/${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...body, GroupPrivateToken: token() }),
  });
  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`iCredit ${endpoint} returned non-JSON: ${text.slice(0, 200)}`);
  }
  if (parsed.Status !== undefined && parsed.Status !== 0 && parsed.Status !== "0") {
    throw new Error(
      `iCredit ${endpoint} failed (Status=${parsed.Status}): ${parsed.Message ?? parsed.ErrorMessage ?? JSON.stringify(parsed)}`
    );
  }
  return parsed as T;
}

/* ─────────────────────────────────────────── tokenisation iframe */

export interface IframeResult {
  iframe_url: string;
  external_id: string;
}

/**
 * Returns a hosted-page URL we embed in an <iframe> on the payment step.
 * SaleType=4 means "Token only" — iCredit verifies the card but does NOT
 * actually charge it. We receive a Token in the IPN callback that can be
 * charged later via chargeToken().
 */
export async function createTokenIframe(opts: {
  registrationId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notifyUrl: string;
  successUrl: string;
  failureUrl: string;
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

  // Split name once for first/last fields iCredit expects
  const [first, ...rest] = (opts.customerName || "").trim().split(/\s+/);
  const last = rest.join(" ") || "Athlete";

  const res = await call<{ URL: string; PublicSaleToken: string }>(
    "PaymentPageRequest.svc/GetUrl",
    {
      SaleType: 4, // J5 / tokenisation only — no charge happens here
      Currency: 1, // 1 = ILS
      Amount: opts.amount,
      MaxPayments: 1,
      CustomerFirstName: first || opts.customerName,
      CustomerLastName: last,
      EmailAddress: opts.customerEmail,
      PhoneNumber: opts.customerPhone || "",
      Items: [
        {
          Id: opts.registrationId,
          Description: `Calima Battles 3 — הרשמה`,
          Quantity: 1,
          Price: opts.amount,
          ItemType: 1,
        },
      ],
      HideItemList: false,
      IPNURL: opts.notifyUrl,
      RedirectURL: opts.successUrl,
      ExemptVAT: false,
      Custom1: opts.registrationId,
    }
  );

  return { iframe_url: res.URL, external_id: res.PublicSaleToken };
}

/* ─────────────────────────────────────────── charge a saved token */

export interface ChargeResult {
  approved: boolean;
  transactionId: string;
  docNumber?: string;
  message?: string;
}

/**
 * Charge a previously-stored card token. ריווחית אונליין will automatically
 * generate a חשבונית מס/קבלה in the linked merchant account and email it to
 * the customer.
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

  const [first, ...rest] = (opts.customerName || "").trim().split(/\s+/);
  const last = rest.join(" ") || "Athlete";

  try {
    const res = await call<{
      Status: number;
      Message?: string;
      TransactionId?: string;
      DocumentId?: string;
      Token?: string;
    }>("CardTokenCharge.svc/Charge", {
      Token: opts.ccToken,
      Amount: opts.amount,
      Currency: 1,
      MaxPayments: 1,
      CustomerFirstName: first || opts.customerName,
      CustomerLastName: last,
      EmailAddress: opts.customerEmail,
      Items: [
        {
          Id: opts.registrationId,
          Description: opts.itemDescription,
          Quantity: 1,
          Price: opts.amount,
          ItemType: 1,
        },
      ],
      Custom1: opts.registrationId,
    });

    return {
      approved: true,
      transactionId: res.TransactionId ?? "",
      docNumber: res.DocumentId,
      message: res.Message,
    };
  } catch (err) {
    return {
      approved: false,
      transactionId: "",
      message: (err as Error).message,
    };
  }
}

export function envIsConfigured(): boolean {
  return Boolean(process.env.ICREDIT_GROUP_PRIVATE_TOKEN);
}
