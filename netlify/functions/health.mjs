/* GET /api/health: which services are configured, so the browser can show honest states and tests can wait
   for the server. Never returns secret values, only whether they exist. */
export const config = { path: '/api/health' };

export function healthInfo(env = process.env) {
  const mock = env.MOCK_AI === '1' || !env.ANTHROPIC_API_KEY;
  return {
    ok: true,
    version: env.ROSTRA_VERSION || null,
    ai: mock ? 'mock' : 'live',
    transcription: env.MOCK_AI === '1' ? 'mock' : env.DEEPGRAM_API_KEY ? 'deepgram' : env.WHISPER_API_KEY ? 'whisper' : 'browser',
    accounts: env.SUPABASE_URL && env.SUPABASE_ANON_KEY ? 'supabase' : 'local',
    supabaseUrl: env.SUPABASE_URL || null,
    supabaseAnonKey: env.SUPABASE_URL ? env.SUPABASE_ANON_KEY || null : null,
    region: env.AWS_REGION || null,
  };
}

export default async () => new Response(JSON.stringify(healthInfo()), { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
