"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Viral share card.
 *  • User uploads a personal photo.
 *  • We compose it on a 1080x1350 (Instagram portrait) canvas
 *    with the Battles 3 branding, dates and a CTA.
 *  • User can download the PNG or share via native Web Share API
 *    (WhatsApp / Instagram / etc.).
 */

const W = 1080;
const H = 1350;

export function ShareCard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanShare(true);
    }
  }, []);

  // Draw whenever photo changes
  useEffect(() => {
    drawCard(canvasRef.current, photo);
  }, [photo]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setPhoto(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function getBlob(): Promise<Blob | null> {
    const c = canvasRef.current;
    if (!c) return null;
    return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png", 0.95));
  }

  async function download() {
    setBusy(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "calima-battles-3.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    setBusy(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const file = new File([blob], "calima-battles-3.png", { type: "image/png" });
      const data: ShareData = {
        title: "Calima Battles 3",
        text: "אני מתחרה ב-Calima Battles 3 — תחרות הקליסטניקס הגדולה של השנה! https://battles3.calima.co.il",
        files: [file],
      };
      // Try files first, fallback to text-only
      try {
        await navigator.share(data);
      } catch {
        await navigator.share({
          title: data.title,
          text: data.text,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <div className="text-electric-400 text-xs sm:text-sm uppercase tracking-[0.5em] mb-3 not-italic">
            תכריזו שאתם בפנים
          </div>
          <h2 className="grunge-text text-3xl sm:text-5xl text-white">
            שתפו את ההשתתפות שלכם
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-white/65 text-sm sm:text-base leading-7">
            העלו תמונה שלכם, צרו כרזה אישית של Battles 3 ושתפו באינסטה/וואטסאפ.
            תאמינו לכם ולחברים שלכם.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-8 items-start">
          {/* Canvas preview */}
          <div className="card p-3 sm:p-4">
            <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-ink-900 border border-white/10">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="w-full h-full block"
              />
              {!photo && (
                <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm not-italic pointer-events-none">
                  התמונה שלך תופיע כאן
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPick}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-xl bg-electric-500 text-ink-950 font-bold text-base sm:text-lg hover:bg-electric-400 transition not-italic shadow-glow"
            >
              {photo ? "בחר תמונה אחרת" : "העלה תמונה שלך"}
            </button>

            <button
              type="button"
              disabled={!photo || busy}
              onClick={download}
              className="w-full py-4 rounded-xl bg-ink-800 border border-white/15 text-white font-bold hover:bg-ink-700 transition disabled:opacity-40 disabled:cursor-not-allowed not-italic"
            >
              📥 הורד תמונה
            </button>

            {canShare && (
              <button
                type="button"
                disabled={!photo || busy}
                onClick={share}
                className="w-full py-4 rounded-xl bg-ink-800 border border-electric-500/40 text-electric-400 font-bold hover:bg-ink-700 transition disabled:opacity-40 disabled:cursor-not-allowed not-italic"
              >
                📲 שתף
              </button>
            )}

            <div className="text-xs text-white/40 leading-6 pt-2">
              💡 התמונה נוצרת על המכשיר שלך בלבד ולא נשלחת לשרת.
              <br />
              באינסטה — תוכלו להעלות ל-Story ולתייג את <span className="text-electric-400">@calima.calisthenics</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────── canvas drawing */

function drawCard(canvas: HTMLCanvasElement | null, photo: HTMLImageElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // background
  ctx.fillStyle = "#05070A";
  ctx.fillRect(0, 0, W, H);

  // photo area (top 75%)
  const photoH = Math.floor(H * 0.72);
  if (photo) {
    // cover-fit
    const ratio = Math.max(W / photo.width, photoH / photo.height);
    const drawW = photo.width * ratio;
    const drawH = photo.height * ratio;
    const dx = (W - drawW) / 2;
    const dy = (photoH - drawH) / 2;
    ctx.drawImage(photo, dx, dy, drawW, drawH);

    // dark overlay for contrast at bottom of photo
    const grad = ctx.createLinearGradient(0, photoH * 0.5, 0, photoH);
    grad.addColorStop(0, "rgba(5,7,10,0)");
    grad.addColorStop(1, "rgba(5,7,10,0.95)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, photoH);
  } else {
    // empty placeholder gradient
    const g = ctx.createLinearGradient(0, 0, 0, photoH);
    g.addColorStop(0, "#0A1018");
    g.addColorStop(1, "#05070A");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, photoH);
  }

  // bottom dark band
  ctx.fillStyle = "#05070A";
  ctx.fillRect(0, photoH, W, H - photoH);

  // electric blue divider line
  ctx.fillStyle = "#1BA4E0";
  ctx.fillRect(0, photoH - 4, W, 4);

  // "I'M COMPETING" kicker (RTL Hebrew)
  ctx.fillStyle = "#1BA4E0";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("אני מתחרה ב-", W / 2, photoH + 80);

  // CALIMA BATTLES 3 wordmark
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 96px sans-serif";
  ctx.fillText("CALIMA BATTLES 3", W / 2, photoH + 180);

  // Dates
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 48px sans-serif";
  ctx.fillText("30-31.7  |  ראשון לציון", W / 2, photoH + 260);

  // URL
  ctx.fillStyle = "#1BA4E0";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("battles3.calima.co.il", W / 2, photoH + 330);
}
