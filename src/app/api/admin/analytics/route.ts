// GET /api/admin/analytics — aggregated analytics for the admin dashboard.
// Returns: total events, unique visitors, conversion funnel, last 7 days breakdown.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EventRow {
  event: string;
  visitor_id: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const sb = supabaseAdmin();

    // Pull events from the last 30 days (cap rows so it stays cheap)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await sb
      .from("analytics_events")
      .select("event, visitor_id, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []) as EventRow[];

    // Totals per event
    const totals: Record<string, number> = {};
    const uniquePerEvent: Record<string, Set<string>> = {};
    for (const r of rows) {
      totals[r.event] = (totals[r.event] || 0) + 1;
      if (!uniquePerEvent[r.event]) uniquePerEvent[r.event] = new Set();
      if (r.visitor_id) uniquePerEvent[r.event].add(r.visitor_id);
    }
    const uniques: Record<string, number> = {};
    for (const k of Object.keys(uniquePerEvent)) {
      uniques[k] = uniquePerEvent[k].size;
    }

    // Total unique visitors (any event)
    const allVisitors = new Set<string>();
    for (const r of rows) if (r.visitor_id) allVisitors.add(r.visitor_id);

    // Last 7 days time series (by day)
    const dayKey = (iso: string) => iso.slice(0, 10); // YYYY-MM-DD
    const last7: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      last7.push(d.toISOString().slice(0, 10));
    }
    const dailyVisits: Record<string, number> = {};
    const dailyRegisterClicks: Record<string, number> = {};
    for (const day of last7) {
      dailyVisits[day] = 0;
      dailyRegisterClicks[day] = 0;
    }
    for (const r of rows) {
      const day = dayKey(r.created_at);
      if (!(day in dailyVisits)) continue;
      if (r.event === "page_view") dailyVisits[day]++;
      if (r.event === "register_click") dailyRegisterClicks[day]++;
    }

    // Conversion funnel
    const pageViews = totals["page_view"] || 0;
    const registerClicks = totals["register_click"] || 0;
    const registrationsCompleted = totals["register_completed"] || 0;

    return NextResponse.json({
      totals,
      uniques,
      totalUniqueVisitors: allVisitors.size,
      totalEvents: rows.length,
      funnel: {
        pageViews,
        registerClicks,
        registrationsCompleted,
        viewToClickRate: pageViews ? +((registerClicks / pageViews) * 100).toFixed(1) : 0,
        clickToCompleteRate: registerClicks
          ? +((registrationsCompleted / registerClicks) * 100).toFixed(1)
          : 0,
      },
      last7: last7.map((day) => ({
        day,
        visits: dailyVisits[day],
        registerClicks: dailyRegisterClicks[day],
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
