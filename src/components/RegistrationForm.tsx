"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  FREESTYLE_CATEGORIES,
  ENDURANCE_CATEGORIES,
  CategoryId,
  categoryById,
  totalPrice,
  COMPETITION,
} from "@/lib/competition";
import { calcAge, isYoutubeUrl } from "@/lib/schema";
import { FileDrop } from "./FileDrop";
import { SignaturePad } from "./SignaturePad";
import { CheckIcon, ArrowLeftIcon } from "./icons";

type Step = 1 | 2 | 3 | 4 | 5;

interface FormState {
  categories: CategoryId[];
  isCalimaMember: boolean;
  fullName: string;
  dob: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  freestyleVideoUrl: string;
  enduranceVideoUrl: string;
  healthDocUrl: string;
  parentConsentUrl: string;
  documentsViaWhatsapp: boolean;
  signatureDataUrl: string | null;
  signatureUrl: string;
  liabilityAccepted: boolean;
}

const emptyState: FormState = {
  categories: [],
  isCalimaMember: false,
  fullName: "",
  dob: "",
  email: "",
  phone: "",
  parentName: "",
  parentPhone: "",
  freestyleVideoUrl: "",
  enduranceVideoUrl: "",
  healthDocUrl: "",
  parentConsentUrl: "",
  documentsViaWhatsapp: false,
  signatureDataUrl: null,
  signatureUrl: "",
  liabilityAccepted: false,
};

/**
 * Compute the price applying the Calima-member discount.
 * Regular Calima members get free entry to the women's endurance category.
 */
function priceWithMemberDiscount(ids: CategoryId[], isMember: boolean): number {
  return ids.reduce((sum, id) => {
    const cat = categoryById(id);
    if (!cat) return sum;
    if (isMember && id === "endurance_women") return sum; // free for members
    return sum + cat.price;
  }, 0);
}

