import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { CategoryId, totalPrice } from "@/lib/competition";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY) && key === process.env.ADMIN_API_KEY;
}

/**
 * Replace one category with another for a registration (in-place).
 * Recomputes total_price from the new category set.
 *   POST /api/admin/move-category
 *   Headers: x-admin-key: <ADMIN_API_KEY>
 *   Body:    { registrationId, from: CategoryId, to: CategoryId }
 */
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { registrationId, from, to } = (await req.json()) as {
      registrationId?: string;
      from?: CategoryId;
      to?: CategoryId;
    };
    if (!registrationId || !from || !to) {
      return NextResponse.json({ error: "registrationId, from, to required" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { data: row, error: readErr } = await sb
      .from("battles3_registrations")
      .select("categories")
      .eq("id", registrationId)
      .single();
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

    const current = (row?.categories || []) as CategoryId[];
    if (!current.includes(from)) {
      return NextResponse.json({ error: `not registered to ${from}` }, { status: 400 });
    }
    // Replace `from` with `to`, de-dupe in case athlete is already in `to`
    const next = Array.from(new Set(current.map((c) => (c === from ? to : c))));
    const newTotal = totalPrice(next);

    const { error: updErr } = await sb
      .from("battles3_registrations")
      .update({ categories: next, total_price: newTotal })
      .eq("id", registrationId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, categories: next, totalPrice: newTotal });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
