"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Viral share — a gold "נסה אותי" CTA at the top of the landing page.
 * Click opens a modal where the user uploads a photo and gets an
 * Instagram-Story-ready 1080×1920 card ("אני מגיע לאירוע") to share.
 */

const W = 1080;
const H = 1920;
const SITE_URL = "https://battles3.calima.co.il";
const SHARE_TEXT = 'אני מגיע ל-Calima Battles 3 🔥 30-31.7 ראשל"צ — נתראה בבמה.';

const FONT_STACK =
  '"Open Sans","Open Sans Hebrew","Segoe UI",system-ui,sans-serif';

export function ShareCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-5 pt-2 pb-1">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative w-full overflow-hidden rounded-2xl px-6 py-5 sm:py-6 transition-transform hover:scale-[1.02] active:scale-100 not-italic"
          style={{
            background:
              "linear-gradient(120deg, #B8860B 0%, #FFD700 25%, #FFF3B0 50%, #FFD700 75%, #8B6914 100%)",
            backgroundSize: "200% 200%",
            animation: "goldShimmer 5s ease-in-out infinite",
            boxShadow:
              "0 10px 35px -8px rgba(255,215,0,0.55), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.15)",
          }}
        >
          <div className="relative z-10 flex items-center justify-center gap-3 text-[#3a2900]">
            <span className="text-2xl sm:text-3xl drop-shadow">✨</span>
            <div className="flex flex-col items-center sm:items-baseline sm:flex-row gap-1 sm:gap-3">
              <span
                className="grunge-text text-3xl sm:text-4xl uppercase tracking-wide"
                style={{ textShadow: "0 1px 0 rgba(255,255,255,0.4)" }}
              >
                נסה אותי
              </span>
              <span className="text-xs sm:text-sm font-bold opacity-90 tracking-wider">
                ✦ צור סטורי משלך לאירוע ✦
              </span>
            </div>
            <span className="text-2xl sm:text-3xl drop-shadow">🎯</span>
          </div>

          {/* shine sweep */}
          <span
            className="pointer-events-none absolute inset-0 -skew-x-12 opacity-60 group-hover:opacity-90 transition-opacity"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "shineSweep 3s linear infinite",
            }}
            aria-hidden
          />
        </button>

        <style jsx>{`
          @keyframes goldShimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes shineSweep {
            0% { background-position: -100% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>

      {open && <ShareModal onClose={() => setOpen(false)} />}
    </div>
  );
}

/* ────────────────────────────────────────── modal */

function ShareModal({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanShare(true);
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    // wait for fonts to be ready so canvas uses Open Sans
    if (typeof document !== "undefined" && (document as any).fonts) {
      (document as any).fonts.ready.then(() => drawCard(canvasRef.current, photo));
    } else {
      drawCard(canvasRef.current, photo);
    }
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
    return new Promise((r) => c.toBlob((b) => r(b), "image/png", 0.95));
  }

  async function download() {
    setBusy(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "calima-battles-3-story.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } finally {
      setBusy(false);
    }
  }

  function shareWhatsapp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n${SITE_URL}`)}`;
    window.open(url, "_blank");
  }

  async function shareNative() {
    setBusy(true);
    try {
      const blob = await getBlob();
      const file = blob ? new File([blob], "calima-battles-3-story.png", { type: "image/png" }) : null;
      try {
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "Calima Battles 3", text: SHARE_TEXT, files: [file] });
        } else {
          await navigator.share({ title: "Calima Battles 3", text: `${SHARE_TEXT}\n${SITE_URL}` });
        }
      } catch {
        /* cancelled */
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-3 py-6 sm:p-6 bg-ink-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-full overflow-y-auto card p-5 sm:p-7 border-electric-500/50 shadow-glow-strong"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="סגור"
          className="absolute top-3 end-3 w-9 h-9 rounded-full bg-ink-800 border border-white/15 text-white/80 hover:text-white hover:bg-ink-700 transition flex items-center justify-center text-xl leading-none not-italic"
        >
          ×
        </button>

        <div className="text-center mb-5">
          <div className="text-electric-400 text-xs uppercase tracking-[0.5em] mb-2 not-italic">
            תכריזו על ההגעה שלכם
          </div>
          <h2 className="grunge-text text-3xl sm:text-4xl text-white">
            אני מגיע לאירוע 🔥
          </h2>
          <p className="mt-2 text-white/60 text-xs sm:text-sm leading-6">
            פורמט סטורי לאינסטה • 1080×1920
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr,1.2fr] gap-5 items-start">
          {/* canvas — story aspect ratio */}
          <div className="card p-3 sm:p-4">
            <div className="relative mx-auto w-full max-w-[280px] aspect-[9/16] rounded-lg overflow-hidden bg-ink-900 border border-white/10">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="w-full h-full block"
              />
              {!photo && (
                <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs not-italic pointer-events-none">
                  התמונה שלך תופיע כאן
                </div>
              )}
            </div>
          </div>

          {/* controls */}
          <div className="space-y-3">
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
              📷 {photo ? "החלף תמונה" : "העלה תמונה שלך"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={download}
              className="w-full py-4 rounded-xl bg-ink-800 border border-white/15 text-white font-bold hover:bg-ink-700 transition disabled:opacity-40 not-italic"
            >
              📥 הורד לסטורי
            </button>

            <button
              type="button"
              onClick={shareWhatsapp}
              className="w-full py-4 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#1eb053] transition not-italic"
            >
              💬 שתף בוואטסאפ
            </button>

            {canShare && (
              <button
                type="button"
                disabled={busy}
                onClick={shareNative}
                className="w-full py-4 rounded-xl bg-ink-800 border border-electric-500/40 text-electric-400 font-bold hover:bg-ink-700 transition disabled:opacity-40 not-italic"
              >
                📲 שתף לאינסטה / עוד
              </button>
            )}

            <p className="text-[11px] text-white/40 leading-5 pt-2 text-center sm:text-start">
              💡 לאינסטה: הורד תמונה → פתח אינסטה → סטורי חדש → בחר מהגלריה.
              <br />
              תייגו <span className="text-electric-400">@calima.calisthenics</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────── canvas drawing (1080×1920) */

function drawCard(canvas: HTMLCanvasElement | null, photo: HTMLImageElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // ─── background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0E1726");
  bg.addColorStop(0.5, "#070C16");
  bg.addColorStop(1, "#05070A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ─── diagonal subtle stripes
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = "rgba(27,164,224,0.05)";
  for (let i = -2500; i < 2500; i += 100) {
    ctx.fillRect(i, -2500, 50, 5000);
  }
  ctx.restore();

  // ─── photo area: top 60% of canvas
  const photoH = Math.floor(H * 0.6);
  if (photo) {
    const ratio = Math.max(W / photo.width, photoH / photo.height);
    const drawW = photo.width * ratio;
    const drawH = photo.height * ratio;
    const dx = (W - drawW) / 2;
    const dy = (photoH - drawH) / 2;
    ctx.drawImage(photo, dx, dy, drawW, drawH);

    // electric blue duotone overlay
    const overlay = ctx.createLinearGradient(0, 0, 0, photoH);
    overlay.addColorStop(0, "rgba(27,164,224,0.18)");
    overlay.addColorStop(0.55, "rgba(5,7,10,0)");
    overlay.addColorStop(1, "rgba(5,7,10,0.96)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, W, photoH);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, photoH);
    g.addColorStop(0, "#0F1622");
    g.addColorStop(1, "#05070A");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, photoH);
  }

  // ─── electric glowing divider
  ctx.save();
  ctx.shadowColor = "rgba(27,164,224,0.85)";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#1BA4E0";
  ctx.fillRect(0, photoH - 6, W, 6);
  ctx.restore();

  // ─── bottom panel
  ctx.fillStyle = "transparent";

  // ─── kicker "אני מגיע ל-" — slim italic
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `italic 600 56px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("אני מגיע ל-", W / 2, photoH + 130);

  // ─── CALIMA wordmark — heavy, white
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 italic 130px ${FONT_STACK}`;
  ctx.letterSpacing = "0px";
  ctx.fillText("CALIMA", W / 2, photoH + 280);

  // ─── BATTLES 3 — electric glow
  ctx.save();
  ctx.shadowColor = "rgba(27,164,224,0.95)";
  ctx.shadowBlur = 45;
  ctx.fillStyle = "#1BA4E0";
  ctx.font = `800 italic 170px ${FONT_STACK}`;
  ctx.fillText("BATTLES 3", W / 2, photoH + 440);
  ctx.restore();

  // ─── date badge
  const badgeY = photoH + 520;
  const badgeW = 720;
  const badgeH = 90;
  const badgeX = (W - badgeW) / 2;
  ctx.save();
  ctx.fillStyle = "rgba(27,164,224,0.12)";
  ctx.strokeStyle = "#1BA4E0";
  ctx.lineWidth = 3;
  roundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#1BA4E0";
  ctx.font = `700 48px ${FONT_STACK}`;
  ctx.fillText("30-31.7  •  ראשון לציון", W / 2, badgeY + 62);

  // ─── URL — bottom
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `600 36px ${FONT_STACK}`;
  ctx.fillText("battles3.calima.co.il", W / 2, H - 80);

  // ─── subtle bottom electric accent line
  ctx.fillStyle = "rgba(27,164,224,0.6)";
  ctx.fillRect(W / 2 - 80, H - 50, 160, 4);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
