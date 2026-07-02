import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { updateRegistrationStatus } from "@/lib/googleSheets";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY) && key === process.env.ADMIN_API_KEY;
}

/**
 * Update payment status (and optional notes) for a registration.
 * Writes to Supabase (source of truth) + best-effort mirror to Google Sheets.
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

    // 1. Supabase (source of truth)
    const sb = supabaseAdmin();
    const patch: Record<string, unknown> = {};
    if (paymentStatus !== undefined) patch.payment_status = paymentStatus;
    if (notes !== undefined) patch.notes = notes;
    const { error } = await sb
      .from("battles3_registrations")
      .update(patch)
      .eq("id", registrationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 2. Best-effort mirror to Google Sheets (don't fail if it errors)
    try {
      await updateRegistrationStatus(registrationId, { paymentStatus, notes });
    } catch (err) {
      console.error("[admin/status] sheets mirror failed (non-fatal)", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
