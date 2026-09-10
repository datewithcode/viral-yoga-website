import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Both values are safe to ship to the browser: the publishable key can only do
// what row-level security allows. They default to the studio's own project in
// site.ts, so the site builds on any host with nothing to configure. Environment
// variables override them, which is how the local test project is used.
import { site } from '../data/site';

const url = (import.meta.env.PUBLIC_SUPABASE_URL as string | undefined) || site.supabaseUrl;
const key = (import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) || site.supabasePublishableKey;

export const isConfigured = Boolean(url && key);

/**
 * The project name supabase-js builds its storage key from: it saves the
 * session under `sb-<projectRef>-auth-token`. Exported so the site header can
 * tell whether someone is signed in without loading the whole library on every
 * page. Derive it ONLY from here: a second copy of this line is what broke the
 * header when the environment variables were removed.
 */
export const projectRef = (() => {
  try {
    return url ? new URL(url).hostname.split('.')[0] : '';
  } catch {
    return '';
  }
})();

export const supabase: SupabaseClient | null = isConfigured ? createClient(url!, key!) : null;

/**
 * The header button has four states. This is the ONLY place they are decided
 * for pages that load supabase-js; Nav.astro's inline script mirrors the same
 * rules for the first paint, before this library is available.
 *
 *   no session                    -> "Sign in"          -> /my-membership/
 *   owner (app_metadata.role)     -> "Admin"            -> /admin/
 *   member with a cached name     -> "Hi, <first name>" -> /my-membership/
 *   signed in, nothing else known -> "Your membership"  -> /my-membership/
 */
export function syncHeader(session: { user?: { id?: string; app_metadata?: Record<string, unknown> } } | null): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('[data-signin]');
  if (!links.length) return;
  let label = '';
  let href = '/my-membership/';
  if (session?.user) {
    if (session.user.app_metadata?.role === 'staff') {
      label = 'Admin';
      href = '/admin/';
    } else {
      let name = '';
      try {
        const cached = JSON.parse(localStorage.getItem('vy-member') || 'null');
        if (cached && cached.id === session.user.id) name = String(cached.name || '').trim().split(' ')[0];
      } catch {}
      label = name ? `Hi, ${name}` : 'Your membership';
    }
  }
  links.forEach((a) => {
    a.textContent = label || a.dataset.signinDefault || 'Sign in';
    a.href = href;
    a.title = label || '';
  });
}

/** Keep the header right as people sign in and out, without a refresh. */
export function watchHeader(): void {
  if (!supabase) return;
  supabase.auth.onAuthStateChange((_event, session) => syncHeader(session));
}

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
