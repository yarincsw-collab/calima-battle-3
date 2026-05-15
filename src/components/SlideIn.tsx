"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered slide-in from left or right.
 * Designed for the photo gallery — images "pop" into view as you scroll.
 *
 * Usage:
 *   <SlideIn from="left" delay={100}><img ... /></SlideIn>
 */
export function SlideIn({
  children,
  from = "right",
  delay = 0,
  distance = 80,
  className = "",
}: {
  children: React.ReactNode;
  from?: "left" | "right";
  delay?: number;
  distance?: number;
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
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0) rotate(0)" : `translateX(${distance * sign}px) rotate(${sign * 3}deg)`,
        transition: `opacity 800ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 900ms cubic-bezier(.16,1,.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
