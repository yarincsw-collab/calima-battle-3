"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/competition";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { CalisthenicsMascot } from "@/components/CalisthenicsMascot";

// Same Sheet ID we wire to the rest of the app via env on the server.
// Hard-coded here so the admin gets a one-click open link to the sheet.
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/11ExRyv5B4w3xkZx66R7uwmzCHYp84fTwv3XAj-3fy18";

interface Reg {
  rowNumber: number;
  registrationId: string;
  fullName: string;
  dob: string;
  age: number;
  email: string;
  phone: string;
  categories: string;
  totalPrice: number;
  freestyleVideoUrl: string;
  enduranceVideoUrl: string;
  paymentToken: string;
  paymentStatus: string;
  notes?: string;
}

const KEY_STORAGE = "calima-admin-key";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [registrations, setRegistrations] = useState<Reg[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  // Load key from storage on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(KEY_STORAGE) : null;
    if (saved) setAdminKey(saved);
  }, []);

  // When key changes, fetch
  useEffect(() => {
    if (adminKey) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/list", { headers: { "x-admin-key": adminKey } });
      if (res.status === 401) {
        localStorage.removeItem(KEY_STORAGE);
        setAdminKey("");
        setError("Invalid admin key");
        return;
      }
      const json = await res.json();
      setRegistrations(json.registrations ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(reg: Reg, paymentStatus: string) {
    setBusy((b) => ({ ...b, [reg.registrationId]: true }));
    try {
      await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ registrationId: reg.registrationId, paymentStatus }),
      });
      await refresh();
    } finally {
      setBusy((b) => ({ ...b, [reg.registrationId]: false }));
    }
  }

  /** Open WhatsApp with a pre-filled payment-request message to the athlete. */
  function sendWhatsApp(reg: Reg) {
    // Normalise the phone: 050-1234567 → 972501234567 for wa.me
    const raw = (reg.phone || "").replace(/\D/g, "");
    const intl = raw.startsWith("0") ? "972" + raw.slice(1) : raw;
    const msg =
      `שלום ${reg.fullName}! 🥇\n\n` +
      `הרשמתך לתחרות *Calima Battles 3* אושרה.\n` +
      `מקצה: ${reg.categories}\n` +
      `סכום לתשלום: *${reg.totalPrice} ₪*\n\n` +
      `אנא שלם דרך הקישור האישי הבא תוך 7 ימים:\n` +
      `[כאן תדביק את קישור התשלום מ-iCredit]\n\n` +
      `בהצלחה,\n` +
      `קלימה מתחם קליסטניקס`;
    const url = `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  /** Mark a registration as paid after the athlete has paid via iCredit. */
  async function markPaid(reg: Reg) {
    if (!confirm(`לסמן את ${reg.fullName} כמשולם?`)) return;
    setBusy((b) => ({ ...b, [reg.registrationId]: true }));
    try {
      await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ registrationId: reg.registrationId, paymentStatus: "charged" }),
      });
      await refresh();
    } finally {
      setBusy((b) => ({ ...b, [reg.registrationId]: false }));
    }
  }

  function submitKey() {
    localStorage.setItem(KEY_STORAGE, keyInput);
    setAdminKey(keyInput);
  }

  function logout() {
    localStorage.removeItem(KEY_STORAGE);
    setAdminKey("");
    setRegistrations(null);
  }

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const rs = registrations ?? [];
    return {
      total: rs.length,
      pending: rs.filter((r) => r.paymentStatus === "pending_admin_approval" || !r.paymentStatus).length,
      approved: rs.filter((r) => r.paymentStatus === "approved").length,
      rejected: rs.filter((r) => r.paymentStatus === "rejected").length,
      charged: rs.filter((r) => r.paymentStatus === "charged").length,
      failed: rs.filter((r) => r.paymentStatus === "payment_failed").length,
    };
  }, [registrations]);

  const filtered = useMemo(() => {
    if (!registrations) return [];
    let rows = registrations;
    // Status filter
    if (statusFilter === "pending") {
      rows = rows.filter((r) => !r.paymentStatus || r.paymentStatus === "pending_admin_approval");
    } else if (statusFilter !== "all") {
      rows = rows.filter((r) => r.paymentStatus === statusFilter);
    }
    // Category filter — Sheet stores Hebrew labels in `categories`, joined with " | "
    if (categoryFilter !== "all") {
      const targetLabel = CATEGORIES.find((c) => c.id === categoryFilter)?.label ?? "";
      rows = rows.filter((r) => r.categories.includes(targetLabel));
    }
    return rows;
  }, [registrations, statusFilter, categoryFilter]);

  /* ─── Login screen ─── */
  if (!adminKey) {
    return (
      <main className="min-h-screen bg-grunge-gradient flex items-center justify-center px-5">
        <div className="card p-8 sm:p-10 max-w-md w-full border-electric-500/30 shadow-glow">
          <h1 className="grunge-text text-3xl text-white mb-2 not-italic">לוח בקרה</h1>
          <p className="text-white/60 text-sm mb-6">הזן את ה-Admin Key מ-Railway Variables</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitKey();
            }}
          >
            <input
              type="password"
              dir="ltr"
              className="input-field"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="ADMIN_API_KEY"
              autoFocus
            />
            <button type="submit" className="btn-primary w-full mt-4 not-italic">
              כניסה
            </button>
            {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
          </form>
          <Link href="/" className="block mt-6 text-center text-white/50 text-sm hover:text-electric-400 not-italic">
            ← חזרה לאתר
          </Link>
        </div>
      </main>
    );
  }

  /* ─── Dashboard ─── */
  return (
    <main className="min-h-screen bg-ink-950 text-white px-4 sm:px-6 py-6">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="grunge-text text-3xl sm:text-4xl text-white not-italic">לוח בקרה</h1>
          <p className="text-white/50 text-sm not-italic">Calima Battles 3 — Admin</p>
        </div>
        <div className="flex items-center gap-2 not-italic">
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost text-xs not-italic"
          >
            📊 פתח Google Sheet
          </a>
          <button onClick={refresh} className="btn-ghost text-xs not-italic" disabled={loading}>
            {loading ? "מרענן..." : "🔄 רענן"}
          </button>
          <button onClick={logout} className="btn-ghost text-xs not-italic">
            יציאה
          </button>
        </div>
      </header>

      {/* Mascot + Analytics row */}
      <div className="grid lg:grid-cols-[280px,1fr] gap-4 mb-6">
        <div className="card p-3 sm:p-4 flex flex-col items-center justify-center">
          <div className="text-amber-300 text-[10px] uppercase tracking-[0.4em] mb-1 not-italic">
            ✦ Goku Calisthenics ✦
          </div>
          <CalisthenicsMascot />
          <div className="text-white/40 text-[10px] not-italic mt-1">
            הזיז את הסמן 🥋 ועקוב אחרי הקיי-מי-המה
          </div>
        </div>
        <div>
          <AnalyticsPanel adminKey={adminKey} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        <Stat label="סך הכל" value={stats.total} color="text-white" />
        <Stat label="ממתינים" value={stats.pending} color="text-amber-400" />
        <Stat label="מאושרים" value={stats.approved} color="text-emerald-400" />
        <Stat label="נדחו" value={stats.rejected} color="text-red-400" />
        <Stat label="חויבו" value={stats.charged} color="text-sky-400" />
        <Stat label="חיוב נכשל" value={stats.failed} color="text-rose-500" />
      </div>

      {/* Payment workflow help */}
      <div className="card p-4 mb-6 border-electric-500/30 not-italic">
        <div className="text-white font-bold mb-1">תהליך התשלום</div>
        <ol className="text-white/70 text-sm leading-7 list-decimal pr-5 space-y-1">
          <li>סקור הרשמה + סרטון → לחץ <span className="text-emerald-300 font-bold">✓ אשר</span> או <span className="text-red-300 font-bold">✗ דחה</span></li>
          <li>למאושר: לחץ <span className="text-electric-300 font-bold">📱 שלח דרישת תשלום</span> — ייפתח WhatsApp עם הודעה מוכנה</li>
          <li>פתח iCredit בטאב נפרד → צור קישור תשלום לסכום הנכון → העתק והדבק בהודעה → שלח</li>
          <li>כשהאתלט שילם (תראה ב-iCredit) → לחץ <span className="text-sky-300 font-bold">✓ סמן כמשולם</span></li>
        </ol>
      </div>

      {/* Status filter chips */}
      <div className="not-italic">
        <div className="text-white/50 text-xs uppercase tracking-widest mb-2">סטטוס</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { v: "all",      label: "הכל",      n: stats.total },
            { v: "pending",  label: "ממתינים",   n: stats.pending },
            { v: "approved", label: "מאושרים",   n: stats.approved },
            { v: "rejected", label: "נדחו",     n: stats.rejected },
            { v: "charged",  label: "חויבו",    n: stats.charged },
            { v: "payment_failed", label: "נכשלו", n: stats.failed },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${
                statusFilter === f.v
                  ? "bg-electric-500 text-ink-950 border-electric-500"
                  : "border-white/15 text-white/70 hover:border-electric-500/40"
              }`}
            >
              {f.label} <span className="opacity-60">({f.n})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category filter chips — match the 7 Sheet tabs */}
      <div className="not-italic">
        <div className="text-white/50 text-xs uppercase tracking-widest mb-2">מקצה</div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${
              categoryFilter === "all"
                ? "bg-electric-500 text-ink-950 border-electric-500"
                : "border-white/15 text-white/70 hover:border-electric-500/40"
            }`}
          >
            הכל
          </button>
          {CATEGORIES.map((c) => {
            const count = (registrations ?? []).filter((r) =>
              r.categories.includes(c.label)
            ).length;
            const emoji = c.id === "freestyle_pro_national"
              ? "🥇"
              : c.id.startsWith("freestyle_national") || c.id.startsWith("endurance_national")
              ? "⭐"
              : c.id.includes("_calima")
              ? "🏠"
              : "👩";
            return (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  categoryFilter === c.id
                    ? "bg-electric-500 text-ink-950 border-electric-500"
                    : "border-white/15 text-white/70 hover:border-electric-500/40"
                }`}
                title={c.label}
              >
                {emoji} {c.shortLabel} <span className="opacity-60 text-[10px]">
                  {c.day === "freestyle" ? "פריסטייל" : "סיבולת"} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {error && <div className="mb-4 text-red-400">{error}</div>}
      {!registrations ? (
        <div className="text-white/40">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="text-white/40 text-center py-10 not-italic">אין הרשמות בתצוגה הזו</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <RegRow
              key={r.registrationId}
              reg={r}
              busy={!!busy[r.registrationId]}
              onApprove={() => setStatus(r, "approved")}
              onReject={() => setStatus(r, "rejected")}
              onSendWhatsApp={() => sendWhatsApp(r)}
              onMarkPaid={() => markPaid(r)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-4 text-center">
      <div className={`grunge-text text-3xl ${color} not-italic`}>{value}</div>
      <div className="text-white/60 text-xs mt-1 not-italic">{label}</div>
    </div>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case "approved": return { label: "מאושר", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    case "rejected": return { label: "נדחה", cls: "bg-red-500/20 text-red-300 border-red-500/40" };
    case "charged": return { label: "חויב", cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" };
    case "payment_failed": return { label: "חיוב נכשל", cls: "bg-rose-700/30 text-rose-200 border-rose-500/40" };
    default: return { label: "ממתין", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
  }
}

function RegRow({
  reg,
  busy,
  onApprove,
  onReject,
  onSendWhatsApp,
  onMarkPaid,
}: {
  reg: Reg;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSendWhatsApp: () => void;
  onMarkPaid: () => void;
}) {
  const status = statusLabel(reg.paymentStatus);
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-white font-bold text-lg not-italic">{reg.fullName} <span className="text-white/40 text-sm">• {reg.age}</span></div>
          <div className="text-white/60 text-sm" dir="ltr">{reg.email} · {reg.phone}</div>
          <div className="text-electric-400 text-xs mt-1 not-italic">{reg.categories}</div>
        </div>
        <div className="text-end">
          <span className={`inline-block px-3 py-1 rounded-full text-xs border ${status.cls} not-italic`}>
            {status.label}
          </span>
          <div className="grunge-text text-2xl text-white mt-1 not-italic">{reg.totalPrice} ₪</div>
        </div>
      </div>

      {/* Video links */}
      {(reg.freestyleVideoUrl || reg.enduranceVideoUrl) && (
        <div className="flex flex-wrap gap-2 my-2 not-italic">
          {reg.freestyleVideoUrl && (
            <a href={reg.freestyleVideoUrl} target="_blank" rel="noreferrer"
               className="text-xs px-3 py-1 rounded-full border border-electric-500/40 text-electric-400 hover:bg-electric-500/10">
              🎬 פריסטייל
            </a>
          )}
          {reg.enduranceVideoUrl && (
            <a href={reg.enduranceVideoUrl} target="_blank" rel="noreferrer"
               className="text-xs px-3 py-1 rounded-full border border-electric-500/40 text-electric-400 hover:bg-electric-500/10">
              🎬 סיבולת
            </a>
          )}
        </div>
      )}

      {reg.notes && (
        <div className="text-xs text-white/45 mt-2 not-italic">📝 {reg.notes}</div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={onApprove} disabled={busy || reg.paymentStatus === "approved"}
                className="text-xs px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-30 not-italic">
          ✓ אשר
        </button>
        <button onClick={onReject} disabled={busy || reg.paymentStatus === "rejected"}
                className="text-xs px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 disabled:opacity-30 not-italic">
          ✗ דחה
        </button>
        <button onClick={onSendWhatsApp}
                disabled={busy || reg.paymentStatus !== "approved" || reg.totalPrice === 0}
                className="text-xs px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 disabled:opacity-30 not-italic">
          📱 שלח דרישת תשלום
        </button>
        <button onClick={onMarkPaid}
                disabled={busy || reg.paymentStatus === "charged" || reg.paymentStatus === "rejected"}
                className="text-xs px-3 py-1.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 disabled:opacity-30 not-italic">
          ✓ סמן כמשולם
        </button>
      </div>
    </div>
  );
}
