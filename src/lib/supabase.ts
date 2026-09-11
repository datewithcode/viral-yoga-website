import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Both values are safe to ship to the browser: the publishable key can only do
// what row-level security allows. They default to the studio's own project in
// site.ts, so the site builds on any host with nothing to configure. Environment
// variables override them, which is how the local test project is used.
import { site } from '../data/site';

const url = (import.meta.env.PUBLIC_SUPABASE_URL as string | undefined) || site.supabaseUrl;
const key = (import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) || site.supabasePublishableKey;

export const isConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = isConfigured ? createClient(url!, key!) : null;
