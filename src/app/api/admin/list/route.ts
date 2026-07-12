import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { categoryById, CategoryId } from "@/lib/competition";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_API_KEY) && key === process.env.ADMIN_API_KEY;
}

/** Returns all registrations from Supabase (source of truth), newest first. */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("battles3_registrations")
      .select(
        "id, full_name, dob, age, email, phone, categories, total_price, freestyle_video_url, endurance_video_url, payment_token, payment_status, notes, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const registrations = (data || []).map((r, idx) => {
      const cats = (r.categories || []) as CategoryId[];
      const labels = cats
        .map((id) => categoryById(id)?.label)
        .filter(Boolean)
        .join(" | ");
      return {
        rowNumber: idx + 2,
        registrationId: r.id ?? "",
        fullName: r.full_name ?? "",
        dob: r.dob ?? "",
        age: Number(r.age) || 0,
        email: r.email ?? "",
        phone: r.phone ?? "",
        categories: labels,
        categoryIds: cats,
        totalPrice: Number(r.total_price) || 0,
        freestyleVideoUrl: r.freestyle_video_url ?? "",
        enduranceVideoUrl: r.endurance_video_url ?? "",
        paymentToken: r.payment_token ?? "",
        paymentStatus: r.payment_status ?? "",
        notes: r.notes ?? "",
      };
    });

    return NextResponse.json({ registrations });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
