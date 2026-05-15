import Link from "next/link";
import { BattlesLogo } from "@/components/Logo";
import { CheckIcon } from "@/components/icons";
import { COMPETITION } from "@/lib/competition";

export const metadata = {
  title: "הרשמה התקבלה — Calima Battles 3",
};

export default function SuccessPage({ searchParams }: { searchParams: { id?: string } }) {
  return (
    <main className="min-h-screen bg-grunge-gradient noise flex items-center px-5 py-16">
      <div className="mx-auto max-w-xl text-center card p-10 sm:p-14 border-electric-500/30 shadow-glow">
        <div className="mx-auto w-16 h-16 rounded-full bg-electric-500/15 border border-electric-500/40 flex items-center justify-center animate-pulseGlow">
          <CheckIcon className="w-9 h-9 text-electric-400" />
        </div>

        <h1 className="grunge-text text-4xl sm:text-5xl text-white mt-6">
          ההרשמה התקבלה!
        </h1>
        <p className="mt-4 text-white/70">
          תודה רבה. נחזור אליך במייל לאחר אישור ההשתתפות. החיוב יבוצע כשבועיים לפני התחרות —
          כפי שמצוין בטופס.
        </p>

        {searchParams.id && (
          <div className="mt-6 inline-block text-xs text-white/50 bg-ink-800 border border-white/10 rounded-md px-3 py-2">
            מזהה הרשמה: <span className="text-white/80 font-mono">{searchParams.id}</span>
          </div>
        )}

        <div className="mt-8 text-sm text-white/60">
          <div>📅 {COMPETITION.displayDates}</div>
          <div>📍 {COMPETITION.venue.address}</div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/" className="btn-ghost">
            חזרה לדף הבית
          </Link>
        </div>

        <div className="mt-8">
          <BattlesLogo className="opacity-50 scale-75" />
        </div>
      </div>
    </main>
  );
}
