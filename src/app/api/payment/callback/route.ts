import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Called by iCredit (or our mock page) after the user finishes entering
 * their card. We pull the tokenisation result from the query string and
 * bounce the user back to the registration page so the form picks it up.
 *
 * iCredit sends params via querystring on success redirect, including:
 *   Token              — the saved card token (use this later to charge)
 *   SaleId / Id        — internal iCredit transaction id
 *   Custom1            — the value we sent (= our registrationId)
 *   CardLast4Digits    — last 4 digits for display
 *   CardExp            — card expiry mm/yy
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token =
    url.searchParams.get("Token") ||
    url.searchParams.get("CardToken") ||
    url.searchParams.get("token") || // mock
    "";
  const last4 =
    url.searchParams.get("CardLast4Digits") ||
    url.searchParams.get("Last4") ||
    url.searchParams.get("last4") || // mock
    "";
  const expiry =
    url.searchParams.get("CardExp") ||
    url.searchParams.get("expiry") ||
    "";
  const regId =
    url.searchParams.get("Custom1") ||
    url.searchParams.get("external_id") ||
    url.searchParams.get("reg") ||
    "";

  if (!token) {
    return NextResponse.redirect(new URL(`/register?payment=err`, req.url));
  }

  const hash = new URLSearchParams({ token, last4, expiry, reg: regId }).toString();
  return NextResponse.redirect(new URL(`/register?payment=ok#${hash}`, req.url));
}

/**
 * iCredit's server-to-server IPN — they POST tokenisation data here even if
 * the browser redirect fails. We acknowledge with 200; the actual token is
 * captured via the browser redirect above.
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
