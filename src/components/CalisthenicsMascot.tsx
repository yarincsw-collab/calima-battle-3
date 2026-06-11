"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Calisthenics athlete mascot.
 *
 *  • SVG stick-figure with 2-bone IK arms and legs that reach toward
 *    the mouse cursor in real time.
 *  • Head subtly rotates so the face looks at the cursor.
 *  • Every ~10s the athlete kicks into a handstand (body flips 180°,
 *    legs become the active limbs chasing the cursor; palms plant on
 *    the floor). After ~5s standing-up flips back.
 *  • Pure client-side, no deps. Lives in a card the admin can drop
 *    wherever on the page.
 */

const W = 260;
const H = 360;

// proportions (body-frame coords; +y = down, +x = right)
const CX = W / 2;
const CY = H * 0.5;

const HEAD_R = 18;
const NECK_LEN = 10;
const TORSO = 76;
const SHOULDER_W = 32;
const HIP_W = 24;

const UPPER_ARM = 38;
const FOREARM = 42;
const UPPER_LEG = 50;
const LOWER_LEG = 54;

const SHOULDER_Y = CY - TORSO / 2;
const HIP_Y = CY + TORSO / 2;
const NECK_Y = SHOULDER_Y - NECK_LEN;
const HEAD_Y = NECK_Y - HEAD_R;

const SHOULDER_L = { x: CX - SHOULDER_W, y: SHOULDER_Y };
const SHOULDER_R = { x: CX + SHOULDER_W, y: SHOULDER_Y };
const HIP_L = { x: CX - HIP_W, y: HIP_Y };
const HIP_R = { x: CX + HIP_W, y: HIP_Y };

type V = { x: number; y: number };

function clampToReach(o: V, t: V, max: number): V {
  const dx = t.x - o.x;
  const dy = t.y - o.y;
  const d = Math.hypot(dx, dy);
  if (d <= max) return t;
  const s = max / d;
  return { x: o.x + dx * s, y: o.y + dy * s };
}

interface IK {
  joint: V;
  end: V;
}

