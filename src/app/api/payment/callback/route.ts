import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Called by iCount (or our mock page) after the user finishes entering
 * their card. We pull the tokenisation result from the query string and
 * bounce the user back to the registration page so the form picks it up.
 *
 * iCount sends back these params:
 *   cc_token, cc_last4, cc_card_type, external_id (= our registrationId)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token =
    url.searchParams.get("cc_token") ||
    url.searchParams.get("token") ||      // mock
    "";
  const last4 =
    url.searchParams.get("cc_last4") ||
    url.searchParams.get("last4") ||      // mock
    "";
  const expiry = url.searchParams.get("expiry") || "";
  const regId = url.searchParams.get("external_id") || url.searchParams.get("reg") || "";

  if (!token) {
    return NextResponse.redirect(new URL(`/register?payment=err`, req.url));
  }

  const hash = new URLSearchParams({ token, last4, expiry, reg: regId }).toString();
  return NextResponse.redirect(new URL(`/register?payment=ok#${hash}`, req.url));
}

/**
 * iCount's server-to-server webhook (notify_url) — they POST tokenisation
 * data here even if the browser redirect fails. We just acknowledge with
 * 200 OK; the actual token is still picked up via the browser redirect
 * above. Could be extended later to log to Supabase.
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
