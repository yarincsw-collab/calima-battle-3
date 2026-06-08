"use client";

import { useEffect, useState } from "react";

/**
 * Countdown timer to two key dates:
 *  • Registration closes — 2026-07-01 23:59
 *  • Competition starts  — 2026-07-30 10:00
 *
 * Picks whichever is next. If both passed, hides itself.
 */

const REGISTRATION_CLOSE = new Date("2026-07-01T23:59:59+03:00").getTime();
const COMPETITION_START = new Date("2026-07-30T10:00:00+03:00").getTime();

function pickTarget(now: number): { label: string; target: number } | null {
  if (now < REGISTRATION_CLOSE) {
    return { label: "סגירת ההרשמה בעוד", target: REGISTRATION_CLOSE };
  }
  if (now < COMPETITION_START) {
    return { label: "התחרות מתחילה בעוד", target: COMPETITION_START };
  }
  return null;
}

function diff(target: number, now: number) {
  const ms = Math.max(0, target - now);
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return { days, hours, minutes, seconds };
}

export function CountdownTimer() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;
  const t = pickTarget(now);
  if (!t) return null;

  const { days, hours, minutes, seconds } = diff(t.target, now);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="card p-5 sm:p-7 border-electric-500/40 shadow-glow text-center">
        <div className="text-electric-400 text-xs sm:text-sm uppercase tracking-[0.4em] mb-3 not-italic">
          {t.label}
        </div>
        <div
          dir="ltr"
          className="flex justify-center items-stretch gap-2 sm:gap-4 not-italic"
        >
          <Cell value={days} label="ימים" />
          <Sep />
          <Cell value={hours} label="שעות" />
          <Sep />
          <Cell value={minutes} label="דקות" />
          <Sep />
          <Cell value={seconds} label="שניות" />
        </div>
      </div>
    </div>
  );
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[3.5rem] sm:min-w-[5rem]">
      <div className="grunge-text text-4xl sm:text-6xl text-white tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-1 text-white/55 text-[10px] sm:text-xs uppercase tracking-[0.2em]">
        {label}
      </div>
    </div>
  );
}

function Sep() {
  return (
    <div className="grunge-text text-3xl sm:text-5xl text-electric-400 self-start mt-1">
      :
    </div>
  );
}