/** 2-bone analytic IK. bend = +1 elbow bends one way, -1 the other. */
function ik2(o: V, target: V, L1: number, L2: number, bend: 1 | -1): IK {
  const t = clampToReach(o, target, L1 + L2 - 1);
  const dx = t.x - o.x;
  const dy = t.y - o.y;
  const d = Math.max(1, Math.hypot(dx, dy));
  const base = Math.atan2(dy, dx);
  const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  const a = Math.acos(Math.min(1, Math.max(-1, cosA)));
  const upper = base - a * bend;
  return {
    joint: { x: o.x + Math.cos(upper) * L1, y: o.y + Math.sin(upper) * L1 },
    end: t,
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function CalisthenicsMascot() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Latest mouse position in container coords (refs so the animation
  // loop is cheap and doesn't trigger React renders).
  const rawTarget = useRef<V>({ x: CX, y: CY - 80 });
  const smoothTarget = useRef<V>({ x: CX, y: CY - 80 });
  const flipRef = useRef(0); // 0 = stand, 1 = handstand
  const rafRef = useRef(0);

  // State just to trigger render
  const [, force] = useState(0);

  // Track mouse globally relative to our container
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      rawTarget.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Animation loop — smooth toward target and re-render at 60fps
  useEffect(() => {
    function tick() {
      smoothTarget.current.x += (rawTarget.current.x - smoothTarget.current.x) * 0.18;
      smoothTarget.current.y += (rawTarget.current.y - smoothTarget.current.y) * 0.18;
      force((n) => (n + 1) % 1000000);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Periodic handstand cycle: stand 9s → kick-up 600ms → hold 5s → kick-down 600ms
  useEffect(() => {
    let alive = true;

    async function run() {
      while (alive) {
        await sleep(9000);
        if (!alive) return;
        await anim(600, (p) => (flipRef.current = easeInOut(p)));
        if (!alive) return;
        await sleep(5000);
        if (!alive) return;
        await anim(600, (p) => (flipRef.current = 1 - easeInOut(p)));
      }
    }

    function sleep(ms: number) {
      return new Promise<void>((r) => setTimeout(r, ms));
    }
    function anim(durMs: number, setter: (p: number) => void) {
      return new Promise<void>((resolve) => {
        const start = performance.now();
        const step = () => {
          const t = Math.min(1, (performance.now() - start) / durMs);
          setter(t);
          if (t < 1 && alive) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  // ---------- compute skeleton ----------
  const flip = flipRef.current;
  const angle = flip * Math.PI; // rotation applied at render time

  // Inverse-rotate mouse to body frame
  const dx = smoothTarget.current.x - CX;
  const dy = smoothTarget.current.y - CY;
  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);
  const localMouse = {
    x: CX + dx * cosA - dy * sinA,
    y: CY + dx * sinA + dy * cosA,
  };

  // When flipped > 0.5 we treat as handstand mode.
  // Smoothly interpolate so the switch isn't jarring.
  const tFlip = flip; // 0..1
  const handMix = Math.min(1, Math.max(0, (tFlip - 0.4) / 0.2));

  // Arm target: lerp between (mouse) and (planted on ground)
  // "ground" in body frame during handstand = above shoulders (since rotated 180°)
  const groundedArmTarget = { x: CX, y: SHOULDER_Y - 90 };
  const armTarget = {
    x: lerp(localMouse.x, groundedArmTarget.x, handMix),
    y: lerp(localMouse.y, groundedArmTarget.y, handMix),
  };

  // Leg target: lerp between (planted down) and (mouse, in handstand)
  const groundedLegTarget = { x: CX, y: HIP_Y + 90 };
  const legTarget = {
    x: lerp(groundedLegTarget.x, localMouse.x, handMix),
    y: lerp(groundedLegTarget.y, localMouse.y, handMix),
  };

  // Slight body lean toward the cursor
  const leanX = clamp((localMouse.x - CX) * 0.03, -8, 8);

  // IK chains
  const armL = ik2({ x: SHOULDER_L.x + leanX, y: SHOULDER_L.y }, armTarget, UPPER_ARM, FOREARM, +1);
  const armR = ik2({ x: SHOULDER_R.x + leanX, y: SHOULDER_R.y }, armTarget, UPPER_ARM, FOREARM, -1);
  const legL = ik2(HIP_L, legTarget, UPPER_LEG, LOWER_LEG, -1);
  const legR = ik2(HIP_R, legTarget, UPPER_LEG, LOWER_LEG, +1);

  // Head: look at mouse (rotate slightly, eyes track)
  const headTo = localMouse;
  const headDx = headTo.x - CX;
  const headDy = headTo.y - HEAD_Y;
  const headAngle = Math.atan2(headDy, headDx) + Math.PI / 2; // 0 = face up
  // Limit head rotation
  const headRot = clamp(headAngle, -1.1, 1.1);

  // Eye offsets (track within head)
  const eyeMag = 3.2;
  const eyeDist = Math.max(1, Math.hypot(headDx, headDy));
  const eyeOx = (headDx / eyeDist) * eyeMag;
  const eyeOy = (headDy / eyeDist) * eyeMag;

  return (
    <div
      ref={wrapRef}
      className="relative w-full max-w-[260px] mx-auto select-none"
      style={{ height: H }}
      aria-hidden
    >
      {/* Floor line + soft shadow */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        {/* shadow */}
        <ellipse
          cx={CX + leanX * 0.7}
          cy={H - 18}
          rx={42 + Math.abs(leanX) * 0.6}
          ry={5.5}
          fill="rgba(27,164,224,0.25)"
          style={{ filter: "blur(2px)" }}
        />

        {/* electric ground line */}
        <line
          x1={20}
          y1={H - 12}
          x2={W - 20}
          y2={H - 12}
          stroke="rgba(27,164,224,0.5)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* character group — rotated for handstand */}
        <g
          style={{
            transform: `rotate(${angle}rad)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "transform 0s",
          }}
        >
          {/* legs (rendered first so they sit "behind" torso joints) */}
          <Limb a={HIP_L} b={legL.joint} c={legL.end} />
          <Limb a={HIP_R} b={legR.joint} c={legR.end} />

          {/* torso */}
          <path
            d={`M ${SHOULDER_L.x + leanX} ${SHOULDER_Y}
                L ${SHOULDER_R.x + leanX} ${SHOULDER_Y}
                L ${HIP_R.x} ${HIP_Y}
                L ${HIP_L.x} ${HIP_Y} Z`}
            fill="url(#torso)"
            stroke="#1BA4E0"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* neck */}
          <line
            x1={CX + leanX}
            y1={SHOULDER_Y}
            x2={CX + leanX * 0.6}
            y2={NECK_Y}
            stroke="#1BA4E0"
            strokeWidth={5.5}
            strokeLinecap="round"
          />

          {/* head — rotates to look at mouse */}
          <g
            transform={`translate(${CX + leanX * 0.5} ${HEAD_Y}) rotate(${
              (headRot * 180) / Math.PI
            })`}
          >
            <circle cx={0} cy={0} r={HEAD_R} fill="#EBC9A0" stroke="#1BA4E0" strokeWidth={2.5} />
            {/* hair stripe */}
            <path
              d={`M ${-HEAD_R + 4} ${-4} Q 0 ${-HEAD_R - 4} ${HEAD_R - 4} ${-4}`}
              fill="#0E1726"
            />
            {/* eyes */}
            <circle cx={-5.5 + eyeOx * 0.4} cy={1 + eyeOy * 0.3} r={2.2} fill="#0E1726" />
            <circle cx={5.5 + eyeOx * 0.4} cy={1 + eyeOy * 0.3} r={2.2} fill="#0E1726" />
            {/* tiny smile */}
            <path d="M -4 7 Q 0 10 4 7" stroke="#0E1726" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          </g>

          {/* arms (rendered last so hands appear on top of body) */}
          <Limb a={{ x: SHOULDER_L.x + leanX, y: SHOULDER_L.y }} b={armL.joint} c={armL.end} />
          <Limb a={{ x: SHOULDER_R.x + leanX, y: SHOULDER_R.y }} b={armR.joint} c={armR.end} />
        </g>

        <defs>
          <linearGradient id="torso" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1BA4E0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0A1018" stopOpacity="0.85" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Limb({ a, b, c }: { a: V; b: V; c: V }) {
  return (
    <g>
      {/* upper bone */}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="#1BA4E0"
        strokeWidth={8}
        strokeLinecap="round"
      />
      {/* lower bone */}
      <line
        x1={b.x}
        y1={b.y}
        x2={c.x}
        y2={c.y}
        stroke="#1BA4E0"
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* shoulder/hip joint */}
      <circle cx={a.x} cy={a.y} r={4.5} fill="#0E1726" stroke="#1BA4E0" strokeWidth={2} />
      {/* elbow/knee joint */}
      <circle cx={b.x} cy={b.y} r={3.8} fill="#0E1726" stroke="#1BA4E0" strokeWidth={2} />
      {/* hand/foot */}
      <circle cx={c.x} cy={c.y} r={5.2} fill="#1BA4E0" />
    </g>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
