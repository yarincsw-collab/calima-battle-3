"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  totals: Record<string, number>;
  uniques: Record<string, number>;
  totalUniqueVisitors: number;
  totalEvents: number;
  funnel: {
    pageViews: number;
    registerClicks: number;
    registrationsCompleted: number;
    viewToClickRate: number;
    clickToCompleteRate: number;
  };
  last7: { day: string; visits: number; registerClicks: number }[];
}

const EVENT_LABELS: Record<string, string> = {
  page_view: "ביקור בדף הבית",
  register_click: "לחיצה על 'הרשמה'",
  register_started: "התחיל הרשמה",
  register_completed: "השלים הרשמה",
  share_open: "פתח את כרזת השיתוף",
  share_download: "הוריד תמונה לסטורי",
  share_whatsapp: "שיתף בוואטסאפ",
  share_native: "שיתף לאינסטה / אחר",
  rules_view: "צפה בחוקים",
};

export function AnalyticsPanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { "x-admin-key": adminKey },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "שגיאה");
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminKey) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  if (!adminKey) return null;

  return (
    <div className="card p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="grunge-text text-2xl text-electric-400">📊 אנליטיקס (30 ימים)</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="text-xs text-electric-400 hover:text-electric-300 underline disabled:opacity-50"
        >
          {loading ? "טוען…" : "רענן"}
        </button>
      </div>

      {error && <div className="text-red-400 text-sm mb-3">⚠ {error}</div>}

      {!data && !error && !loading && (
        <div className="text-white/50 text-sm">אין נתונים עדיין.</div>
      )}

      {data && (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Stat label="מבקרים ייחודיים" value={data.totalUniqueVisitors} accent />
            <Stat label="כל האירועים" value={data.totalEvents} />
            <Stat label="ביקורים בדף" value={data.funnel.pageViews} />
            <Stat label="הרשמות הושלמו" value={data.funnel.registrationsCompleted} accent />
          </div>

          {/* Funnel */}
          <div className="rounded-xl border border-white/10 bg-ink-800/40 p-4 mb-6">
            <div className="text-electric-400 text-xs uppercase tracking-[0.3em] mb-3 not-italic">
              משפך המרה
            </div>
            <FunnelStep
              label="ביקור בדף"
              value={data.funnel.pageViews}
              pct={100}
            />
            <FunnelStep
              label="לחיצה על 'הרשמה'"
              value={data.funnel.registerClicks}
              pct={data.funnel.viewToClickRate}
              subtitle={`${data.funnel.viewToClickRate}% מהמבקרים`}
            />
            <FunnelStep
              label="השלמת הרשמה"
              value={data.funnel.registrationsCompleted}
              pct={data.funnel.clickToCompleteRate}
              subtitle={`${data.funnel.clickToCompleteRate}% מהלוחצים`}
            />
          </div>

          {/* Per-event breakdown */}
          <div className="rounded-xl border border-white/10 bg-ink-800/40 p-4 mb-6">
            <div className="text-electric-400 text-xs uppercase tracking-[0.3em] mb-3 not-italic">
              פירוט אירועים
            </div>
            <div className="space-y-2">
              {Object.entries(data.totals)
                .sort((a, b) => b[1] - a[1])
                .map(([event, count]) => (
                  <div
                    key={event}
                    className="flex items-center justify-between text-sm border-b border-white/5 pb-2"
                  >
                    <span className="text-white/85">
                      {EVENT_LABELS[event] || event}
                    </span>
                    <span className="text-white tabular-nums">
                      <span className="text-electric-400 font-bold">{count}</span>
                      <span className="text-white/40 text-xs ms-2">
                        ({data.uniques[event] || 0} ייחודיים)
                      </span>
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Last 7 days */}
          <div className="rounded-xl border border-white/10 bg-ink-800/40 p-4">
            <div className="text-electric-400 text-xs uppercase tracking-[0.3em] mb-3 not-italic">
              7 ימים אחרונים
            </div>
            <SimpleBars rows={data.last7} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center border ${
        accent
          ? "border-electric-500/40 bg-electric-500/10"
          : "border-white/10 bg-ink-800/40"
      }`}
    >
      <div
        className={`grunge-text text-2xl sm:text-3xl tabular-nums ${
          accent ? "text-electric-400" : "text-white"
        }`}
      >
        {value.toLocaleString("he-IL")}
      </div>
      <div className="text-white/55 text-[10px] sm:text-xs uppercase tracking-[0.15em] mt-1">
        {label}
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  pct,
  subtitle,
}: {
  label: string;
  value: number;
  pct: number;
  subtitle?: string;
}) {
  const width = Math.max(4, Math.min(100, pct));
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-white/85 text-sm font-semibold">{label}</span>
        <span className="text-white tabular-nums text-sm">
          <span className="text-electric-400 font-bold">{value}</span>
          {subtitle && <span className="text-white/40 text-xs ms-2">{subtitle}</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-electric-500 rounded-full"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function SimpleBars({
  rows,
}: {
  rows: { day: string; visits: number; registerClicks: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.visits));
  return (
    <div className="flex items-end gap-2 h-32" dir="ltr">
      {rows.map((r) => {
        const h = Math.max(2, (r.visits / max) * 100);
        const d = new Date(r.day);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        return (
          <div key={r.day} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[10px] text-white/55 tabular-nums">{r.visits}</div>
            <div
              className="w-full bg-electric-500/80 rounded-t"
              style={{ height: `${h}%` }}
              title={`${label}: ${r.visits} ביקורים, ${r.registerClicks} לחיצות הרשמה`}
            />
            <div className="text-[10px] text-white/50">{label}</div>
          </div>
        );
      })}
    </div>
  );
}
