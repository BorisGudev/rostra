#!/usr/bin/env node
/* Measured AI cost from the `usage` table (needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or the env).
   Prints cost per user, per kind, and per oral exam (every call carries the exam's document id).
   Run: node scripts/cost-report.mjs [days=30] */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';

if (existsSync('.env')) for (const line of readFileSync('.env', 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.log('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example). Nothing measured yet.'); process.exit(0); }
const days = Number(process.argv[2]) || 30;
const sb = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await sb.from('usage').select('*').gte('created_at', new Date(Date.now() - days * 86400e3).toISOString());
if (error) { console.error(error.message); process.exit(1); }
const sum = (rows, f) => rows.reduce((s, r) => s + Number(f(r) || 0), 0);
const by = (rows, k) => { const m = new Map(); rows.forEach((r) => { const key = k(r) || '(none)'; m.set(key, [...(m.get(key) || []), r]); }); return m; };
console.log(`${data.length} calls in the last ${days} days, $${sum(data, (r) => r.cost_usd).toFixed(2)} total.`);
console.log('\nBy kind:');
for (const [k, rows] of by(data, (r) => r.kind + ' / ' + (r.model || ''))) console.log(`  ${k.padEnd(32)} ${String(rows.length).padStart(5)} calls  $${sum(rows, (r) => r.cost_usd).toFixed(3)}  (${sum(rows, (r) => r.input_tokens).toLocaleString()} in / ${sum(rows, (r) => r.output_tokens).toLocaleString()} out tokens)`);
const exams = [...by(data.filter((r) => r.doc_id && String(r.doc_id).startsWith('v_')), (r) => r.doc_id)];
if (exams.length) {
  const costs = exams.map(([, rows]) => sum(rows, (r) => r.cost_usd)).sort((a, b) => a - b);
  console.log(`\nOral exams: ${exams.length}; cost per exam median $${costs[Math.floor(costs.length / 2)].toFixed(3)}, mean $${(costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(3)}, max $${costs[costs.length - 1].toFixed(3)}`);
}
console.log('\nBy user (top 10):');
[...by(data, (r) => r.user_id)].map(([u, rows]) => [u, sum(rows, (r) => r.cost_usd), rows.length]).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([u, c, n]) => console.log(`  ${u}  $${c.toFixed(3)}  ${n} calls`));
