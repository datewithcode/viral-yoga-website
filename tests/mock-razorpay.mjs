// Minimal Razorpay stand-in for local tests: orders + payments.
import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';
const orders = new Map(); const payments = new Map(); let n = 0;
const read = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => b += c); req.on('end', () => r(b)); });
createServer(async (req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json', ...cors }); res.end(JSON.stringify(obj)); };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Basic ') && !auth.startsWith('Bearer ')) return send(401, { error: { description: 'no auth' } });
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/v1/orders') {
    const body = JSON.parse(await read(req)); const id = `order_MOCK${++n}${Math.random().toString(36).slice(2,8)}`;
    const o = { id, entity: 'order', amount: body.amount, currency: body.currency, receipt: body.receipt, notes: body.notes, status: 'created', created_at: Math.floor(Date.now()/1000) };
    orders.set(id, o); console.log('order', id, body.amount, JSON.stringify(body.notes)); return send(200, o);
  }
  // Test helper: simulate a customer paying an order. Not a Razorpay endpoint.
  if (req.method === 'POST' && url.pathname === '/mock/pay') {
    const b = JSON.parse(await read(req)); const o = orders.get(b.order_id); if (!o) return send(404, { error: { description: 'no order' } });
    const id = `pay_MOCK${++n}${Math.random().toString(36).slice(2,8)}`; const amount = b.amount ?? o.amount;
    const p = { id, entity: 'payment', amount, currency: b.currency ?? 'INR', status: b.status ?? 'captured', order_id: o.id, method: 'upi', captured: (b.status ?? 'captured') === 'captured', email: b.email ?? null, contact: b.contact ?? null, notes: o.notes, vpa: 'x@upi', created_at: Math.floor(Date.now()/1000) };
    payments.set(id, p); if (p.captured) o.status = 'paid'; return send(200, { ...p, signature: createHmac('sha256', 'mockkeysecret').update(`${o.id}|${id}`).digest('hex') });
  }
  if (req.method === 'POST' && url.pathname === '/emails') { const b = JSON.parse(await read(req)); console.log('EMAIL to', b.to, 'subject', b.subject); return send(200, { id: 'email_' + (++n) }); }
  const m = url.pathname.match(/^\/v1\/payments\/([^/]+)$/);
  if (req.method === 'GET' && m) { const p = payments.get(m[1]); return p ? send(200, p) : send(400, { error: { description: 'The id provided does not exist' } }); }
  send(404, { error: { description: 'not found ' + url.pathname } });
}).listen(4599, '0.0.0.0', () => console.log('mock razorpay on 4599'));
