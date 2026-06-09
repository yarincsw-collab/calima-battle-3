"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Post-registration share component — appears on /success.
 *  • Canvas is 1080x1920 (Instagram Story / TikTok portrait).
 *  • Default text: "גם אני נרשמתי לתחרות Calima Battles 3"
 *  • User can optionally upload a personal photo to embed.
 *  • Buttons: Download / WhatsApp deeplink / native share.
 */

const W = 1080;
const H = 1920;
const SITE_URL = "https://battles3.calima.co.il";
const SHARE_TEXT = "גם אני נרשמתי לתחרות Calima Battles 3 🔥 30-31.7 ראשל\"צ — נתראה בבמה.";
const FONT_STACK =
  '"Open Sans","Open Sans Hebrew","Segoe UI",system-ui,sans-serif';

export function RegistrationShare() {
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

  useEffect(() => {
    if (typeof document !== "undefined" && (document as any).fonts) {
      (document as any).fonts.ready.then(() => drawStory(canvasRef.current, photo));
    } else {
      drawStory(canvasRef.current, photo);
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

  function shareToWhatsapp() {
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
        /* user cancelled */
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 card p-5 sm:p-7 border-electric-500/40 shadow-glow">
      <div className="text-center mb-5">
        <div className="text-electric-400 text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-2 not-italic">
          ספרו לעולם
        </div>
        <h2 className="grunge-text text-2xl sm:text-3xl text-white">
          שתפו שאתם בפנים 🔥
        </h2>
        <p className="mt-2 text-white/60 text-xs sm:text-sm leading-6">
          העלו תמונה שלכם או שתפו בלי תמונה — הסטורי המגניב מוכן.
        </p>
      </div>

      {/* Canvas preview */}
      <div className="mx-auto w-44 sm:w-52 aspect-[9/16] rounded-xl overflow-hidden border border-electric-500/30 bg-ink-900 shadow-glow">
        <canvas ref={canvasRef} width={W} height={H} className="w-full h-full block" />
      </div>

      {/* Controls */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          className="py-3 rounded-xl bg-ink-800 border border-white/15 text-white hover:bg-ink-700 transition text-sm font-bold not-italic"
        >
          📷 {photo ? "החלף תמונה" : "הוסף תמונה"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={download}
          className="py-3 rounded-xl bg-electric-500 text-ink-950 hover:bg-electric-400 transition text-sm font-bold not-italic disabled:opacity-40"
        >
          📥 הורד לסטורי
        </button>

        <button
          type="button"
          onClick={shareToWhatsapp}
          className="py-3 rounded-xl bg-[#25D366] text-white hover:bg-[#1eb053] transition text-sm font-bold not-italic"
        >
          💬 שתף בוואטסאפ
        </button>

        {canShare && (
          <button
            type="button"
            disabled={busy}
            onClick={shareNative}
            className="py-3 rounded-xl bg-ink-800 border border-electric-500/40 text-electric-400 hover:bg-ink-700 transition text-sm font-bold not-italic disabled:opacity-40"
          >
            📲 שתף לאינסטה / עוד
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-[11px] text-white/40 leading-5 not-italic">
        💡 לאינסטה: לחצו "הורד לסטורי" → פתחו אינסטה → סטורי חדש → בחרו את התמונה מהגלריה.
        <br />
        תייגו אותנו <span className="text-electric-400">@calima.calisthenics</span>
      </p>
    </div>
  );
}

/* ────────────────────────────────────────── canvas drawing */

function drawStory(canvas: HTMLCanvasElement | null, photo: HTMLImageElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // background: ink with diagonal electric stripes
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0A1018");
  bg.addColorStop(1, "#05070A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // diagonal stripes (subtle)
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = "rgba(27,164,224,0.05)";
  for (let i = -2000; i < 2000; i += 90) {
    ctx.fillRect(i, -2000, 45, 4000);
  }
  ctx.restore();

  // photo (if uploaded) — circular crop in upper area
  const photoSize = 760;
  const photoX = (W - photoSize) / 2;
  const photoY = 380;
  if (photo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    // cover-fit
    const ratio = Math.max(photoSize / photo.width, photoSize / photo.height);
    const drawW = photo.width * ratio;
    const drawH = photo.height * ratio;
    const dx = photoX + (photoSize - drawW) / 2;
    const dy = photoY + (photoSize - drawH) / 2;
    ctx.drawImage(photo, dx, dy, drawW, drawH);
    ctx.restore();

    // electric ring
    ctx.strokeStyle = "#1BA4E0";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 5, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // placeholder ring
    ctx.strokeStyle = "rgba(27,164,224,0.4)";
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 18]);
    ctx.beginPath();
    ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `600 30px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.fillText("התמונה שלך כאן", W / 2, photoY + photoSize / 2 + 12);
  }

  // ─── top kicker
  ctx.fillStyle = "#1BA4E0";
  ctx.font = `700 italic 50px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "8px";
  ctx.fillText("אני בפנים", W / 2, 230);

  // ─── "גם אני נרשמתי לתחרות" (Hebrew tagline)
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 italic 60px ${FONT_STACK}`;
  ctx.fillText("גם אני נרשמתי לתחרות", W / 2, 1260);

  // ─── CALIMA BATTLES 3 wordmark — huge
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 italic 130px ${FONT_STACK}`;
  ctx.fillText("CALIMA", W / 2, 1410);

  // 3D-ish electric BATTLES with shadow
  ctx.save();
  ctx.shadowColor = "rgba(27,164,224,0.7)";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#1BA4E0";
  ctx.font = `800 italic 170px ${FONT_STACK}`;
  ctx.fillText("BATTLES 3", W / 2, 1570);
  ctx.restore();

  // ─── dates & venue
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 48px ${FONT_STACK}`;
  ctx.fillText("30-31.7  |  ראשון לציון", W / 2, 1700);

  // ─── electric divider
  ctx.fillStyle = "#1BA4E0";
  ctx.fillRect(W / 2 - 200, 1740, 400, 6);

  // ─── URL
  ctx.fillStyle = "#1BA4E0";
  ctx.font = `600 36px ${FONT_STACK}`;
  ctx.fillText("battles3.calima.co.il", W / 2, 1820);
}
