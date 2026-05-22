"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered slide-in. Optionally scales / rotates the element as it
 * enters the viewport so images "pop" instead of just sliding.
 *
 * Usage:
 *   <SlideIn from="left" delay={100} pop>
 *     <img ... />
 *   </SlideIn>
 */
export function SlideIn({
  children,
  from = "right",
  delay = 0,
  distance = 80,
  pop = false,
  className = "",
}: {
  children: React.ReactNode;
  from?: "left" | "right";
  delay?: number;
  distance?: number;
  /** Adds a scale-up "pop" effect on entry. */
  pop?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const sign = from === "left" ? -1 : 1;
  const restingScale = pop ? 0.78 : 1;
  const restingRotate = pop ? sign * 6 : sign * 3;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0) rotate(0) scale(1)"
          : `translateX(${distance * sign}px) rotate(${restingRotate}deg) scale(${restingScale})`,
        transition: `opacity 800ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform ${pop ? "1100ms" : "900ms"} cubic-bezier(.16,1,.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
