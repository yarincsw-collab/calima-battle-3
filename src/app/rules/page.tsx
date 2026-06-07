import Link from "next/link";
import { BattlesLogo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { ArrowLeftIcon, CheckIcon } from "@/components/icons";
import {
  APPLICATION_STEPS,
  QUALIFICATION_POINTS,
  QUALIFICATION_RULES,
  COMPETITION_STRUCTURE,
  ALLOWED_EXERCISES,
  RECORDING_RULES,
  EXERCISES,
  FINAL_NOTES,
} from "@/lib/rulesContent";

export const metadata = {
  title: "חוקי התחרות — Calima Battles 3",
  description:
    "כל החוקים של תחרות הסיבולת Calima Battles 3 — מקצי קבלה, חוקי שיפוט פר תרגיל, ותהליך ההרשמה.",
};

export default function RulesPage() {
  return (
    <main className="relative min-h-screen bg-grunge-gradient noise pb-24">
      {/* ───── header / hero */}
      <header className="px-5 pt-10 sm:pt-16 pb-6 text-center">
        <Link href="/" className="inline-block hover:opacity-90 transition not-italic">
          <BattlesLogo />
        </Link>
        <p className="mt-4 text-electric-400 text-xs sm:text-sm uppercase tracking-[0.4em] not-italic">
          חוקי תחרות הסיבולת
        </p>
        <h1 className="mt-3 grunge-text text-4xl sm:text-6xl text-white">
          חוקי <span className="text-electric-400">סיבולת</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-white/70 text-sm sm:text-base leading-7">
          כל מה שצריך לדעת לפני שמגישים מועמדות — מקצי הקבלה, חוקי שיפוט לכל תרגיל,
          הוראות צילום, ותהליך ההרשמה. קרא בעיון לפני שאתה מצלם.
        </p>

        <nav className="mt-8 flex flex-wrap justify-center gap-3 text-xs sm:text-sm">
          {[
            { id: "process", label: "תהליך ההרשמה" },
            { id: "qualification", label: "שיטת ניקוד העפלה" },
            { id: "structure", label: "מבנה התחרות" },
            { id: "recording", label: "הוראות צילום" },
            { id: "exercises", label: "תרגילים וחוקי שיפוט" },
          ].map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="px-4 py-2 rounded-full border border-white/15 text-white/70 hover:border-electric-500/60 hover:text-electric-400 transition not-italic"
            >
              {t.label}
            </a>
          ))}
        </nav>
      </header>

      {/* ───── 1. APPLICATION PROCESS */}
      <section id="process" className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <SectionHeading kicker="תהליך הרשמה" title="3 צעדים. פשוט." />
          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            {APPLICATION_STEPS.map((s) => (
              <Reveal key={s.n}>
                <div className="card p-6 h-full">
                  <div className="grunge-text text-5xl text-electric-400 mb-2 not-italic">
                    0{s.n}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-white/70 text-sm leading-7">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/register" className="btn-primary not-italic">
              להרשמה לתחרות
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───── 2. ONLINE QUALIFICATION (60-SECOND POINTS) */}
      <section id="qualification" className="px-5 py-12 sm:py-16 border-y border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-5xl">
          <SectionHeading kicker="שיטת ניקוד העפלה" title="דקה אחת. כמה שיותר נקודות." />
          <p className="mt-4 text-center text-white/60 text-sm max-w-2xl mx-auto">
            יש לכם 60 שניות לצלם את עצמכם משיגים כמה שיותר נקודות. שלבו בין התרגילים בכל סדר
            ובכל וריאציה — אתם בוחרים את האסטרטגיה. רק חזרות חוקיות נספרות.
          </p>

          {/* points table */}
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {QUALIFICATION_POINTS.map((p) => (
              <Reveal key={p.exercise}>
                <div className="card p-5 h-full text-center hover:border-electric-500/50 transition">
                  <div className="text-4xl mb-2 not-italic">{p.emoji}</div>
                  <div className="grunge-text text-5xl text-electric-400 mb-1 not-italic">
                    {p.points}
                  </div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.2em] mb-2 not-italic">
                    {p.points === 1 ? "נקודה" : "נקודות"}
                  </div>
                  <div className="text-white text-sm font-semibold leading-6">
                    {p.exercise}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* qualification rules */}
          <Reveal>
            <div className="mt-10 card p-6 sm:p-8">
              <div className="text-electric-400 text-xs uppercase tracking-[0.4em] mb-4 not-italic">
                חוקי שלב ההעפלה
              </div>
              <ul className="space-y-3">
                {QUALIFICATION_RULES.map((rule, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm sm:text-base text-white/85 leading-7"
                  >
                    <CheckIcon className="w-4 h-4 mt-1.5 text-electric-400 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───── 2b. COMPETITION STRUCTURE */}
      <section id="structure" className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <SectionHeading kicker="מבנה התחרות" title="איך מתנהלת תחרות הסיבולת?" />
          <p className="mt-4 text-center text-white/60 text-sm max-w-2xl mx-auto">
            התחרות בנויה משני שלבים — Time Trial לדירוג, ואז באטלס בין 8 הטובים.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            {COMPETITION_STRUCTURE.map((s, i) => (
              <Reveal key={s.title}>
                <div className="card p-6 h-full hover:border-electric-500/50 transition">
                  <div className="grunge-text text-5xl text-electric-400 mb-2 not-italic">
                    0{i + 1}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-white/70 text-sm leading-7">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* allowed exercises */}
          <Reveal>
            <div className="mt-12 card p-6 sm:p-8 border-electric-500/30">
              <div className="text-electric-400 text-xs uppercase tracking-[0.4em] mb-2 not-italic">
                תרגילים שיכולים להופיע בסטים
              </div>
              <h3 className="grunge-text text-2xl sm:text-3xl text-white mb-6">
                ארסנל התחרות
              </h3>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                {ALLOWED_EXERCISES.map((ex) => (
                  <div key={ex.name} className="border-b border-white/5 pb-3">
                    <div className="text-white font-semibold text-sm sm:text-base mb-1">
                      ▸ {ex.name}
                    </div>
                    <div className="text-white/60 text-xs sm:text-sm leading-6 ps-4">
                      {ex.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───── 3. RECORDING RULES */}
      <section id="recording" className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <SectionHeading kicker="הוראות צילום" title="איך מצלמים את הסרטון?" />
          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            {RECORDING_RULES.map((r) => (
              <Reveal key={r.title}>
                <div className="card p-6 h-full hover:border-electric-500/40 transition">
                  <div className="text-electric-400 text-xs uppercase tracking-[0.3em] mb-2 not-italic">
                    {r.title}
                  </div>
                  <p className="text-white/85 text-sm leading-7">{r.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 4. EXERCISE RULES */}
      <section id="exercises" className="px-5 py-12 sm:py-16 border-y border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-5xl">
          <SectionHeading kicker="חוקי תרגילים" title="חוקי שיפוט מפורטים" />
          <p className="mt-4 text-center text-white/60 text-sm">
            לחץ על תרגיל כדי לפתוח את כל החוקים שלו.
          </p>

          <div className="mt-10 space-y-3">
            {EXERCISES.map((ex) => (
              <Reveal key={ex.id}>
                <details className="card group">
                  <summary className="cursor-pointer p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-ink-700/40 transition">
                    <span className="flex items-center gap-3">
                      <span className="text-3xl not-italic">{ex.emoji}</span>
                      <span className="grunge-text text-2xl sm:text-3xl text-white">
                        {ex.name}
                      </span>
                    </span>
                    <span className="text-electric-400 text-sm group-open:rotate-180 transition not-italic">
                      ▼
                    </span>
                  </summary>
                  <ul className="px-5 pb-6 sm:px-6 space-y-3 border-t border-white/5 pt-5">
                    {ex.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-white/85 leading-7">
                        <CheckIcon className="w-4 h-4 mt-1.5 text-electric-400 shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 5. FINAL NOTES + CTA */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-3xl text-center card p-8 sm:p-12 border-electric-500/30 shadow-glow">
          <div className="text-electric-400 text-xs uppercase tracking-[0.5em] mb-3 not-italic">
            מילה אחרונה
          </div>
          <h2 className="grunge-text text-3xl sm:text-5xl text-white">השעון מתקתק.</h2>

          <ul className="mt-8 text-start space-y-3 text-white/80 text-sm sm:text-base leading-7">
            {FINAL_NOTES.map((n, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-electric-400 not-italic">▸</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link href="/register" className="btn-primary not-italic">
              הרשמה לתחרות
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-white/5 mt-6 pt-6 text-center text-white/40 text-xs">
        <Link href="/" className="hover:text-electric-400 transition not-italic">
          ← חזרה לדף הבית
        </Link>
      </footer>
    </main>
  );
}

/* ─────────────────────────────────────── components */
function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <Reveal>
      <div className="text-center">
        <div className="text-electric-400 text-xs sm:text-sm uppercase tracking-[0.5em] mb-3 not-italic">
          {kicker}
        </div>
        <h2 className="grunge-text text-3xl sm:text-5xl text-white">{title}</h2>
      </div>
    </Reveal>
  );
}

