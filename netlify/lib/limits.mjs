/* Per-user daily limits and the usage log. With Supabase the log lives in the `usage` table (so the cost per
   exam can be measured); without it, an in-memory map per function instance does the guarding. */
import { LIMITS, costUsd } from './env.mjs';
import { serviceDb } from './auth.mjs';

const memory = new Map(); // userId -> [{t, usd}]

async function todays(userId) {
  const since = Date.now() - 24 * 3600 * 1000;
  const db = serviceDb();
  if (db && !userId.startsWith('local:')) {
    const { data, error } = await db.from('usage').select('cost_usd').eq('user_id', userId).gte('created_at', new Date(since).toISOString());
    if (error) return { calls: 0, usd: 0 };
    return { calls: data.length, usd: data.reduce((s, r) => s + Number(r.cost_usd || 0), 0) };
  }
  const rows = (memory.get(userId) || []).filter((r) => r.t > since);
  memory.set(userId, rows);
  return { calls: rows.length, usd: rows.reduce((s, r) => s + r.usd, 0) };
}

/* Throws {code, message} when the caller is over budget. */
export async function checkBudget(user) {
  const t = await todays(user.id);
  if (t.calls >= LIMITS.dailyCalls || t.usd >= LIMITS.dailyUsd) {
    const e = new Error('Daily limit reached'); e.code = 'rate_limited'; e.status = 429; throw e;
  }
  return t;
}

export async function logUsage({ user, kind, tier, model, usage, ms, meta }) {
  const usd = costUsd(model, usage);
  const db = serviceDb();
  const row = { user_id: user.id, kind, tier, model, input_tokens: usage?.input_tokens || 0, output_tokens: usage?.output_tokens || 0, cache_read_tokens: usage?.cache_read_input_tokens || 0, cost_usd: usd, ms, doc_id: meta?.doc || null, step: meta?.step || null };
  if (db && !user.id.startsWith('local:')) {
    const { error } = await db.from('usage').insert(row);
    if (error) console.error('usage insert failed', error.message);
  } else {
    const rows = memory.get(user.id) || [];
    rows.push({ t: Date.now(), usd });
    memory.set(user.id, rows);
  }
  return usd;
}
