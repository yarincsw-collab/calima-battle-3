import { NextResponse } from "next/server";
import { chargeToken } from "@/lib/isracard";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Admin-only endpoint. Charges a single registration's saved token.
 * Call this from the cron / admin tool ~2 weeks before the competition.
 *
 *   POST /api/payment/charge
 *   Headers: x-admin-key: <ADMIN_API_KEY>
 *   Body: { "registrationId": "..." }
 */
export async function POST(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { registrationId } = (await req.json().catch(() => ({}))) as { registrationId?: string };
  if (!registrationId) return NextResponse.json({ error: "registrationId required" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: reg, error } = await sb
    .from("battles3_registrations")
    .select("id,payment_token,total_price,payment_status")
    .eq("id", registrationId)
    .single();
  if (error || !reg) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!reg.payment_token) return NextResponse.json({ error: "no_token" }, { status: 400 });
  if (reg.payment_status === "charged") return NextResponse.json({ ok: true, alreadyCharged: true });

  const result = await chargeToken(reg.payment_token, Number(reg.total_price), reg.id);

  await sb
    .from("battles3_registrations")
    .update({
      payment_status: result.approved ? "charged" : "payment_failed",
      charged_at: result.approved ? new Date().toISOString() : null,
      charge_transaction_id: result.transactionId,
      notes: result.approved ? null : result.message ?? "charge failed",
    })
    .eq("id", reg.id);

  return NextResponse.json(result, { status: result.approved ? 200 : 402 });
}
