"use client";

import { useEffect, useRef } from "react";

interface Props {
  onChange: (dataUrl: string | null) => void;
}

/**
 * Lightweight HTML-canvas signature pad — no external dependency.
 * Outputs a data URL (PNG) whenever the user lifts their pointer.
 */
export function SignaturePad({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    // Use device pixel ratio for crisp lines on retina.
    const ratio = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect();
    cv.width = rect.width * ratio;
    cv.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = "#1BA4E0";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent) => {
    drawing.current = true;
    lastPt.current = point(e);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const draw = (e: React.PointerEvent) => {
    if (!drawing.current || !lastPt.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPt.current = p;
    dirty.current = true;
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPt.current = null;
    if (dirty.current) onChange(canvasRef.current!.toDataURL("image/png"));
  };

  const clear = () => {
    const cv = canvasRef.current!;
    cv.getContext("2d")!.clearRect(0, 0, cv.width, cv.height);
    dirty.current = false;
    onChange(null);
  };

  return (
    <div>
      <div className="rounded-xl bg-ink-800 border border-white/10 p-2 relative">
        <canvas
          ref={canvasRef}
          className="block w-full h-48 touch-none cursor-crosshair"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
          onPointerLeave={endDraw}
        />
      </div>
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-xs text-white/60 hover:text-electric-400 transition"
      >
        נקה חתימה
      </button>
    </div>
  );
}
