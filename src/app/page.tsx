import Link from "next/link";
import { BattlesLogo } from "@/components/Logo";
import {
  CalendarIcon,
  MapPinIcon,
  CrownIcon,
  StarIcon,
  UserIcon,
  CalimaMark,
  FreestyleIcon,
  EnduranceIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "@/components/icons";
import { COMPETITION, FREESTYLE_CATEGORIES, ENDURANCE_CATEGORIES } from "@/lib/competition";
import { ENDURANCE_POINTS } from "@/lib/schema";

const LEVELS = [
  { icon: CrownIcon, label: "מקצה פרו ארצי" },
  { icon: StarIcon, label: "מקצה ארצי" },
  { icon: CalimaMark, label: "מתאמני קלימה" },
  { icon: UserIcon, label: "מקצה בנות" },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-grunge-gradient noise">
      {/* Decorative diagonal stripes */}
      <div className="absolute inset-x-0 top-1/3 h-40 diag-stripes opacity-30 pointer-events-none" aria-hidden />

      <Hero />
      <EventStrip />
      <DisciplinesSection />
      <JudgingSection />
      <LevelsSection />
      <PricingSection />
      <RegisterCTA />
      <Footer />
    </main>
  );
}

/* ──────────────────────────────────────────────────────── HERO */
function Hero() {
  return (
    <section className="relative pt-10 sm:pt-16 pb-16 px-5 overflow-hidden">
      {/* Looping muted video — endurance battles footage */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      {/* Dark gradient overlay for readability */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/40 to-ink-950 pointer-events-none"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6">
          <span className="text-electric-400 font-bold uppercase tracking-[0.4em] text-xs sm:text-sm animate-pulseGlow inline-block px-3 py-1 rounded-full border border-electric-500/40 backdrop-blur-sm">
            Save the date · 30-31.7
          </span>
        </div>

        <BattlesLogo className="mx-auto" />

        <p className="mt-6 text-xl sm:text-2xl font-semibold text-white/90">
          {COMPETITION.tagline}<span className="text-electric-400">!</span>
        </p>
        <p className="mt-3 text-white/60 max-w-2xl mx-auto text-base sm:text-lg">
          יומיים של תחרות. מקצי פריסטייל, סיבולת, פרו ארצי, ארצי, מתאמני קלימה ובנות.
          הבמה הכי גדולה לקליסטניקס בישראל.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/register" className="btn-primary">
            הרשמה לתחרות
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <a href="#disciplines" className="btn-ghost">
            פרטים נוספים
          </a>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-4 text-white/85">
          <InfoBadge icon={CalendarIcon} label={`${COMPETITION.displayDates} • חמישי-שישי`} />
          <InfoBadge icon={MapPinIcon} label={COMPETITION.venue.address} href={COMPETITION.venue.mapsUrl} />
        </div>
      </div>
    </section>
  );
}

function InfoBadge({
  icon: Icon,
  label,
  href,
}: {
  icon: (props: { className?: string }) => JSX.Element;
  label: string;
  href?: string;
}) {
  const inner = (
    <span className="inline-flex items-center gap-2 text-sm sm:text-base">
      <Icon className="w-5 h-5 text-electric-400" />
      <span>{label}</span>
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="hover:text-electric-400 transition">
      {inner}
    </a>
  ) : (
    inner
  );
}

/* ──────────────────────────────────────────────────────── EVENT STRIP */
function EventStrip() {
  return (
    <section className="relative py-10 px-5 border-y border-white/5 bg-ink-900/60">
      <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <Stat number="2" label="ימי תחרות" />
        <Stat number="7" label="מקצים" />
        <Stat number="66+" label="מתחרים" />
        <Stat number="1" label="זוכה לכל מקצה" />
      </div>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="grunge-text text-electric-400 text-5xl sm:text-6xl drop-shadow-[0_0_15px_rgba(63,201,255,0.4)]">
        {number}
      </div>
      <div className="mt-1 text-sm sm:text-base text-white/70">{label}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── DISCIPLINES */
function DisciplinesSection() {
  const disciplines = [
    {
      day: "יום חמישי 30.7",
      title: "פריסטייל",
      icon: FreestyleIcon,
      blurb: "יצירתיות. כוח. שליטה. הקומבואים הכי מטורפים על המתח.",
      categories: FREESTYLE_CATEGORIES,
    },
    {
      day: "יום שישי 31.7",
      title: "סיבולת",
      icon: EnduranceIcon,
      blurb: "כמה חזרות אתה מסוגל? מי יישאר אחרון על המתח?",
      categories: ENDURANCE_CATEGORIES,
    },
  ];

  return (
    <section id="disciplines" className="relative py-20 px-5">
      <div className="mx-auto max-w-6xl">
        <SectionHeading kicker="התחרויות" title="פריסטייל וסיבולת" />

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {disciplines.map((d) => (
            <article key={d.title} className="card p-6 sm:p-8 hover:border-electric-500/40 transition group">
              <div className="flex items-center gap-3 text-electric-400">
                <d.icon className="w-8 h-8" />
                <span className="text-sm font-bold uppercase tracking-widest text-white/60">{d.day}</span>
              </div>
              <h3 className="mt-4 grunge-text text-5xl sm:text-6xl text-white brush-underline inline-block">
                {d.title}
              </h3>
              <p className="mt-6 text-white/70 text-base sm:text-lg">{d.blurb}</p>

              <ul className="mt-6 space-y-2.5">
                {d.categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-white/90">{c.label.split(" — ")[0]}</span>
                    <span className="text-white/50 text-xs sm:text-sm">{c.slots} מקומות</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── JUDGING */
function JudgingSection() {
  return (
    <section id="judging" className="relative py-20 px-5 border-y border-white/5 bg-ink-900/60">
      <div className="mx-auto max-w-6xl">
        <SectionHeading kicker="חוקי שפיטה" title="איך נשפטים?" />

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Freestyle — link to PDF */}
          <article className="card p-6 sm:p-8 hover:border-electric-500/40 transition">
            <h3 className="grunge-text text-4xl text-electric-400">פריסטייל</h3>
            <p className="mt-4 text-white/70 text-sm sm:text-base leading-7">
              השפיטה בפריסטייל מתבססת על שילוב של יצירתיות, רמת קושי, ביצוע נקי ושליטה.
              כל הקריטריונים, סולמות הניקוד ושיטות הפסילה מפורטים בקובץ ה-PDF המצורף —
              חובה לקרוא לפני הגשת סרטון הקבלה.
            </p>

            <a
              href="/judging-freestyle.pdf"
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-6 inline-flex"
            >
              חוקי השפיטה (PDF)
              <ArrowLeftIcon className="w-5 h-5" />
            </a>

            <p className="mt-3 text-xs text-white/45">5 עמודים · ~1MB</p>
          </article>

          {/* Endurance — points table inline */}
          <article className="card p-6 sm:p-8 hover:border-electric-500/40 transition">
            <h3 className="grunge-text text-4xl text-electric-400">סיבולת</h3>
            <p className="mt-4 text-white/70 text-sm sm:text-base leading-7">
              פורמט צבירת נקודות — דקה אחת לצבור כמה שיותר. שילוב חופשי של תרגילים.
              כל תרגיל שווה ניקוד לפי הטבלה הבאה:
            </p>

            <div className="mt-5 rounded-lg overflow-hidden border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-ink-800/80 text-white/60">
                  <tr>
                    <th className="text-right p-3 font-semibold">תרגיל</th>
                    <th className="text-left p-3 font-semibold">נקודות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ENDURANCE_POINTS.map((row) => (
                    <tr key={row.exercise} className="hover:bg-white/[0.02]">
                      <td className="p-3 text-white/90">{row.exercise}</td>
                      <td className="p-3 text-left">
                        <span className="grunge-text text-electric-400 text-2xl">{row.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── LEVELS */
function LevelsSection() {
  return (
    <section className="relative py-16 px-5 bg-ink-900/50 border-y border-white/5">
      <div className="mx-auto max-w-5xl">
        <SectionHeading kicker="רמות" title="ארבע רמות. מקצה לכל אחד." />

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-5">
          {LEVELS.map((l) => (
            <div
              key={l.label}
              className="card p-6 text-center flex flex-col items-center gap-3 hover:border-electric-500/40 transition"
            >
              <l.icon className="w-12 h-12 text-electric-400" />
              <div className="text-white font-bold">{l.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── PRICING */
function PricingSection() {
  const rows = [
    { label: "פריסטייל — כל המקצים (פרו ארצי / ארצי / בנות)", price: "100 ₪" },
    { label: "סיבולת — כל המקצים (ארצי / בנות)", price: "100 ₪" },
    { label: "פריסטייל — מתאמני קלימה", price: "70 ₪" },
    { label: "סיבולת — מתאמני קלימה", price: "חינם" },
  ];

  return (
    <section className="relative py-20 px-5">
      <div className="mx-auto max-w-4xl">
        <SectionHeading kicker="עלויות הרשמה" title="מחירים פשוטים. שקופים." />

        <div className="mt-10 card divide-y divide-white/5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 p-5 sm:p-6">
              <span className="text-white/90 text-sm sm:text-base">{r.label}</span>
              <span className="grunge-text text-electric-400 text-3xl sm:text-4xl">{r.price}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-white/55 text-center max-w-2xl mx-auto">
          ⚡ אפשר להירשם גם לפריסטייל וגם לסיבולת. <br className="hidden sm:block" />
          {COMPETITION.chargeNote}
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── REGISTER CTA */
function RegisterCTA() {
  return (
    <section className="relative py-24 px-5">
      <div className="mx-auto max-w-4xl text-center card p-10 sm:p-14 border-electric-500/30 shadow-glow">
        <h2 className="grunge-text text-5xl sm:text-7xl text-white">
          מוכן <span className="text-electric-400">להילחם?</span>
        </h2>
        <p className="mt-5 text-white/70 max-w-xl mx-auto">
          ההרשמה פתוחה — מספר המקומות מוגבל. השלם את הטופס תוך 5 דקות, ונחזור אליך עם אישור.
        </p>

        <ul className="mt-8 max-w-md mx-auto text-sm text-white/75 space-y-2 text-right">
          {[
            "בחירת מקצה (אפשר יותר מאחד)",
            "פרטים אישיים + אישור הורים לקטינים",
            "הצהרת בריאות מרופא (קובץ)",
            "חתימה דיגיטלית על קבלת אחריות",
            "טוקן אשראי לחיוב עתידי בלבד (לא מאוחסן אצלנו)",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <CheckIcon className="w-4 h-4 mt-1 text-electric-400 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Link href="/register" className="btn-primary text-lg">
            התחל הרשמה
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── FOOTER */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-5 text-center text-white/40 text-sm">
      <div className="grunge-text text-white text-2xl">CALIMA <span className="text-electric-400">BATTLES 3</span></div>
      <div className="mt-2">{COMPETITION.venue.address}</div>
      <div className="mt-1">© {new Date().getFullYear()} Calima — All rights reserved</div>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────── shared */
function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center">
      <div className="text-electric-400 text-xs sm:text-sm uppercase tracking-[0.5em] mb-3">{kicker}</div>
      <h2 className="grunge-text text-4xl sm:text-5xl text-white">{title}</h2>
    </div>
  );
}
