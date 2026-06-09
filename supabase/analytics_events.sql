-- Run this in Supabase SQL Editor to enable analytics tracking
-- (page views, register clicks, share actions, etc.)

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          BIGSERIAL PRIMARY KEY,
  event       TEXT NOT NULL,
  visitor_id  TEXT,
  path        TEXT,
  meta        JSONB,
  user_agent  TEXT,
  referer     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_idx
  ON public.analytics_events (event);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
  ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_visitor_idx
  ON public.analytics_events (visitor_id);

-- We write/read only with the service role key from server endpoints,
-- so RLS can stay enabled with no public policies.
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
