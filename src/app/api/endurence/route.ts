import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { categoryById, CategoryId } from "@/lib/competition";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const categoryId = body.categoryId;

    if (!fullName || !phone || typeof categoryId !== "string" || !categoryId.trim()) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const category = categoryById(categoryId as CategoryId);
    if (!category) {
      return NextResponse.json({ error: "invalid_category" }, { status: 400 });
    }

    const registrationId = randomUUID();
    const email = `${categoryId}.${phone.replace(/\D/g, "")}@calima-local.invalid`;

    const sb = supabaseAdmin();
    const { error } = await sb.from("battles3_registrations").insert({
      id: registrationId,
      full_name: fullName,
      dob: "1970-01-01",
      age: null,
      email,
      phone,
      categories: [categoryId],
      total_price: category.price,
      payment_status: "pending_admin_approval",
      notes: `Endurance registration submitted from /endurence (${category.label})`,
    });

    if (error) {
      console.error("[endurence] supabase insert error", error);
      return NextResponse.json({ error: "db_insert_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, registrationId });
  } catch (err) {
    console.error("[endurence] error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
