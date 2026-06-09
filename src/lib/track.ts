// Lightweight client-side analytics tracker.
// Fires fire-and-forget POSTs to /api/track. Generates and stores a
// short anonymous visitor id in localStorage so we can count uniques.

const STORAGE_KEY = "calima-vid";

export type TrackEvent =
  | "page_view"
  | "register_click"
  | "register_started"
  | "register_completed"
  | "share_open"
  | "share_download"
  | "share_whatsapp"
  | "share_native"
  | "rules_view";

function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      const rand =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      id = rand;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function track(event: TrackEvent, meta?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    event,
    visitorId: getVisitorId(),
    path: window.location.pathname,
    meta: meta || null,
  });

  // Use sendBeacon when available for fire-and-forget delivery
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  // Fallback
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* silent */
  });
}
