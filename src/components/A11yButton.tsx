"use client";

import { useEffect, useState } from "react";

/**
 * Floating accessibility panel — Israeli law / ISO best-practice toolkit.
 * Lives on every page (mounted in layout.tsx). Persists settings to localStorage.
 *
 * Features:
 *  • Increase / decrease font size
 *  • High contrast (light text on pure black)
 *  • Greyscale
 *  • Underline links / focus rings
 *  • Pause CSS animations
 *  • Reset
 */

type Settings = {
  fontScale: number;
  highContrast: boolean;
  greyscale: boolean;
  underlineLinks: boolean;
  pauseAnimations: boolean;
};

const DEFAULTS: Settings = {
  fontScale: 1,
  highContrast: false,
  greyscale: false,
  underlineLinks: false,
  pauseAnimations: false,
};

const KEY = "calima-a11y";

function applySettings(s: Settings) {
  const root = document.documentElement;
  root.style.fontSize = `${s.fontScale * 100}%`;
  root.classList.toggle("a11y-contrast", s.highContrast);
  root.classList.toggle("a11y-greyscale", s.greyscale);
  root.classList.toggle("a11y-underline", s.underlineLinks);
  root.classList.toggle("a11y-no-anim", s.pauseAnimations);
}

export function A11yButton() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Settings>(DEFAULTS);

  // Load saved settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) };
        setS(parsed);
        applySettings(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Apply + persist on change
  useEffect(() => {
    applySettings(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  function update<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  function reset() {
    setS(DEFAULTS);
    document.documentElement.style.fontSize = "";
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        className="fixed bottom-4 start-4 z-[9999] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-electric-500 text-ink-950 shadow-glow flex items-center justify-center hover:bg-electric-400 transition active:scale-95 not-italic"
        title="נגישות"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" aria-hidden>
          <circle cx="12" cy="4" r="2" />
          <path d="M5 9h14M9 9v5l-2 7h2l1.5-6h3L15 21h2l-2-7V9" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="הגדרות נגישות"
          className="fixed bottom-20 start-4 z-[9999] w-[calc(100vw-2rem)] max-w-sm bg-ink-900 border border-electric-500/40 rounded-2xl shadow-glow-strong p-5 not-italic"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">נגישות</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגור"
              className="text-white/60 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Font size */}
          <div className="mb-4">
            <div className="text-white/80 text-sm font-semibold mb-2">גודל טקסט</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update("fontScale", Math.max(0.85, s.fontScale - 0.1))}
                className="flex-1 py-2 rounded-lg bg-ink-800 border border-white/15 text-white hover:bg-ink-700"
                aria-label="הקטן טקסט"
              >
                A−
              </button>
              <span className="w-12 text-center text-white text-sm">
                {Math.round(s.fontScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => update("fontScale", Math.min(1.6, s.fontScale + 0.1))}
                className="flex-1 py-2 rounded-lg bg-ink-800 border border-white/15 text-white hover:bg-ink-700"
                aria-label="הגדל טקסט"
              >
                A+
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <Toggle
              label="ניגודיות גבוהה"
              checked={s.highContrast}
              onChange={(v) => update("highContrast", v)}
            />
            <Toggle
              label="גווני אפור"
              checked={s.greyscale}
              onChange={(v) => update("greyscale", v)}
            />
            <Toggle
              label="הדגשת קישורים"
              checked={s.underlineLinks}
              onChange={(v) => update("underlineLinks", v)}
            />
            <Toggle
              label="עצירת אנימציות"
              checked={s.pauseAnimations}
              onChange={(v) => update("pauseAnimations", v)}
            />
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-5 w-full py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 text-sm"
          >
            איפוס
          </button>

          <p className="mt-4 text-xs text-white/40 leading-5">
            ההגדרות נשמרות במכשיר שלך בלבד ולא נשלחות לשרת.
          </p>
        </div>
      )}
    </>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-ink-800 border border-white/10 hover:bg-ink-700 transition text-start"
      role="switch"
      aria-checked={checked}
    >
      <span className="text-white text-sm">{label}</span>
      <span
        className={`relative w-10 h-5 rounded-full transition ${
          checked ? "bg-electric-500" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${
            checked ? "end-0.5" : "start-0.5"
          }`}
        />
      </span>
    </button>
  );
}
