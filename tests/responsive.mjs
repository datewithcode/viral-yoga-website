// Responsive check at real phone widths.
//
// Chrome on macOS refuses to make its window narrower than about 500px, and
// `Emulation.setDeviceMetricsOverride` is clamped to 477px with `mobile: true`.
// With `mobile: false` it reports the width you asked for while still laying the
// page out at 477, which is worse: it looks like it worked and quietly hides
// every narrow-screen problem. A 320px-wide iframe is a genuine layout viewport,
// media queries included, so that is what this uses.
//
// Cache-bust the frame src. Without it the frame serves the previous build and
// you debug a bug you already fixed.
//
//   (cd dist && python3 -m http.server 4399 &)
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//     --remote-debugging-port=9222 --user-data-dir=/tmp/vy-chrome --no-first-run &
//   node tests/responsive.mjs
const PAGES = ['/', '/admin/', '/privacy/', '/terms/', '/thanks/'];
const WIDTHS = [320, 360, 390, 430];

const list = await (await fetch('http://127.0.0.1:9222/json')).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(m.error) : p.res(m.result); } };
await new Promise((r) => (ws.onopen = r));
const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 250)); return r.result.value; };

await send('Page.enable');
await send('Emulation.clearDeviceMetricsOverride');
await send('Page.navigate', { url: 'http://localhost:4399/thanks/' });
await new Promise((r) => setTimeout(r, 900));

let fails = 0;
for (const path of PAGES) {
  for (const w of WIDTHS) {
    const raw = await ev(`
      (async () => {
        document.querySelectorAll('iframe.probe').forEach(f => f.remove());
        const f = document.createElement('iframe');
        f.className = 'probe';
        f.style.cssText = 'width:${w}px;height:900px;border:0;position:fixed;left:0;top:0;z-index:99999;background:#fff';
        f.src = '${path}?b=' + Date.now();
        document.body.appendChild(f);
        await new Promise(r => { f.onload = r; setTimeout(r, 6000); });
        await new Promise(r => setTimeout(r, 600));
        const d = f.contentDocument, win = f.contentWindow;
        const bad = [];
        d.querySelectorAll('body *').forEach(el => {
          const b = el.getBoundingClientRect();
          const by = Math.round(b.right - ${w});
          if (by > 1 && el.offsetParent !== null) bad.push(el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '') + ' +' + by + 'px "' + el.textContent.trim().slice(0, 20) + '"');
        });
        return JSON.stringify({ vp: win.innerWidth, content: d.documentElement.scrollWidth, bad: bad.slice(0, 2) });
      })()
    `);
    const r = JSON.parse(raw);
    const ok = r.content <= w + 1 && r.bad.length === 0;
    if (!ok) fails++;
    console.log(`${ok ? 'PASS ' : 'FAIL '} ${path.padEnd(18)} ${String(w).padStart(4)}px  content ${r.content}${ok ? '' : '  ' + r.bad.join(' | ')}`);
  }
}
console.log(`\n${fails === 0 ? 'all widths fit' : fails + ' failing'}`);
ws.close();
process.exit(fails === 0 ? 0 : 1);
