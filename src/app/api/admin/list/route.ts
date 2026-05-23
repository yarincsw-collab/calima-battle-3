import { NextResponse } from "next/server";
import { loadAllRegistrations } from "@/lib/googleSheets";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY) && key === process.env.ADMIN_API_KEY;
}

/** Returns all registrations, newest first. Admin-only. */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const rows = await loadAllRegistrations();
    return NextResponse.json({ registrations: rows.reverse() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
