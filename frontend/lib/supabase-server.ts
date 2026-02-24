/**
 * Server-side Supabase client for API routes.
 * Uses the service_role key so all operations run with full access (no RLS).
 * Only use this in API routes or server components, never in client code.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !serviceRoleKey) return null;
  if (!client) {
    client = createClient(url, serviceRoleKey);
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceRoleKey);
}
