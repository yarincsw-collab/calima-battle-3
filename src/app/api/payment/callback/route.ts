import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/isracard";

export const runtime = "nodejs";

/**
 * Called by Israkart when the user finishes entering their card on the
 * hosted iframe. We verify the token and bounce the user back to the
 * registration page with the token in the URL hash so the form can
 * pick it up and submit.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("TranzilaTK") || url.searchParams.get("token") || "";
  const last4 = url.searchParams.get("ccno_last4") || "";
  const expiry = url.searchParams.get("expdate") || "";
  const regId = url.searchParams.get("Order") || "";

  if (!token) return NextResponse.redirect(new URL(`/register?payment=err`, req.url));

  try {
    await verifyToken(token);
  } catch (err) {
    console.error("[payment/callback] verify failed", err);
    return NextResponse.redirect(new URL(`/register?payment=err`, req.url));
  }

  const hash = new URLSearchParams({ token, last4, expiry, reg: regId }).toString();
  return NextResponse.redirect(new URL(`/register?payment=ok#${hash}`, req.url));
}
