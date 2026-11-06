#!/usr/bin/env node
/* Local server: serves dist/ and runs the Netlify functions in-process at /api/*.
   The functions are plain web-standard handlers (Request -> Response), so no Netlify CLI is needed.
   Env: PORT (default 8788). Reads .env if present. Run: npm run dev */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { build } from './build.mjs';
import { createMockSupabase, installMockEnv } from './mock-supabase.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const DIST = path.join(ROOT, 'dist');
const FN_DIR = path.join(ROOT, 'netlify', 'functions');

/* .env loader (no dependency): KEY=value lines, # comments. Never commits. */
const envFile = path.join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

if (!existsSync(path.join(DIST, 'index.html')) || process.argv.includes('--build')) build({ quiet: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.wav': 'audio/wav', '.webm': 'audio/webm' };

const functions = new Map();
async function loadFunction(name) {
  if (!functions.has(name)) {
    const file = path.join(FN_DIR, name + '.mjs');
    if (!existsSync(file)) return null;
    functions.set(name, (await import(file + (process.env.DEV_RELOAD ? '?t=' + Date.now() : ''))).default);
  }
  return functions.get(name);
}

const port = Number(process.env.PORT) || 8788;
installMockEnv(port); // MOCK_SUPABASE=1: point the server's Supabase env at the in-memory mock below
const mock = createMockSupabase();

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/mock-supabase')) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);
      const response = await mock.handle(new Request(url, { method: req.method, headers: req.headers, body, duplex: 'half' }), '/mock-supabase');
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.split('/')[2];
      const fn = await loadFunction(name);
      if (!fn) { res.writeHead(404, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'no such function' })); return; }
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);
      const request = new Request(url, { method: req.method, headers: req.headers, body, duplex: 'half' });
      const response = await fn(request, { ip: req.socket.remoteAddress });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
      return;
    }
    let file = path.join(DIST, decodeURIComponent(url.pathname));
    if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
    if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(DIST, 'index.html'); // SPA fallback, like netlify.toml
    const ext = path.extname(file);
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
    res.end(readFileSync(file));
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: String(e && e.message || e) }));
  }
});
server.listen(port, () => console.log(`Rostra dev: http://localhost:${port}  (mode: ${process.env.ANTHROPIC_API_KEY ? 'live AI' : 'mock AI'}, ${process.env.SUPABASE_URL ? 'Supabase' : 'local-only accounts'})`));
