// POST /api/track — append a single analytics event to Supabase.
// Body: { event: string, meta?: Record<string, unknown> }
// Captures user-agent + a hashed/short visitor id passed by the client.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "register_click",
  "register_started",
  "register_completed",
  "share_open",
  "share_download",
  "share_whatsapp",
  "share_native",
  "rules_view",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = typeof body.event === "string" ? body.event : "";
    if (!ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "invalid event" }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") || "";
    const ref = req.headers.get("referer") || "";
    const visitorId = typeof body.visitorId === "string" ? body.visitorId.slice(0, 64) : null;
    const path = typeof body.path === "string" ? body.path.slice(0, 200) : null;
    const meta = body.meta && typeof body.meta === "object" ? body.meta : null;

    const sb = supabaseAdmin();
    const { error } = await sb.from("analytics_events").insert({
      event,
      visitor_id: visitorId,
      path,
      meta,
      user_agent: ua.slice(0, 400),
      referer: ref.slice(0, 400),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
