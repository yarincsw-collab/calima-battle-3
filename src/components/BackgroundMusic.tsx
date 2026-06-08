"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Floating background music player.
 *  • Mounts on every page (from layout.tsx).
 *  • Persists "muted" state in localStorage.
 *  • Modern browsers block autoplay with sound — the first time a user
 *    visits, the audio is muted by default; one click unmutes & plays.
 *  • Audio file lives at /public/audio/background.mp3.
 */

const STORAGE_KEY = "calima-bgm-muted";
const SRC = "/audio/background.mp3";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);

  // Load saved preference
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "false") setMuted(false);
    } catch {
      /* ignore */
    }
  }, []);

  // React to mute changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = muted;
    if (!muted) {
      el.play().catch(() => {
        // browser blocked play — leave muted state as is
      });
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(muted));
    } catch {
      /* ignore */
    }
  }, [muted]);

  function toggle() {
    setMuted((m) => !m);
  }

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="auto" autoPlay muted />

      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? "הפעל מוזיקת רקע" : "השתק מוזיקת רקע"}
        title={muted ? "הפעל מוזיקה" : "השתק מוזיקה"}
        className="fixed bottom-4 end-4 z-[9999] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-ink-900/80 backdrop-blur border border-electric-500/50 text-electric-400 shadow-glow flex items-center justify-center hover:bg-ink-800 hover:border-electric-400 transition active:scale-95 not-italic"
      >
        {muted ? (
          /* Muted icon */
          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          /* Playing icon */
          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
    </>
  );
}
