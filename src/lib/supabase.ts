import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Both values are safe to ship to the browser. Set them in .env (see .env.example).
const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined;

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
