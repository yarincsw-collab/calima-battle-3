import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { registrationSchema, calcAge } from "@/lib/schema";
import { categoryById, totalPrice, CategoryId } from "@/lib/competition";
import { supabaseAdmin } from "@/lib/supabase";
import { appendRegistration } from "@/lib/googleSheets";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const registrationId = randomUUID();
    const age = calcAge(data.dob);
    const categoryIds = data.categories as CategoryId[];
    const categoryLabels = categoryIds.map((id) => categoryById(id)?.label).filter(Boolean).join(" | ");
    const price = totalPrice(categoryIds);
    const viaWa = Boolean(data.documentsViaWhatsapp);

    // Mark "send via WhatsApp" with a sentinel so admin can still see status
    // in the same column. Uploaded files get real URLs; the rest get the sentinel.
    const healthRef = data.healthDocUrl || (viaWa ? "VIA_WHATSAPP" : "");
    const parentRef = data.parentConsentUrl || (viaWa ? "VIA_WHATSAPP" : "");
    const notes = viaWa ? "מסמכים יישלחו בוואטסאפ — לא להתחיל חיוב עד שיתקבלו" : "";

    // 1. Persist to Supabase (source of truth)
    try {
      const sb = supabaseAdmin();
      const { error } = await sb.from("battles3_registrations").insert({
        id: registrationId,
        full_name: data.fullName,
        dob: data.dob,
        age,
        email: data.email,
        phone: data.phone,
        parent_name: data.parentName ?? null,
        parent_phone: data.parentPhone ?? null,
        categories: categoryIds,
        total_price: price,
        freestyle_video_url: data.freestyleVideoUrl || null,
        endurance_video_url: data.enduranceVideoUrl || null,
        health_doc_url: healthRef || null,
        parent_consent_url: parentRef || null,
        documents_via_whatsapp: viaWa,
        signature_url: data.signatureUrl,
        liability_accepted_at: new Date().toISOString(),
        payment_token: data.paymentToken,
        payment_last4: data.paymentLast4 ?? null,
        payment_expiry: data.paymentExpiry ?? null,
        payment_status: viaWa ? "pending_documents" : "pending_admin_approval",
        notes,
      });
      if (error) {
        console.error("[register] supabase insert error", error);
        // Don't bail — Sheets append is a backup of record.
      }
    } catch (err) {
      console.error("[register] supabase skipped", err);
    }

    // 2. Append to Google Sheets (admin-friendly view)
    try {
      await appendRegistration({
        registrationId,
        fullName: data.fullName,
        dob: data.dob,
        age,
        email: data.email,
        phone: data.phone,
        categories: categoryLabels,
        totalPrice: price,
        freestyleVideoUrl: data.freestyleVideoUrl || "",
        enduranceVideoUrl: data.enduranceVideoUrl || "",
        healthDocUrl: healthRef,
        parentConsentUrl: parentRef,
        signatureUrl: data.signatureUrl,
        parentName: data.parentName ?? "",
        parentPhone: data.parentPhone ?? "",
        paymentToken: data.paymentToken,
        paymentStatus: viaWa ? "pending_documents" : "pending_admin_approval",
        notes,
      });
    } catch (err) {
      console.error("[register] sheets append failed (non-fatal)", err);
    }

    return NextResponse.json({ ok: true, registrationId, totalPrice: price });
  } catch (err) {
    console.error("[register] error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
