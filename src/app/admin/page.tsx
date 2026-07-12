"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/competition";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";

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
  categoryIds: string[];
  totalPrice: number;
  freestyleVideoUrl: string;
  enduranceVideoUrl: string;
  paymentToken: string;
  paymentStatus: string;
  notes?: string;
}

const KEY_STORAGE = "calima-admin-key";
const GROUP_LINK_STORAGE = "calima-admin-group-link";
const INVITED_STORAGE = "calima-admin-invited"; // JSON array of registrationIds
const COMPETITORS_LIST_PHONE = "972543399946"; // 054-339-9946 in E.164

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [registrations, setRegistrations] = useState<Reg[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [groupLink, setGroupLink] = useState<string>("");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);

  // Load key + group state from storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(KEY_STORAGE);
    if (saved) setAdminKey(saved);
    const link = localStorage.getItem(GROUP_LINK_STORAGE);
    if (link) setGroupLink(link);
    try {
      const inv = JSON.parse(localStorage.getItem(INVITED_STORAGE) || "[]") as string[];
      setInvitedIds(new Set(inv));
    } catch {}
  }, []);

  function persistInvited(set: Set<string>) {
    localStorage.setItem(INVITED_STORAGE, JSON.stringify([...set]));
  }

  function persistGroupLink(link: string) {
    localStorage.setItem(GROUP_LINK_STORAGE, link);
    setGroupLink(link);
  }

  /** Normalise Israeli phone to E.164 (+972…) for wa.me links. */
  function toIntlPhone(raw: string): string {
    const digits = (raw || "").replace(/\D/g, "");
    return digits.startsWith("0") ? "972" + digits.slice(1) : digits;
  }

  /** Open a WhatsApp chat with an approved athlete containing the group invite link. */
  function inviteToGroup(reg: Reg) {
    if (!groupLink) {
      alert("קודם הכנס קישור הזמנה לקבוצת WhatsApp");
      return;
    }
    const msg =
      `שלום ${reg.fullName}! 🥇\n\n` +
      `זו הזמנה לקבוצת WhatsApp הרשמית של *Calima Battles 3*.\n` +
      `בקבוצה נעדכן על כל הפרטים לקראת יום התחרות (30-31.7).\n\n` +
      `לחץ להצטרפות:\n${groupLink}`;
    const url = `https://wa.me/${toIntlPhone(reg.phone)}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    // Mark as invited so the row disappears from the "pending" list
    const next = new Set(invitedIds);
    next.add(reg.registrationId);
    setInvitedIds(next);
    persistInvited(next);
  }

  function unmarkInvited(id: string) {
    const next = new Set(invitedIds);
    next.delete(id);
    setInvitedIds(next);
    persistInvited(next);
  }

  /**
   * Send a formatted competitor list (grouped by category) to a fixed phone
   * via WhatsApp deep link. Only includes approved / charged athletes.
   */
  function sendCompetitorList() {
    const rows = (registrations ?? []).filter(
      (r) => r.paymentStatus === "approved" || r.paymentStatus === "charged",
    );
    if (rows.length === 0) {
      alert("אין מתחרים מאושרים לשלוח");
      return;
    }

    // Group athletes by category label (Sheet stores multi-category joined with " | ").
    const byCat = new Map<string, string[]>();
    for (const r of rows) {
      const cats = (r.categories || "").split("|").map((c) => c.trim()).filter(Boolean);
      const target = cats.length ? cats : ["(ללא קטגוריה)"];
      for (const c of target) {
        if (!byCat.has(c)) byCat.set(c, []);
        byCat.get(c)!.push(r.fullName);
      }
    }

    // Iterate CATEGORIES in the canonical order (freestyle → endurance)
    const orderedLabels = [
      ...CATEGORIES.map((c) => c.label),
      ...[...byCat.keys()].filter((k) => !CATEGORIES.some((c) => c.label === k)),
    ];

    const lines: string[] = [
      "📋 *רשימת מתחרים מאושרים*",
      "Calima Battles 3 • 30-31.7",
      "",
    ];
    for (const cat of orderedLabels) {
      const names = byCat.get(cat);
      if (!names || names.length === 0) continue;
      lines.push(`▪️ *${cat}* (${names.length})`);
      names.forEach((n) => lines.push(`   • ${n}`));
      lines.push("");
    }
    lines.push(`סה"כ: ${rows.length} מתחרים`);

    const url = `https://wa.me/${COMPETITORS_LIST_PHONE}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank");
  }

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

  /** Move an athlete from "פרו ארצי" to "ארצי" (freestyle). */
  async function moveProToNational(reg: Reg) {
    if (!confirm(`להעביר את ${reg.fullName} מ"פרו ארצי" ל"ארצי" בפריסטייל?`)) return;
    setBusy((b) => ({ ...b, [reg.registrationId]: true }));
    try {
      const res = await fetch("/api/admin/move-category", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          registrationId: reg.registrationId,
          from: "freestyle_pro_national",
          to: "freestyle_national",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`שגיאה: ${err.error || res.status}`);
        return;
      }
      await refresh();
    } finally {
      setBusy((b) => ({ ...b, [reg.registrationId]: false }));
    }
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

  /**
   * Build a vCard (.vcf) file with all athletes matching the current filters.
   * Each contact is prefixed "Calima B3 - " so they sort together in the phone.
   * Import on iPhone/Android → add all to a WhatsApp group.
   */
  function exportContacts() {
    const rows = filtered.filter(
      (r) => r.paymentStatus === "approved" || r.paymentStatus === "charged",
    );
    if (rows.length === 0) {
      alert("אין אתלטים מאושרים בתצוגה הזו");
      return;
    }

    const vcards = rows.map((r) => {
      const parts = (r.fullName || "").trim().split(/\s+/);
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";
      const displayName = `Calima B3 - ${r.fullName}`;
      // Normalise phone to E.164 (Israel): 050... → +972 50...
      const raw = (r.phone || "").replace(/\D/g, "");
      const tel = raw.startsWith("0") ? "+972" + raw.slice(1) : raw ? "+" + raw : "";
      const note = `Battles 3 • ${r.categories} • ${r.totalPrice} ₪`;
      // vCard escaping: commas, semicolons, backslashes, newlines
      const esc = (s: string) =>
        s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${esc(last)};${esc(first)};;;`,
        `FN:${esc(displayName)}`,
        tel ? `TEL;TYPE=CELL:${tel}` : "",
        r.email ? `EMAIL:${esc(r.email)}` : "",
        `NOTE:${esc(note)}`,
        "CATEGORIES:Calima Battles 3",
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\r\n");
    });

    const vcf = vcards.join("\r\n") + "\r\n";
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calima-battles-3-contacts-${new Date().toISOString().slice(0, 10)}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <button onClick={exportContacts} className="btn-ghost text-xs not-italic">
            📇 ייצא אנשי קשר
          </button>
          <button onClick={() => setShowGroupModal(true)} className="btn-ghost text-xs not-italic">
            💬 צור קבוצה
          </button>
          <button onClick={sendCompetitorList} className="btn-ghost text-xs not-italic">
            📋 רשימת מתחרים
          </button>
          <button onClick={refresh} className="btn-ghost text-xs not-italic" disabled={loading}>
            {loading ? "מרענן..." : "🔄 רענן"}
          </button>
          <button onClick={logout} className="btn-ghost text-xs not-italic">
            יציאה
          </button>
        </div>
      </header>

      {/* Analytics */}
      <AnalyticsPanel adminKey={adminKey} />

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
              className={`px-3 py-1.5 rounded-full text-xs border ${
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
            className={`px-3 py-1.5 rounded-full text-xs border ${
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
                className={`px-3 py-1.5 rounded-full text-xs border ${
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
              onMoveProToNational={() => moveProToNational(r)}
            />
          ))}
        </div>
      )}

      {showGroupModal && (
        <GroupInviteModal
          groupLink={groupLink}
          onSaveLink={persistGroupLink}
          registrations={registrations ?? []}
          invitedIds={invitedIds}
          onInvite={inviteToGroup}
          onUnmark={unmarkInvited}
          onClose={() => setShowGroupModal(false)}
        />
      )}
    </main>
  );
}

function GroupInviteModal({
  groupLink,
  onSaveLink,
  registrations,
  invitedIds,
  onInvite,
  onUnmark,
  onClose,
}: {
  groupLink: string;
  onSaveLink: (link: string) => void;
  registrations: Reg[];
  invitedIds: Set<string>;
  onInvite: (reg: Reg) => void;
  onUnmark: (id: string) => void;
  onClose: () => void;
}) {
  const [linkInput, setLinkInput] = useState(groupLink);

  const eligible = registrations.filter(
    (r) => r.paymentStatus === "approved" || r.paymentStatus === "charged",
  );
  const pending = eligible.filter((r) => !invitedIds.has(r.registrationId));
  const invited = eligible.filter((r) => invitedIds.has(r.registrationId));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 not-italic"
      onClick={onClose}
    >
      <div
        className="card p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-electric-500/30 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="grunge-text text-2xl text-white">💬 הזמנה לקבוצה</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <div className="mb-5">
          <label className="text-white/60 text-xs uppercase tracking-widest">
            קישור הזמנה לקבוצה
          </label>
          <div className="flex gap-2 mt-2">
            <input
              type="url"
              dir="ltr"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="input-field flex-1"
            />
            <button
              onClick={() => onSaveLink(linkInput.trim())}
              className="btn-primary text-xs px-4"
              disabled={!linkInput.trim() || linkInput.trim() === groupLink}
            >
              שמור
            </button>
          </div>
          <p className="text-white/40 text-xs mt-2">
            צור קבוצה ב-WhatsApp → הגדרות קבוצה → הזמנה בקישור → העתק כאן.
          </p>
        </div>

        <div className="border-t border-white/10 my-4" />

        <div className="mb-2 text-sm text-white/70">
          <span className="text-amber-300 font-bold">{pending.length}</span> ממתינים להזמנה
          <span className="text-white/30 mx-2">•</span>
          <span className="text-emerald-300 font-bold">{invited.length}</span> הוזמנו
        </div>

        {pending.length === 0 && invited.length === 0 ? (
          <div className="text-white/40 text-center py-8">
            אין אתלטים מאושרים עדיין.
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-4">
                <div className="text-amber-300 text-xs uppercase tracking-widest mb-2">
                  ממתינים
                </div>
                <div className="space-y-2">
                  {pending.map((r) => (
                    <div
                      key={r.registrationId}
                      className="flex items-center justify-between gap-3 rounded-md border border-white/10 p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-white text-sm font-bold truncate">
                          {r.fullName}
                        </div>
                        <div className="text-white/50 text-xs truncate" dir="ltr">
                          {r.phone}
                        </div>
                        <div className="text-electric-400 text-xs truncate">
                          {r.categories}
                        </div>
                      </div>
                      <button
                        onClick={() => onInvite(r)}
                        disabled={!groupLink}
                        className="text-xs px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 disabled:opacity-30 shrink-0"
                        title={!groupLink ? "קודם שמור קישור" : ""}
                      >
                        📱 שלח הזמנה
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invited.length > 0 && (
              <div>
                <div className="text-emerald-300 text-xs uppercase tracking-widest mb-2">
                  הוזמנו
                </div>
                <div className="space-y-2">
                  {invited.map((r) => (
                    <div
                      key={r.registrationId}
                      className="flex items-center justify-between gap-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-white/80 text-sm truncate">
                          ✓ {r.fullName}
                        </div>
                        <div className="text-white/40 text-xs truncate">
                          {r.categories}
                        </div>
                      </div>
                      <button
                        onClick={() => onUnmark(r.registrationId)}
                        className="text-xs px-3 py-1 rounded-md text-white/50 hover:text-white/80 shrink-0"
                        title="הסר סימון (יופיע שוב ברשימת הממתינים)"
                      >
                        ↺ בטל
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
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
  onMoveProToNational,
}: {
  reg: Reg;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSendWhatsApp: () => void;
  onMarkPaid: () => void;
  onMoveProToNational: () => void;
}) {
  const isPro = (reg.categoryIds || []).includes("freestyle_pro_national");
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
        {isPro && (
          <button onClick={onMoveProToNational}
                  disabled={busy}
                  title="העבר מהמקצה הפרו למקצה הארצי"
                  className="text-xs px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-30 not-italic">
            ⬇ העבר לארצי
          </button>
        )}
      </div>
    </div>
  );
}
