// Browser check for the student membership page: what a member actually sees
// when their newest membership has expired. The API tests in functions.sh
// cannot see this, because the labels are decided in the browser.
//
// Not run in CI (it needs Chrome and a built site). To run it by hand:
//
//   supabase start
//   supabase db reset --local && bash tests/seed.sh
//   bash tests/sql.sh "insert into public.members (name, phone, email, user_id) \
//     select 'Asha Rao','9876500001','asha@example.com', id from auth.users where email='asha@example.com'"
//   bash tests/sql.sh "insert into public.memberships (member_id, plan, amount_paise, starts_on, source) \
//     select id,'1 month',200000,current_date - 35,'razorpay' from public.members where email='asha@example.com'"
//   printf 'PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nPUBLIC_SUPABASE_PUBLISHABLE_KEY=<from supabase status>\n' > .env
//   npm run build && (cd dist && python3 -m http.server 4399 &)
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//     --remote-debugging-port=9222 --user-data-dir=/tmp/vy-chrome &
//   node tests/browser-membership.mjs /tmp
//
// Expected: the newest card says "Expired membership" in red with a renew line,
// older ones say "Earlier membership", and a membership still running says
// "Current membership" in green. Delete .env afterwards.
import { writeFileSync } from 'node:fs';
const S = process.argv[2];
const list = await (await fetch('http://127.0.0.1:9222/json')).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(m.error) : p.res(m.result); } };
await new Promise((r) => (ws.onopen = r));
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result.value; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(`${S}/${name}.png`, Buffer.from(s.data, 'base64')); };

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 2, mobile: true });

await send('Page.navigate', { url: 'http://localhost:4399/my-membership/' });
await wait(2500);

// Ask for the sign-in link.
await ev(`(()=>{document.querySelector('#signin-email').value='asha@example.com'; document.querySelector('[data-email-form]').requestSubmit(); return true})()`);
await wait(3000);
console.log('sign-in message:', await ev(`document.querySelector('[data-email-msg]').textContent`));

// Take the link out of the local mailbox.
const msgs = await (await fetch('http://127.0.0.1:54324/api/v1/messages?limit=5')).json();
const newest = (msgs.messages ?? msgs.items ?? msgs)[0];
const body = await (await fetch(`http://127.0.0.1:54324/api/v1/message/${newest.ID ?? newest.id}`)).json();
const html = body.HTML ?? body.html ?? body.Text ?? '';
const raw = (html.match(/https?:\/\/[^"'\s<>]*verify[^"'\s<>]*/) || [])[0];
const link = raw && raw.replace(/&amp;/g, '&');
if (!link) throw new Error('no sign-in link in the email: ' + html.slice(0, 300));

await send('Page.navigate', { url: link });
await wait(4000);
await ev(`location.href.includes('my-membership') ? true : (location.href='http://localhost:4399/my-membership/', true)`);
await wait(3000);

console.log('url now:', await ev(`location.href`));
console.log('sections hidden ask/checking/result:', await ev(`['ask','checking','result'].map(i=>document.getElementById(i)?.hidden).join(',')`));
console.log('session key:', await ev(`Object.keys(localStorage).filter(k=>k.includes('auth-token')).join(',')`));
const cards = await ev(`Array.from(document.querySelectorAll('#cards > div')).map(c => Array.from(c.querySelectorAll('p')).map(p => p.textContent.trim()))`);
console.log('cards:', JSON.stringify(cards, null, 1));
console.log('status colour of first card:', await ev(`getComputedStyle(document.querySelector('#cards > div p:nth-of-type(3)')).color`));
console.log('border of first card:', await ev(`getComputedStyle(document.querySelector('#cards > div')).borderColor`));
console.log('empty-state hidden:', await ev(`document.getElementById('none').hidden`));
console.log('error-state hidden:', await ev(`document.getElementById('load-error').hidden`));
console.log('header button:', await ev(`document.querySelector('[data-signin]').textContent`));
await shot('expired-card');
ws.close();
