"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Goku mascot — DRAGON BALL Z STYLE.
 *
 * What's going on:
 *  • Goku photo at the center, slightly tilts toward the cursor and
 *    "breathes" with an idle bob.
 *  • A glowing KAMEHAMEHA beam shoots from his hands toward the
 *    cursor in real-time. A bright energy ball sits at the cursor tip.
 *  • Constant Super-Saiyan aura behind him + 6 orbiting ki sparks.
 *  • Every ~10s he kicks into a handstand (whole image flips 180°)
 *    and his aura intensifies.
 *  • Lightning bolts crackle around him while in handstand mode.
 */

const W = 280;
const H = 360;
const CX = W / 2;
const CY = H * 0.5;

const IMG_W = 175;
const IMG_H = 260;
const IMG_X = CX - IMG_W / 2;
const IMG_Y = CY - IMG_H / 2 + 10;

// "Hand" origin where the Kamehameha shoots from — roughly Goku's chest level
const HAND_X = CX;
const HAND_Y = CY + 10;

type V = { x: number; y: number };

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function CalisthenicsMascot() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const rawTarget = useRef<V>({ x: CX + 90, y: CY - 80 });
  const smoothTarget = useRef<V>({ x: CX + 90, y: CY - 80 });
  const flipRef = useRef(0);
  const timeRef = useRef(0); // ms since mount
  const rafRef = useRef(0);

  const [, force] = useState(0);

  // Six ki orbs orbiting Goku with phase offsets
  const orbPhases = useMemo(
    () => [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI * 2) / 6 + Math.random() * 0.4),
    [],
  );

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      rawTarget.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // 60fps loop
  useEffect(() => {
    const start = performance.now();
    function tick() {
      timeRef.current = performance.now() - start;
      smoothTarget.current.x += (rawTarget.current.x - smoothTarget.current.x) * 0.2;
      smoothTarget.current.y += (rawTarget.current.y - smoothTarget.current.y) * 0.2;
      force((n) => (n + 1) % 1000000);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Periodic handstand cycle
  useEffect(() => {
    let alive = true;
    function sleep(ms: number) {
      return new Promise<void>((r) => setTimeout(r, ms));
    }
    function anim(durMs: number, setter: (p: number) => void) {
      return new Promise<void>((resolve) => {
        const s = performance.now();
        function step() {
          const t = Math.min(1, (performance.now() - s) / durMs);
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

  const flip = flipRef.current;
  const flipAngle = flip * Math.PI;
  const t = timeRef.current;
  const tSec = t / 1000;

  // Inverse-rotate mouse to body frame
  const dx = smoothTarget.current.x - CX;
  const dy = smoothTarget.current.y - CY;
  const cosA = Math.cos(-flipAngle);
  const sinA = Math.sin(-flipAngle);
  const localMouse = {
    x: CX + dx * cosA - dy * sinA,
    y: CY + dx * sinA + dy * cosA,
  };

  // Tilt + breathing + sway
  const leanRad = clamp((localMouse.x - CX) * 0.0018, -0.22, 0.22);
  const breath = Math.sin(tSec * 1.6) * 1.8; // gentle bob
  const swayY = clamp((CY - localMouse.y) * 0.04, -6, 6) + breath;

  const totalRot = flipAngle + leanRad;

  // ── Kamehameha beam from HAND_X/Y toward smoothTarget (in screen frame)
  const beamFrom = { x: HAND_X, y: HAND_Y };
  const beamTo = smoothTarget.current;
  const beamDx = beamTo.x - beamFrom.x;
  const beamDy = beamTo.y - beamFrom.y;
  const beamLen = Math.hypot(beamDx, beamDy);
  const beamAngle = (Math.atan2(beamDy, beamDx) * 180) / Math.PI;
  const beamPulse = 1 + 0.18 * Math.sin(tSec * 12);

  // Orbit center for ki orbs (follows Goku slightly with sway/lean)
  const orbCx = CX + Math.sin(leanRad) * 8;
  const orbCy = CY + swayY * 0.4;

  return (
    <div
      ref={wrapRef}
      className="relative w-full max-w-[280px] mx-auto select-none"
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
          rx={50 + Math.abs(leanRad) * 30}
          ry={6 + Math.sin(tSec * 3) * 0.6}
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

        {/* always-on golden aura that pulses */}
        <circle
          cx={CX}
          cy={CY}
          r={100 + 8 * Math.sin(tSec * 2.5) + flip * 25}
          fill="url(#auraOuter)"
          opacity={0.35 + flip * 0.35 + 0.05 * Math.sin(tSec * 3)}
          style={{ filter: "blur(18px)" }}
        />
        <circle
          cx={CX}
          cy={CY}
          r={70 + 5 * Math.sin(tSec * 4) + flip * 18}
          fill="url(#auraInner)"
          opacity={0.55 + flip * 0.35}
          style={{ filter: "blur(8px)" }}
        />

        {/* Lightning bolts during handstand */}
        {flip > 0.4 &&
          [0, 1, 2, 3].map((i) => {
            const ang = (tSec * 1.2 + i * 1.6) % (Math.PI * 2);
            const r1 = 65 + Math.sin(tSec * 7 + i) * 6;
            const r2 = 100 + Math.sin(tSec * 9 + i) * 8;
            const x1 = CX + Math.cos(ang) * r1;
            const y1 = CY + Math.sin(ang) * r1;
            const x2 = CX + Math.cos(ang + 0.2) * r2;
            const y2 = CY + Math.sin(ang + 0.2) * r2;
            const mx = (x1 + x2) / 2 + Math.sin(tSec * 20 + i) * 4;
            const my = (y1 + y2) / 2 + Math.cos(tSec * 22 + i) * 4;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`}
                stroke="#9EE3FF"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
                opacity={(flip - 0.4) * 1.5}
              />
            );
          })}

        {/* Goku image — tilts with mouse + flip */}
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
              filter: `drop-shadow(0 0 ${10 + flip * 8}px rgba(255, 215, 73, ${0.4 + flip * 0.5}))`,
            }}
          />
          {/* color-grade overlay to push it toward gold */}
          <rect
            x={IMG_X}
            y={IMG_Y}
            width={IMG_W}
            height={IMG_H}
            fill="url(#gradeGold)"
            opacity={0.18 + flip * 0.2}
            clipPath="url(#gokuClip)"
            style={{ mixBlendMode: "overlay" }}
          />
        </g>

        {/* ──────── KAMEHAMEHA BEAM (rendered in screen frame) ──────── */}
        {beamLen > 8 && (
          <g
            style={{
              transform: `translate(${beamFrom.x}px, ${beamFrom.y}px) rotate(${beamAngle}deg)`,
              transformOrigin: "0 0",
            }}
          >
            {/* outer glow */}
            <rect
              x={0}
              y={-22 * beamPulse}
              width={beamLen}
              height={44 * beamPulse}
              rx={22}
              fill="url(#beamGlow)"
              opacity={0.6}
              style={{ filter: "blur(8px)" }}
            />
            {/* main blue beam */}
            <rect
              x={0}
              y={-10 * beamPulse}
              width={beamLen}
              height={20 * beamPulse}
              rx={10}
              fill="url(#beam)"
            />
            {/* bright core */}
            <rect
              x={0}
              y={-4 * beamPulse}
              width={beamLen}
              height={8 * beamPulse}
              rx={4}
              fill="#FFFFFF"
              opacity={0.95}
            />
          </g>
        )}

        {/* Energy ball at the cursor */}
        <g style={{ transform: `translate(${beamTo.x}px, ${beamTo.y}px)` }}>
          <circle r={28 * beamPulse} fill="url(#ballOuter)" opacity={0.4} style={{ filter: "blur(8px)" }} />
          <circle r={16 * beamPulse} fill="url(#ballMid)" opacity={0.85} />
          <circle r={8 * beamPulse} fill="#FFFFFF" />
        </g>

        {/* Orbiting ki sparks */}
        {orbPhases.map((p, i) => {
          const a = tSec * 0.9 + p;
          const radius = 78 + Math.sin(tSec * 2 + i) * 6;
          const ox = orbCx + Math.cos(a) * radius;
          const oy = orbCy + Math.sin(a) * radius * 0.7;
          const r = 3 + Math.sin(tSec * 5 + i) * 1.2;
          return (
            <g key={i}>
              <circle cx={ox} cy={oy} r={r * 3} fill="#FFE873" opacity={0.25} style={{ filter: "blur(4px)" }} />
              <circle cx={ox} cy={oy} r={r} fill="#FFF4A1" />
            </g>
          );
        })}

        <defs>
          <radialGradient id="auraOuter" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFE873" stopOpacity="1" />
            <stop offset="60%" stopColor="#FFA94D" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF7000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="auraInner" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFE873" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFA94D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="gradeGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE873" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFA94D" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7BEBFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#3FB5FF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1B7FE0" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="beamGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9EE3FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#1B4DA8" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="ballOuter" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="60%" stopColor="#7BEBFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1B7FE0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ballMid" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="60%" stopColor="#9EE3FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3FB5FF" stopOpacity="0.4" />
          </radialGradient>
          <clipPath id="gokuClip">
            <rect x={IMG_X} y={IMG_Y} width={IMG_W} height={IMG_H} rx={18} ry={18} />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
