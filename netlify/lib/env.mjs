/* Server configuration, read from environment variables (set in Netlify → Project configuration → Environment
   variables, or in a local .env). Every value has a safe default so the app runs with no keys at all. */
export const env = process.env;

export const MOCK_AI = env.MOCK_AI === '1' || !env.ANTHROPIC_API_KEY;

/* Which Claude model answers which kind of request. Prices are USD per million tokens (Anthropic list, Oct 2026)
   and are only used to estimate cost in the usage log; billing is whatever Anthropic charges. */
export const MODELS = {
  quick: { id: env.ROSTRA_MODEL_QUICK || 'claude-haiku-5-5', effort: env.ROSTRA_EFFORT_QUICK || 'low', input: 0.1, output: 0.5, cacheRead: 0.01 },
  default: { id: env.ROSTRA_MODEL_DEFAULT || 'claude-sonnet-5-5', effort: env.ROSTRA_EFFORT_DEFAULT || 'low', input: 2, output: 10, cacheRead: 0.2 },
  complex: { id: env.ROSTRA_MODEL_COMPLEX || 'claude-opus-5-5', effort: env.ROSTRA_EFFORT_COMPLEX || 'low', input: 4, output: 20, cacheRead: 0.2 },
};
export const PRICES = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
  'claude-opus-4-8': { input: 5, output: 25, cacheRead: 0.5 },
};
export function priceOf(model) {
  return PRICES[model] || Object.values(MODELS).find((m) => m.id === model) || { input: 4, output: 20, cacheRead: 0.2 };
}
export function costUsd(model, usage) {
  const p = priceOf(model);
  const inTok = Number(usage?.input_tokens || 0), out = Number(usage?.output_tokens || 0), cr = Number(usage?.cache_read_input_tokens || 0), cw = Number(usage?.cache_creation_input_tokens || 0);
  return (inTok * p.input + cw * p.input * 1.25 + cr * p.cacheRead + out * p.output) / 1e6;
}

/* Per-user spending guard. A stranger with a stolen session, or a student holding the button down, hits these. */
export const LIMITS = {
  dailyCalls: Number(env.ROSTRA_DAILY_CALLS) || 150,
  dailyUsd: Number(env.ROSTRA_DAILY_USD) || 3,
  maxPromptChars: Number(env.ROSTRA_MAX_PROMPT_CHARS) || 60000,
  upstreamTimeoutMs: Number(env.ROSTRA_UPSTREAM_TIMEOUT_MS) || 50000, // Netlify kills the function at 60 s
};

export const SUPABASE = {
  url: env.SUPABASE_URL || '',
  anonKey: env.SUPABASE_ANON_KEY || '',
  serviceKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
  get configured() { return !!(this.url && this.anonKey); },
};

/* Live AI without accounts is only for Bobi's first smoke test; never leave it on for a school. */
export const ALLOW_ANON_AI = env.ALLOW_ANON_AI === '1';

export const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
export const fail = (code, message, status = 400) => json({ error: { code, message } }, status);
