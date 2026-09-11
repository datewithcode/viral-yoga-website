// Minimal Resend stand-in for local tests: accepts the enquiry email copy.
import { createServer } from 'node:http';
let n = 0;
const read = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => b += c); req.on('end', () => r(b)); });
createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
  if (!(req.headers.authorization ?? '').startsWith('Bearer ')) return send(401, { message: 'no auth' });
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/emails') {
    const b = JSON.parse(await read(req));
    console.log('EMAIL to', b.to, 'subject', b.subject);
    return send(200, { id: 'email_' + (++n) });
  }
  send(404, { message: 'not found ' + url.pathname });
}).listen(4599, '0.0.0.0', () => console.log('mock resend on 4599'));
