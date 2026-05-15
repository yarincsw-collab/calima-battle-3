import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Both clients are lazy so missing env vars at module-load time
// (e.g. before .env.local is configured) don't crash the build.

let _publicClient: SupabaseClient | null = null;
export function supabasePublic(): SupabaseClient {
  if (_publicClient) return _publicClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase public env vars missing (URL / ANON_KEY)");
  _publicClient = createClient(url, key, { auth: { persistSession: false } });
  return _publicClient;
}

let _adminClient: SupabaseClient | null = null;
export function supabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin must only be used on the server");
  }
  if (_adminClient) return _adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing (URL / SERVICE_ROLE_KEY)");
  _adminClient = createClient(url, key, { auth: { persistSession: false } });
  return _adminClient;
}

export const DOCS_BUCKET = process.env.SUPABASE_DOCS_BUCKET || "battles3-docs";
