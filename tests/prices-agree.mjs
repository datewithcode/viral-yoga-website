// Plan names and prices live in more than one file, because the browser, the
// Edge Functions and the database each need them and cannot import each other.
// This check fails the build the moment they drift apart, so a price edited in
// one place can never leave the site saying one number and Razorpay charging
// another.
import { readFileSync } from 'node:fs';

const site = readFileSync('src/data/site.ts', 'utf8');
const fns = readFileSync('supabase/functions/_shared/payments.ts', 'utf8');
const lib = readFileSync('src/lib/supabase.ts', 'utf8');
const schema = readFileSync('supabase/migrations/20260905184331_membership_system.sql', 'utf8');

const sitePlans = Object.fromEntries([...site.matchAll(/\{\s*name:\s*'([^']+)',\s*price:\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]));
const fnPlans = Object.fromEntries([...fns.matchAll(/^\s*"([^"]+)":\s*(\d+),?\s*$/gm)].map((m) => [m[1], Number(m[2])]));
const siteFee = Number(site.match(/onlineFeePercent:\s*([\d.]+)/)?.[1]);
const fnFee = Number(fns.match(/ONLINE_FEE_PERCENT\s*=\s*([\d.]+)/)?.[1]);
const libNames = [...(lib.match(/PLAN_NAMES\s*=\s*\[([^\]]+)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
const sqlChecks = [...schema.matchAll(/plan in \(([^)]+)\)/g)].map((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
const sqlCases = [...schema.matchAll(/when '([^']+)'\s+then interval/g)].map((m) => m[1]);

let failed = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) { failed++; console.log(`      ${detail}`); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

check('site.ts lists some plans', Object.keys(sitePlans).length >= 1, JSON.stringify(sitePlans));
check('prices: site.ts and payments.ts agree', same(sitePlans, fnPlans), `site ${JSON.stringify(sitePlans)} vs functions ${JSON.stringify(fnPlans)}`);
check('online fee: site.ts and payments.ts agree', siteFee === fnFee, `site ${siteFee} vs functions ${fnFee}`);
const names = Object.keys(sitePlans);
check('plan names: lib/supabase.ts agrees', same(names, libNames), `site ${names} vs lib ${libNames}`);
check('plan names: both database check constraints agree', sqlChecks.length === 2 && sqlChecks.every((c) => same(c, names)), `sql ${JSON.stringify(sqlChecks)}`);
check('plan names: plan_end_date() knows every plan', same(sqlCases, names), `sql ${sqlCases}`);

console.log(`\npassed ${6 - failed}, failed ${failed}`);
process.exit(failed ? 1 : 0);
