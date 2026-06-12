"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Goku mascot.
 *  • Uses /public/goku.JPG as the actual character.
 *  • The figure leans/tilts toward the mouse cursor.
 *  • Every ~10s it kicks into a handstand (180° flip) and holds it
 *    for ~5s before returning. During the handstand a Super-Saiyan
 *    aura pulses behind it.
 *  • Floor shadow that moves with the lean.
 */

const W = 260;
const H = 360;
const CX = W / 2;
const CY = H * 0.5;

// Image proportions on canvas
const IMG_W = 200;
const IMG_H = 280;
const IMG_X = CX - IMG_W / 2;
const IMG_Y = CY - IMG_H / 2;

type V = { x: number; y: number };

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function CalisthenicsMascot() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Mouse position (refs to keep the animation loop cheap)
  const rawTarget = useRef<V>({ x: CX, y: CY - 80 });
  const smoothTarget = useRef<V>({ x: CX, y: CY - 80 });
  const flipRef = useRef(0); // 0 = stand, 1 = handstand
  const rafRef = useRef(0);

  // dummy state just to trigger re-render at 60fps
  const [, force] = useState(0);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      rawTarget.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    function tick() {
      smoothTarget.current.x += (rawTarget.current.x - smoothTarget.current.x) * 0.16;
      smoothTarget.current.y += (rawTarget.current.y - smoothTarget.current.y) * 0.16;
      force((n) => (n + 1) % 1000000);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Periodic handstand: stand 9s → flip 700ms → hold 5s → unflip 700ms
  useEffect(() => {
    let alive = true;
    function sleep(ms: number) {
      return new Promise<void>((r) => setTimeout(r, ms));
    }
    function anim(durMs: number, setter: (p: number) => void) {
      return new Promise<void>((resolve) => {
        const start = performance.now();
        function step() {
          const t = Math.min(1, (performance.now() - start) / durMs);
          setter(t);
          if (t < 1 && alive) requestAnimationFrame(step);
          else resolve();
        }
        requestAnimationFrame(step);
      });
    }
    async function run() {
      while (alive) {
        await sleep(9000);
        if (!alive) return;
        await anim(700, (p) => (flipRef.current = easeInOut(p)));
        if (!alive) return;
        await sleep(5000);
        if (!alive) return;
        await anim(700, (p) => (flipRef.current = 1 - easeInOut(p)));
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, []);

  // ---- compute orientation ----
  const flip = flipRef.current;
  const flipAngle = flip * Math.PI; // 0..π

  // Inverse-rotate mouse to body frame for lean calculation
  const dx = smoothTarget.current.x - CX;
  const dy = smoothTarget.current.y - CY;
  const cosA = Math.cos(-flipAngle);
  const sinA = Math.sin(-flipAngle);
  const localMouse = {
    x: CX + dx * cosA - dy * sinA,
    y: CY + dx * sinA + dy * cosA,
  };

  // Lean: tilt toward mouse direction (max ±12°)
  const leanRad = clamp((localMouse.x - CX) * 0.0015, -0.21, 0.21);
  // Slight forward/backward sway: shift image down a bit when mouse above
  const swayY = clamp((CY - localMouse.y) * 0.04, -6, 6);

  const totalRot = flipAngle + leanRad; // radians

  return (
    <div
      ref={wrapRef}
      className="relative w-full max-w-[260px] mx-auto select-none"
      style={{ height: H }}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        {/* shadow */}
        <ellipse
          cx={CX + Math.sin(leanRad) * 28}
          cy={H - 18}
          rx={48 + Math.abs(leanRad) * 30}
          ry={6}
          fill="rgba(0,0,0,0.45)"
          style={{ filter: "blur(3px)" }}
        />

        {/* electric ground line */}
        <line
          x1={20}
          y1={H - 12}
          x2={W - 20}
          y2={H - 12}
          stroke="rgba(27,164,224,0.45)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* golden aura — pulses in handstand mode */}
        {flip > 0.1 && (
          <>
            <circle
              cx={CX}
              cy={CY}
              r={95 + flip * 25}
              fill="url(#aura)"
              opacity={flip * 0.55}
              style={{ filter: "blur(14px)" }}
            />
            <circle
              cx={CX}
              cy={CY}
              r={75 + flip * 15}
              fill="url(#auraInner)"
              opacity={flip * 0.7}
              style={{ filter: "blur(6px)" }}
            />
          </>
        )}

        {/* Goku image — rotates with flip + lean */}
        <g
          style={{
            transform: `rotate(${(totalRot * 180) / Math.PI}deg) translate(0px, ${swayY}px)`,
            transformOrigin: `${CX}px ${CY}px`,
          }}
        >
          <image
            href="/goku-mascot.jpg"
            x={IMG_X}
            y={IMG_Y}
            width={IMG_W}
            height={IMG_H}
            preserveAspectRatio="xMidYMid meet"
            clipPath="url(#gokuClip)"
            style={{
              filter: flip > 0.3 ? `drop-shadow(0 0 12px rgba(255, 215, 73, ${flip * 0.8}))` : undefined,
            }}
          />
        </g>

        <defs>
          <radialGradient id="aura" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFE873" stopOpacity="1" />
            <stop offset="60%" stopColor="#FFA94D" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF7000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="auraInner" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFE873" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFA94D" stopOpacity="0" />
          </radialGradient>
          {/* soft rounded clip so the image edges feel less harsh */}
          <clipPath id="gokuClip">
            <rect x={IMG_X} y={IMG_Y} width={IMG_W} height={IMG_H} rx={14} ry={14} />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
