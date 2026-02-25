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

export interface AppUserRow {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  display_name: string | null;
}

export async function getAppUserByEmail(email: string): Promise<AppUserRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('app_users')
    .select('id, email, password_hash, role, display_name')
    .eq('email', normalized)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as AppUserRow;
}
