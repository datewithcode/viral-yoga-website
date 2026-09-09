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

export const PLAN_NAMES = ['1 month', '3 months', '6 months', '1 year'] as const;

export const inr = (paise: number) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');

export const formatDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Days from today (India) until a date. Negative when past.
export const daysUntil = (iso: string) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const a = new Date(today + 'T00:00:00Z').getTime();
  const b = new Date(iso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
};
