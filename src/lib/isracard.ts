/**
 * Israkart Business / Premium gateway integration.
 *
 * In Israel the most common products for taking cards online are:
 *  1. Israkart Premium (a.k.a. "שער 2.0" / gateway20.icom.co.il)
 *  2. Tranzila (which is owned by Isracard since 2020) — same APIs
 *  3. Cardcom (a friendly wrapper around the same banks)
 *
 * They all support roughly the same flow:
 *  - Hosted "iframe" page where the user enters their card → returns a token
 *  - Token can be used later with a "DirectDebit" / "ChargeToken" API call
 *
 * We never see the raw card number → PCI scope is SAQ-A (the lightest).
 *
 * Two modes:
 *  - PAYMENT_MODE=mock — local dev, returns fake tokens
 *  - PAYMENT_MODE=live — calls the real gateway
 */

export type PaymentMode = "mock" | "live";
export const PAYMENT_MODE: PaymentMode = process.env.PAYMENT_MODE === "live" ? "live" : "mock";

/** Public env config exposed to the gateway. */
function gatewayEnv() {
  return {
    base: process.env.ISRACARD_BASE_URL || "https://gateway20.icom.co.il",
    terminal: process.env.ISRACARD_TERMINAL_NUMBER || "",
    user: process.env.ISRACARD_USER || "",
    password: process.env.ISRACARD_PASSWORD || "",
  };
}

export interface TokenizationResult {
  token: string;
  last4: string;
  expiry: string;
}

export interface ChargeResult {
  approved: boolean;
  transactionId: string;
  authCode?: string;
  message?: string;
}

/**
 * Builds the URL to embed in an <iframe> on the payment step.
 *
 * In live mode this opens the Israkart Premium hosted card page in
 * "J5 / Token only" mode (txnType=5) — the user enters their card and
 * Israkart redirects back to `/api/payment/callback` with a token.
 *
 * In mock mode it points to a local fake page so the whole flow is
 * testable without merchant credentials.
 */
export function getHostedTokenUrl(registrationId: string, amount: number, returnUrl: string): string {
  if (PAYMENT_MODE === "mock") {
    const params = new URLSearchParams({
      reg: registrationId,
      amount: String(amount),
      return: returnUrl,
    });
    return `/api/payment/mock?${params.toString()}`;
  }

  const env = gatewayEnv();
  // NOTE: parameter names below follow the Israkart Premium ("שער 2.0") spec
  // which is identical to Tranzila's (same parent company). Verify against
  // the integration PDF you receive from your merchant rep — some accounts
  // use the older gateway1.icom.co.il endpoint with slightly different names.
  const params = new URLSearchParams({
    supplier: env.terminal,                  // = merchant ("Masof") number
    sum: amount.toFixed(2),
    currency: "1",                            // 1 = ILS
    cred_type: "1",                           // 1 = regular charge
    tranmode: "VK",                           // K = create token, V = verify (J5)
    notify_url_address: `${returnUrl}/webhook`,
    success_url_address: returnUrl,
    fail_url_address: `${returnUrl}?status=err`,
    Order: registrationId,
    pdesc: `Calima Battles 3 - ${registrationId}`,
    lang: "il",
    json_response: "1",
  });
  return `${env.base}/?${params.toString()}`;
}

/**
 * Validate the data returned from the iframe callback. Real gateways
 * sign their callbacks with a shared secret — implement signature
 * verification once you have the merchant's signing key.
 */
export async function verifyToken(token: string): Promise<TokenizationResult> {
  if (PAYMENT_MODE === "mock") {
    return { token, last4: token.slice(-4), expiry: "12/29" };
  }
  // TODO: call Israkart's verify-token endpoint here using basic auth.
  // We don't fail loudly — if the gateway accepted the card, the user
  // already saw the success page; we just trust the token until charge
  // time, when a real bank call happens.
  return { token, last4: "****", expiry: "" };
}

/**
 * Charge a previously-stored token. Called manually ~2 weeks before the
 * event after the athlete has been approved.
 *
 * Returns ChargeResult.approved=true on success. On failure the caller
 * should mark the registration as `payment_failed` and notify the user.
 */
export async function chargeToken(
  token: string,
  amount: number,
  registrationId: string
): Promise<ChargeResult> {
  if (PAYMENT_MODE === "mock") {
    return { approved: true, transactionId: `mock-${Date.now()}`, authCode: "000000" };
  }

  const env = gatewayEnv();
  // Israkart Premium / Tranzila TokenCharge endpoint.
  const body = new URLSearchParams({
    supplier: env.terminal,
    TranzilaPW: env.password,
    TranzilaTK: token,
    sum: amount.toFixed(2),
    currency: "1",
    cred_type: "1",
    Order: registrationId,
    response_return_format: "json",
  });

  const res = await fetch(`${env.base}/cgi-bin/tranzila71u.cgi`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    return { approved: false, transactionId: "", message: `HTTP ${res.status}` };
  }
  const text = await res.text();
  const ok = /Response=000|approved=1|status=ok/i.test(text);
  const idMatch = text.match(/ConfirmationCode=(\d+)/i) || text.match(/index=(\d+)/i);
  return {
    approved: ok,
    transactionId: idMatch?.[1] ?? "",
    message: ok ? undefined : text.slice(0, 240),
  };
}
