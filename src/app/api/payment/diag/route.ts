import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Diagnostic endpoint — confirms which iCount account our env vars actually
 * authenticate against. Calls iCount's `info/whoami`-style ping and returns
 * the raw response so we can see the exact error.
 *
 * Protected by ADMIN_API_KEY so it can't be probed publicly.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const adminKey = url.searchParams.get("key") || req.headers.get("x-admin-key");
  if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cid = process.env.ICOUNT_CID;
  const user = process.env.ICOUNT_USER;
  const api_token = process.env.ICOUNT_API_TOKEN;

  const present = {
    ICOUNT_CID: cid ? `set (${cid.length} chars)` : "MISSING",
    ICOUNT_USER: user ? `set (${user.length} chars)` : "MISSING",
    ICOUNT_API_TOKEN: api_token ? `set (${api_token.length} chars)` : "MISSING",
  };

  // Try a minimal authenticated call — info/account is free + lightweight
  try {
    const res = await fetch("https://api.icount.co.il/api/v3.php/client/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid, user, api_token }),
    });
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    return NextResponse.json({ present, httpStatus: res.status, response: parsed });
  } catch (err) {
    return NextResponse.json({ present, error: (err as Error).message }, { status: 500 });
  }
}
