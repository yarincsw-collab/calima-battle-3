"use client";

import Link from "next/link";
import { track } from "@/lib/track";

/**
 * Drop-in replacement for <Link href="/register"> that also fires a
 * "register_click" analytics event the moment it's tapped.
 */
export function TrackedRegisterLink({
  className,
  children,
  source,
}: {
  className?: string;
  children: React.ReactNode;
  source: string;
}) {
  return (
    <Link
      href="/register"
      onClick={() => track("register_click", { source })}
      className={className}
    >
      {children}
    </Link>
  );
}
