/**
 * Zero-dependency mock backend for template demos.
 * Run: `npm run mock` (or `bun run mock`) → http://localhost:9732
 *
 * - POST /chat        → Mode A JSON: { response }
 * - POST /chat/stream → Mode B chunked text stream
 * - POST /upload      → { status: 'success', file_id }
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_PORT ?? 9732);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
    // A client that disconnects mid-body never fires 'end' — resolve empty
    // instead of leaving the request handler pending forever.
    req.on('error', () => resolve({}));
    req.on('aborted', () => resolve({}));
  });
}

const server = createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    const data = await readBody(req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ response: `Mock reply to: ${data.message ?? '(empty)'}` }));
    return;
  }

  if (req.method === 'POST' && req.url === '/chat/stream') {
    const data = await readBody(req);
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const words = `Streaming mock reply to: ${data.message ?? '(empty)'}`.split(' ');
    for (const word of words) {
      res.write(`${word} `);
      await new Promise((r) => setTimeout(r, 80));
    }
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/upload') {
    await readBody(req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', file_id: `file_${Date.now()}` }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-server] listening on http://localhost:${PORT}`);
  console.log(`[mock-server] POST /chat | POST /chat/stream | POST /upload`);
});
