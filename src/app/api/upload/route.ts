import { NextResponse } from "next/server";
import { supabaseAdmin, DOCS_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Uploads a single file to Supabase Storage and returns a public URL.
 * Type may be "health", "parent_consent" or "signature".
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kind = String(form.get("kind") || "misc");
    const regId = String(form.get("registrationId") || crypto.randomUUID());

    if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: `file type ${file.type} not allowed` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file too large (max 8MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${regId}/${kind}-${Date.now()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const sb = supabaseAdmin();
    const { error } = await sb.storage.from(DOCS_BUCKET).upload(path, buf, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = sb.storage.from(DOCS_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  } catch (err) {
    console.error("[upload] error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