export function RegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<FormState>(emptyState);
  const [registrationId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `tmp-${Date.now()}`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const age = state.dob ? calcAge(state.dob) : null;
  const isMinor = age !== null && age < 18;
  const price = useMemo(
    () => priceWithMemberDiscount(state.categories, state.isCalimaMember),
    [state.categories, state.isCalimaMember]
  );

  const hasFreestyle = state.categories.some(
    (id) => categoryById(id)?.day === "freestyle"
  );
  const hasEndurance = state.categories.some(
    (id) => categoryById(id)?.day === "endurance"
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function toggleCategory(id: CategoryId) {
    setState((s) =>
      s.categories.includes(id)
        ? { ...s, categories: s.categories.filter((c) => c !== id) }
        : { ...s, categories: [...s.categories, id] }
    );
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return state.categories.length > 0;
      case 2:
        return (
          state.fullName.trim().length > 1 &&
          /^\d{4}-\d{2}-\d{2}$/.test(state.dob) &&
          /\S+@\S+\.\S+/.test(state.email) &&
          /^0\d{1,2}[-\s]?\d{7}$/.test(state.phone) &&
          (!isMinor ||
            (state.parentName.trim().length > 1 && /^0\d{1,2}[-\s]?\d{7}$/.test(state.parentPhone)))
        );
      case 3:
        // Videos required per discipline picked
        if (hasFreestyle && !isYoutubeUrl(state.freestyleVideoUrl)) return false;
        if (hasEndurance && !isYoutubeUrl(state.enduranceVideoUrl)) return false;
        return true;
      case 4:
        if (state.documentsViaWhatsapp) return true;
        return Boolean(state.healthDocUrl) && (!isMinor || Boolean(state.parentConsentUrl));
      case 5:
        return state.liabilityAccepted && Boolean(state.signatureDataUrl);
      default:
        return false;
    }
  }

  async function uploadSignature(): Promise<string | null> {
    if (!state.signatureDataUrl) return null;
    if (state.signatureUrl) return state.signatureUrl;
    // Convert data-url to blob and upload via /api/upload
    const blob = await (await fetch(state.signatureDataUrl)).blob();
    const file = new File([blob], "signature.png", { type: "image/png" });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "signature");
    fd.append("registrationId", registrationId);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "signature upload failed");
    update("signatureUrl", json.url);
    return json.url as string;
  }

  async function submitFinal() {
    setSubmitting(true);
    setError(null);
    try {
      const signatureUrl = await uploadSignature();
      if (!signatureUrl) throw new Error("חתימה לא הועלתה");

      const payload = {
        categories: state.categories,
        isCalimaMember: state.isCalimaMember,
        fullName: state.fullName,
        dob: state.dob,
        email: state.email,
        phone: state.phone,
        parentName: state.parentName || undefined,
        parentPhone: state.parentPhone || undefined,
        freestyleVideoUrl: hasFreestyle ? state.freestyleVideoUrl : "",
        enduranceVideoUrl: hasEndurance ? state.enduranceVideoUrl : "",
        healthDocUrl: state.healthDocUrl || "",
        parentConsentUrl: state.parentConsentUrl || "",
        documentsViaWhatsapp: state.documentsViaWhatsapp,
        signatureUrl,
        liabilityAccepted: true as const,
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "submission failed");
      router.push(`/success?id=${json.registrationId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Stepper step={step} />

      <div className="card p-6 sm:p-8 mt-6">
        {step === 1 && (
          <StepCategories
            selected={state.categories}
            onToggle={toggleCategory}
            isCalimaMember={state.isCalimaMember}
            onMemberToggle={(v) => update("isCalimaMember", v)}
          />
        )}

        {step === 2 && (
          <StepPersonal
            state={state}
            update={update}
            isMinor={isMinor}
            age={age}
          />
        )}

        {step === 3 && (
          <StepVideos
            state={state}
            update={update}
            hasFreestyle={hasFreestyle}
            hasEndurance={hasEndurance}
          />
        )}

        {step === 4 && (
          <StepDocuments
            state={state}
            registrationId={registrationId}
            isMinor={isMinor}
            onHealth={(url) => update("healthDocUrl", url)}
            onParentConsent={(url) => update("parentConsentUrl", url)}
            onToggleWhatsapp={(v) => update("documentsViaWhatsapp", v)}
          />
        )}

        {step === 5 && (
          <StepWaiver
            accepted={state.liabilityAccepted}
            onAccept={(v) => update("liabilityAccepted", v)}
            onSign={(dataUrl) => update("signatureDataUrl", dataUrl)}
          />
        )}

        {error && <div className="mt-4 text-sm text-red-400">⚠ {error}</div>}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            disabled={step === 1}
            className="btn-ghost disabled:opacity-30"
          >
            חזרה
          </button>

          {step < 5 ? (
            <button
              type="button"
              disabled={!canAdvance()}
              onClick={() => setStep((s) => ((s + 1) as Step))}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              המשך
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canAdvance() || submitting}
              onClick={submitFinal}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "שולח..." : "סיים הרשמה"}
              <CheckIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── stepper */
function Stepper({ step }: { step: Step }) {
  const labels = ["מקצה", "פרטים", "סרטון", "מסמכים", "אחריות"];
  return (
    <ol className="flex items-center gap-2 text-xs sm:text-sm">
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const active = n === step;
        const done = n < step;
        return (
          <li key={label} className="flex-1 flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold transition ${
                done
                  ? "bg-electric-500 border-electric-500 text-ink-950"
                  : active
                  ? "border-electric-500 text-electric-400"
                  : "border-white/15 text-white/40"
              }`}
            >
              {done ? <CheckIcon className="w-4 h-4" /> : n}
            </span>
            <span
              className={`hidden sm:inline ${active ? "text-white" : done ? "text-electric-400" : "text-white/40"}`}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <span className={`flex-1 h-px ${n < step ? "bg-electric-500/60" : "bg-white/10"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ─────────────────────────────────────── step 1 — categories */
function StepCategories({
  selected,
  onToggle,
  isCalimaMember,
  onMemberToggle,
}: {
  selected: CategoryId[];
  onToggle: (id: CategoryId) => void;
  isCalimaMember: boolean;
  onMemberToggle: (v: boolean) => void;
}) {
  const total = priceWithMemberDiscount(selected, isCalimaMember);
  const showMemberOption = selected.includes("endurance_women");
  return (
    <div>
      <StepTitle title="בחר מקצה" subtitle="אפשר להירשם גם לפריסטייל וגם לסיבולת. בחר את המקצים שלך:" />

      {/* Advisory: how the organisation classifies athletes between levels */}
      <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-400/[0.06] p-4 text-sm leading-7">
        <div className="font-bold text-amber-200 mb-1 flex items-center gap-2">
          <span>⚡</span>
          <span>הערה חשובה לגבי סיווג לרמות בפריסטייל</span>
        </div>
        <p className="text-white/80">
          הארגון רשאי לסווג מתחרים בין הרמות לפי שיקול דעתו ולפי סרטון הקבלה.
          <span className="text-amber-200 font-semibold"> מומלץ להירשם לקטגוריה פרו ארצי</span> —
          אם לא תתקבל לקטגוריה זו, נבחן את האפשרות לאשר אותך לקטגוריה ארצי.
        </p>
        <p className="mt-2 text-white/65 text-xs">
          ⚠ אם תירשם מראש לקטגוריה ארצי — גם אם רמתך תאפשר זאת — <span className="text-white">לא נוכל להעלות אותך לרמה מעל</span>.
          לכן עדיפות להירשם לפרו ארצי.
        </p>
      </div>

      <div className="space-y-6">
        <CategoryGroup title="יום חמישי 30.7 · פריסטייל" cats={FREESTYLE_CATEGORIES} selected={selected} onToggle={onToggle} />
        <CategoryGroup title="יום שישי 31.7 · סיבולת" cats={ENDURANCE_CATEGORIES} selected={selected} onToggle={onToggle} />
      </div>

      {showMemberOption && (
        <button
          type="button"
          onClick={() => onMemberToggle(!isCalimaMember)}
          role="switch"
          aria-checked={isCalimaMember}
          className={`mt-5 w-full flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition text-start ${
            isCalimaMember
              ? "bg-electric-500/15 border-electric-500/70"
              : "bg-ink-800 border-white/15 hover:border-white/30"
          }`}
        >
          <div>
            <div className="text-white font-bold text-sm sm:text-base">
              אני מתאמנת קבוע במתחם קלימה
            </div>
            <div className="text-white/65 text-xs sm:text-sm mt-0.5 leading-6">
              מתאמנות קבועות זכאיות להשתתפות <span className="text-electric-400 font-bold">חינם</span> במקצה סיבולת נשים
            </div>
          </div>
          <span
            className={`relative w-14 h-7 rounded-full transition flex-shrink-0 ${
              isCalimaMember ? "bg-electric-500" : "bg-white/25"
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition ${
                isCalimaMember ? "end-0.5" : "start-0.5"
              }`}
            />
          </span>
        </button>
      )}

      <div className="mt-6 flex items-center justify-between p-4 rounded-lg bg-electric-500/10 border border-electric-500/30">
        <span className="text-white/85">סה״כ להרשמה</span>
        <span className="grunge-text text-3xl text-electric-400">
          {total === 0 ? "חינם" : `${total} ₪`}
        </span>
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  cats,
  selected,
  onToggle,
}: {
  title: string;
  cats: typeof CATEGORIES;
  selected: CategoryId[];
  onToggle: (id: CategoryId) => void;
}) {
  return (
    <div>
      <div className="text-electric-400 text-sm uppercase tracking-widest mb-3">{title}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {cats.map((c) => {
          const checked = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className={`text-right p-4 rounded-lg border transition ${
                checked
                  ? "border-electric-500 bg-electric-500/10 shadow-glow"
                  : "border-white/10 bg-ink-800 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-white">{c.shortLabel}</div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${checked ? "bg-electric-500 border-electric-500" : "border-white/30"}`}>
                  {checked && <CheckIcon className="w-3.5 h-3.5 text-ink-950" />}
                </div>
              </div>
              <div className="mt-1 text-xs text-white/60">{c.description}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-white/40">{c.slots} מקומות</span>
                <span className="text-electric-400 font-bold">{c.price === 0 ? "ללא עלות" : `${c.price} ₪`}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── step 2 — personal */
function StepPersonal({
  state,
  update,
  isMinor,
  age,
}: {
  state: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  isMinor: boolean;
  age: number | null;
}) {
  return (
    <div>
      <StepTitle title="פרטים אישיים" subtitle="כל המידע נשמר מאובטח ומשמש לתחרות בלבד." />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="שם מלא">
          <input className="input-field" value={state.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="ישראל ישראלי" />
        </Field>
        <Field label="תאריך לידה">
          <input type="date" className="input-field" value={state.dob} onChange={(e) => update("dob", e.target.value)} />
          {age !== null && <span className="text-xs text-white/50">גיל: {age}{isMinor ? " · קטין — נדרש אישור הורים" : ""}</span>}
        </Field>
        <Field label="מייל">
          <input type="email" className="input-field" value={state.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="טלפון">
          <input type="tel" className="input-field" value={state.phone} onChange={(e) => update("phone", e.target.value)} placeholder="050-1234567" />
        </Field>

        {isMinor && (
          <>
            <Field label="שם הורה / אפוטרופוס">
              <input className="input-field" value={state.parentName} onChange={(e) => update("parentName", e.target.value)} />
            </Field>
            <Field label="טלפון הורה">
              <input type="tel" className="input-field" value={state.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} placeholder="052-7654321" />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-white/90 mb-1">{label}</span>
      {children}
    </label>
  );
}

/* ─────────────────────────────────────── step 3 — qualifying videos */
function StepVideos({
  state,
  update,
  hasFreestyle,
  hasEndurance,
}: {
  state: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  hasFreestyle: boolean;
  hasEndurance: boolean;
}) {
  const freestyleValid =
    !state.freestyleVideoUrl || isYoutubeUrl(state.freestyleVideoUrl);
  const enduranceValid =
    !state.enduranceVideoUrl || isYoutubeUrl(state.enduranceVideoUrl);

  return (
    <div>
      <StepTitle
        title="סרטון קבלה לתחרות"
        subtitle="העלה את הסרטון ליוטיוב (ציבורי או 'לא רשום' / Unlisted), עד דקה, ללא עריכה. הצוות יצפה וישפוט לפי חוקי התחרות."
      />

      <div className="space-y-6">
        {hasFreestyle && (
          <div className="card p-5 border-electric-500/20">
            <div className="flex items-center justify-between gap-3">
              <h3 className="grunge-text text-2xl text-electric-400">פריסטייל</h3>
              <a
                href="/judging-freestyle.pdf"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-electric-400 underline hover:text-electric-300"
              >
                חוקי השפיטה (PDF)
              </a>
            </div>
            <p className="mt-2 text-sm text-white/65 leading-6">
              קישור יוטיוב ציבורי או "לא רשום" (Unlisted) לסרטון <span className="text-white font-bold">לא ערוך</span> עד דקה.
              שפיטה לפי קובץ ה-PDF המצורף.
            </p>
            <Field label="קישור יוטיוב — פריסטייל">
              <input
                dir="ltr"
                type="url"
                className="input-field"
                placeholder="https://youtu.be/..."
                value={state.freestyleVideoUrl}
                onChange={(e) => update("freestyleVideoUrl", e.target.value)}
              />
            </Field>
            {!freestyleValid && (
              <div className="mt-1 text-xs text-red-400">הקישור חייב להיות לסרטון יוטיוב חוקי</div>
            )}
          </div>
        )}

        {hasEndurance && (
          <div className="card p-5 border-electric-500/20">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="grunge-text text-2xl text-electric-400">סיבולת</h3>
              <a
                href="/rules#qualification"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-electric-400 underline hover:text-electric-300 not-italic"
              >
                שיטת הניקוד המלאה + חוקים
              </a>
            </div>
            <p className="mt-2 text-sm text-white/65 leading-6">
              צלם את עצמך <span className="text-white font-bold">דקה אחת (60 שניות)</span> משיג כמה שיותר נקודות —
              שילוב חופשי של תרגילים, ללא עריכה. הצוות יפסול חזרות לא תקינות לפי חוקי השיפוט.
            </p>

            {/* Points preview */}
            <div className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-ink-800/40">
              <div className="px-3 py-2 text-electric-400 text-[11px] uppercase tracking-[0.3em] border-b border-white/5 not-italic">
                שיטת הניקוד
              </div>
              <ul className="p-3 space-y-1.5 text-xs sm:text-sm text-white/85">
                <li className="flex justify-between gap-2">
                  <span>שכיבת סמיכה / סקוואט (כל וריאציה)</span>
                  <span className="text-electric-400 font-bold not-italic">1 נק׳</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>מקבילים / בר דיפס</span>
                  <span className="text-electric-400 font-bold not-italic">2 נק׳</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>מתח</span>
                  <span className="text-electric-400 font-bold not-italic">3 נק׳</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>עליית כוח</span>
                  <span className="text-electric-400 font-bold not-italic">4 נק׳</span>
                </li>
              </ul>
            </div>

            <div className="mt-4">
              <Field label="קישור יוטיוב — סיבולת">
                <input
                  dir="ltr"
                  type="url"
                  className="input-field"
                  placeholder="https://youtu.be/..."
                  value={state.enduranceVideoUrl}
                  onChange={(e) => update("enduranceVideoUrl", e.target.value)}
                />
              </Field>
              {!enduranceValid && (
                <div className="mt-1 text-xs text-red-400">הקישור חייב להיות לסרטון יוטיוב חוקי</div>
              )}
            </div>
          </div>
        )}

        {!hasFreestyle && !hasEndurance && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-amber-100 text-sm">
            לא נבחר מקצה. חזור לשלב 1.
          </div>
        )}
      </div>

      <p className="mt-5 text-xs text-white/45 leading-6">
        💡 הסרטון יישפט על ידי הצוות. במידה ולא תאושר השתתפותך — לא יבוצע חיוב כלל.
        העלאת סרטון ב"לא רשום" מאפשרת לך לשתף איתנו את הקישור מבלי שיהיה פומבי ביוטיוב.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────── step 4 — documents */
function StepDocuments({
  state,
  registrationId,
  isMinor,
  onHealth,
  onParentConsent,
  onToggleWhatsapp,
}: {
  state: FormState;
  registrationId: string;
  isMinor: boolean;
  onHealth: (url: string) => void;
  onParentConsent: (url: string) => void;
  onToggleWhatsapp: (v: boolean) => void;
}) {
  const viaWa = state.documentsViaWhatsapp;

  return (
    <div>
      <StepTitle title="העלאת מסמכים" subtitle="קבצי PDF / JPG / PNG עד 8MB." />

      {/* WhatsApp skip option */}
      <label
        className={`mb-5 flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition ${
          viaWa
            ? "border-emerald-500/60 bg-emerald-500/10"
            : "border-white/10 bg-ink-800 hover:border-white/20"
        }`}
      >
        <input
          type="checkbox"
          className="mt-1 w-5 h-5 accent-emerald-500"
          checked={viaWa}
          onChange={(e) => onToggleWhatsapp(e.target.checked)}
        />
        <span className="text-sm leading-6">
          <span className="font-bold text-white inline-flex items-center gap-2">
            <WhatsappIcon className="w-4 h-4 text-emerald-400" />
            דלג על העלאה — אשלח את המסמכים בוואטסאפ
          </span>
          <span className="block mt-1 text-white/65 text-xs">
            אני מתחייב/ת לשלוח לצוות התחרות את הצהרת הבריאות{isMinor ? " ואת אישור ההורים" : ""}
            בהקדם בוואטסאפ. הרשמתי לא תאושר עד לקבלת המסמכים.
          </span>
        </span>
      </label>

      <fieldset disabled={viaWa} className={`space-y-5 transition ${viaWa ? "opacity-40 pointer-events-none" : ""}`}>
        <FileDrop
          kind="health"
          registrationId={registrationId}
          label="הצהרת בריאות מרופא"
          hint="חובה לכלל המתחרים. ניתן להחתים רופא משפחה על טופס סטנדרטי."
          value={state.healthDocUrl}
          onUploaded={onHealth}
        />

        {isMinor && (
          <FileDrop
            kind="parent_consent"
            registrationId={registrationId}
            label="אישור הורים חתום"
            hint="חובה לקטינים מתחת גיל 18. חתימה של אחד ההורים על אישור השתתפות."
            value={state.parentConsentUrl}
            onUploaded={onParentConsent}
          />
        )}
      </fieldset>
    </div>
  );
}

function WhatsappIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.5 3.5A11 11 0 003.4 17.3L2 22l4.8-1.3A11 11 0 1020.5 3.5zM12 20a8 8 0 01-4.3-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1112 20zm4.6-5.8c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1-.2-.1-1.1-.4-2-1.2-.7-.7-1.2-1.5-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.3s1 2.7 1.1 2.9c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

/* ─────────────────────────────────────── step 4 — waiver */
function StepWaiver({
  accepted,
  onAccept,
  onSign,
}: {
  accepted: boolean;
  onAccept: (v: boolean) => void;
  onSign: (dataUrl: string | null) => void;
}) {
  return (
    <div>
      <StepTitle title="קבלת אחריות וחתימה" subtitle="קרא בעיון לפני החתימה." />

      <div className="max-h-56 overflow-y-auto p-4 rounded-lg bg-ink-800 border border-white/10 text-sm text-white/80 leading-7">
        <p className="font-bold text-white">הצהרת בריאות וקבלת אחריות — {COMPETITION.name}</p>
        <p className="mt-2">
          אני, החתום/ה מטה, מצהיר/ה כי אני בוגר/ת מעל גיל 18 (או שצירפתי אישור הורים), כי קיבלתי
          אישור רפואי להשתתפות בתחרות, וכי אני נוטל/ת על עצמי באופן מלא ובלעדי את האחריות לכל פעילות
          המתבצעת במסגרת האירוע, לרבות אימונים, חימום, התחרות עצמה והטקסים הנלווים.
        </p>
        <p className="mt-2">
          ידוע לי כי קליסטניקס כוללת תרגילים מורכבים בעלי סיכון מובנה לפציעה, וכי על אף שהמארגנים
          נוקטים בכל אמצעי הבטיחות הסבירים, אין באפשרותם למנוע כל פציעה. הנני פוטר/ת את מארגני התחרות,
          המאמנים, צוות המתחם וכל גורם נלווה מכל אחריות נזיקית, ישירה או עקיפה, הנובעת מהשתתפותי.
        </p>
        <p className="mt-2">
          תהליך התשלום: ידוע לי כי לא יידרשו ממני פרטי אשראי במעמד ההרשמה הזו. במידה ואאושר
          להשתתף בתחרות, אקבל ב-WhatsApp/מייל קישור תשלום אישי דרך iCredit, ועליי לשלם דרכו
          תוך 7 ימים מקבלת הקישור. במידה ולא אאושר — לא יישלח קישור ולא יבוצע חיוב כלל.
        </p>
        <p className="mt-2">
          הנני מאשר/ת צילום ושימוש בתמונות / סרטונים שלי לצרכי תיעוד וקידום של קלימה.
        </p>
      </div>

      <label className="mt-4 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-1 w-5 h-5 accent-electric-500"
          checked={accepted}
          onChange={(e) => onAccept(e.target.checked)}
        />
        <span className="text-sm text-white/90">קראתי, הבנתי ואני מקבל/ת באופן מלא את תנאי האחריות שלעיל.</span>
      </label>

      <div className="mt-5">
        <div className="text-sm font-semibold text-white/90 mb-2">חתימה דיגיטלית</div>
        <SignaturePad onChange={onSign} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── shared */
function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h2 className="grunge-text text-3xl sm:text-4xl text-white">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-white/60">{subtitle}</p>}
    </header>
  );
}
