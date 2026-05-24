import { NextResponse } from "next/server";
import { createTokenIframe } from "@/lib/icredit";

export const runtime = "nodejs";

/**
 * Called from the registration form's payment step. We ask iCount for a
 * tokenisation iframe URL — server-side because the API token must never
 * touch the browser — and return the URL to embed.
 *
 *   POST /api/payment/init
 *   Body: { registrationId, amount, fullName, email }
 *   Response: { iframe_url }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      registrationId: string;
      amount: number;
      fullName: string;
      email: string;
    };

    if (!body.registrationId || !body.amount || !body.email) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    // Build the public origin. Railway proxies traffic to 0.0.0.0:8080 internally,
    // so req.url returns "https://localhost:8080" which is unusable as a callback.
    // Prefer the proxy headers; fall back to a manually-set NEXT_PUBLIC_APP_URL.
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (host ? `${proto}://${host}` : new URL(req.url).origin);
    const result = await createTokenIframe({
      registrationId: body.registrationId,
      amount: body.amount,
      customerName: body.fullName,
      customerEmail: body.email,
      notifyUrl: `${origin}/api/payment/callback`,
      successUrl: `${origin}/api/payment/callback`,
      failureUrl: `${origin}/register?payment=err`,
    });

    return NextResponse.json({ iframe_url: result.iframe_url });
  } catch (err) {
    console.error("[payment/init]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
