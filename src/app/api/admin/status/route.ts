import { NextResponse } from "next/server";
import { updateRegistrationStatus } from "@/lib/googleSheets";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY) && key === process.env.ADMIN_API_KEY;
}

/**
 * Update payment status (and optional notes) for a registration.
 *   POST /api/admin/status
 *   Headers: x-admin-key: <ADMIN_API_KEY>
 *   Body:    { registrationId, paymentStatus, notes? }
 */
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { registrationId, paymentStatus, notes } = (await req.json()) as {
      registrationId?: string;
      paymentStatus?: string;
      notes?: string;
    };
    if (!registrationId) {
      return NextResponse.json({ error: "registrationId required" }, { status: 400 });
    }
    await updateRegistrationStatus(registrationId, { paymentStatus, notes });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
