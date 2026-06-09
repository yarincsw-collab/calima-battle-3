"use client";

import { useEffect } from "react";
import { track, TrackEvent } from "@/lib/track";

/**
 * Mount on any page to fire a single track event on initial load.
 * Used by landing page (page_view), /rules (rules_view), etc.
 */
export function AnalyticsTracker({ event }: { event: TrackEvent }) {
  useEffect(() => {
    track(event);
  }, [event]);
  return null;
}
