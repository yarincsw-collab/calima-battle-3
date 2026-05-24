import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Diagnostic endpoint — confirms our iCredit + Rivhit credentials work.
 * Protected by ADMIN_API_KEY so it's not publicly probable.
 *
 *   GET /api/payment/diag?key=<ADMIN_API_KEY>
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const adminKey = url.searchParams.get("key") || req.headers.get("x-admin-key");
  if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const icreditToken = process.env.ICREDIT_GROUP_PRIVATE_TOKEN;
  const rivhitToken = process.env.RIVHIT_API_TOKEN;

  const present = {
    ICREDIT_GROUP_PRIVATE_TOKEN: icreditToken ? `set (${icreditToken.length} chars)` : "MISSING",
    RIVHIT_API_TOKEN: rivhitToken ? `set (${rivhitToken.length} chars)` : "MISSING",
    PAYMENT_MODE: process.env.PAYMENT_MODE || "(default: mock)",
  };

  // Test iCredit: try requesting a tiny iframe URL to verify auth.
  let icreditResult: unknown = "(skipped — token missing)";
  if (icreditToken) {
    try {
      const res = await fetch("https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          GroupPrivateToken: icreditToken,
          SaleType: 4,
          Currency: 1,
          Amount: 1,
          CustomerFirstName: "Diag",
          CustomerLastName: "Test",
          EmailAddress: "diag@calima.local",
          Items: [{ Id: "diag", Description: "Diag", Quantity: 1, Price: 1, ItemType: 1 }],
          IPNURL: "https://example.com/ipn",
          RedirectURL: "https://example.com/ok",
        }),
      });
      const text = await res.text();
      try {
        icreditResult = { httpStatus: res.status, body: JSON.parse(text) };
      } catch {
        icreditResult = { httpStatus: res.status, body: text.slice(0, 400) };
      }
    } catch (err) {
      icreditResult = { error: (err as Error).message };
    }
  }

  return NextResponse.json({ present, icredit: icreditResult });
}
