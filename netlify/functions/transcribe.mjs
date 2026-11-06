/* POST /api/transcribe?lang=en|bg : turns a recorded answer into text.
   Body: the audio bytes (content-type audio/webm, audio/mp4, audio/ogg or audio/wav), at most 4.5 MB.
   Providers, chosen by which key exists: Deepgram on its EU endpoint (DEEPGRAM_API_KEY), any Whisper-compatible
   API (WHISPER_API_KEY, WHISPER_API_URL, WHISPER_MODEL), or the mock. Returns {text, language, duration, words, provider}. */
import { env, fail, json, MOCK_AI } from '../lib/env.mjs';
import { identify } from '../lib/auth.mjs';
import { checkBudget, logUsage } from '../lib/limits.mjs';
import { mockTranscript } from '../lib/mock.mjs';

export const config = { path: '/api/transcribe' };

const MAX_BYTES = 4.5 * 1024 * 1024;

export function transcriptionProvider(e = env) {
  if (e.MOCK_AI === '1') return 'mock';
  if (e.DEEPGRAM_API_KEY) return 'deepgram';
  if (e.WHISPER_API_KEY) return 'whisper';
  return MOCK_AI ? 'mock' : 'none';
}

async function deepgram(bytes, mime, lang) {
  const base = env.DEEPGRAM_API_URL || 'https://api.eu.deepgram.com';
  const q = new URLSearchParams({ model: env.DEEPGRAM_MODEL || 'nova-3', language: lang, smart_format: 'true', punctuate: 'true', filler_words: 'true' });
  const r = await fetch(`${base}/v1/listen?${q}`, { method: 'POST', headers: { authorization: `Token ${env.DEEPGRAM_API_KEY}`, 'content-type': mime }, body: bytes });
  if (!r.ok) { const e = new Error(`Deepgram ${r.status}: ${(await r.text()).slice(0, 200)}`); e.code = 'upstream'; throw e; }
  const j = await r.json();
  const alt = j.results?.channels?.[0]?.alternatives?.[0] || {};
  return { text: alt.transcript || '', language: j.results?.channels?.[0]?.detected_language || lang, duration: Number(j.metadata?.duration || 0), words: (alt.words || []).map((w) => ({ word: w.punctuated_word || w.word, start: w.start, end: w.end })), provider: 'deepgram' };
}

async function whisper(bytes, mime, lang) {
  const url = env.WHISPER_API_URL || 'https://api.openai.com/v1/audio/transcriptions';
  const fd = new FormData();
  fd.append('file', new Blob([bytes], { type: mime }), 'answer.' + (mime.includes('mp4') ? 'mp4' : mime.includes('wav') ? 'wav' : 'webm'));
  fd.append('model', env.WHISPER_MODEL || 'whisper-1');
  fd.append('language', lang);
  fd.append('response_format', 'verbose_json');
  const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${env.WHISPER_API_KEY}` }, body: fd });
  if (!r.ok) { const e = new Error(`Transcription ${r.status}: ${(await r.text()).slice(0, 200)}`); e.code = 'upstream'; throw e; }
  const j = await r.json();
  return { text: j.text || '', language: j.language || lang, duration: Number(j.duration || 0), words: (j.words || []).map((w) => ({ word: w.word, start: w.start, end: w.end })), provider: 'whisper' };
}

export default async (req, context) => {
  if (req.method !== 'POST') return fail('method', 'POST only', 405);
  const user = await identify(req, context);
  if (!user) return fail('not_granted', 'Sign in to use the microphone.', 401);
  const url = new URL(req.url);
  const lang = (url.searchParams.get('lang') || 'en').toLowerCase().startsWith('bg') ? 'bg' : 'en';
  const mime = (req.headers.get('content-type') || 'audio/webm').split(';')[0];
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length > MAX_BYTES) return fail('too_large', 'That recording is too long to send in one piece. Keep answers under about four minutes.', 413);
  if (bytes.length < 200 && transcriptionProvider() !== 'mock') return fail('empty', 'No audio was recorded. Check the microphone and try again.', 400);
  try { await checkBudget(user); } catch (e) { return fail('rate_limited', 'You have reached today’s limit. It resets tomorrow.', 429); }
  const provider = transcriptionProvider();
  const t0 = Date.now();
  try {
    let out;
    if (provider === 'mock') {
      const forced = req.headers.get('x-mock-transcript');
      out = mockTranscript(lang, Math.max(5, Math.round(bytes.length / 4000)));
      if (forced != null) { out.text = forced; out.words = forced.split(/\s+/).filter(Boolean).map((w, i, a) => ({ word: w, start: (i * out.duration) / a.length, end: ((i + 1) * out.duration) / a.length })); }
    } else if (provider === 'deepgram') out = await deepgram(bytes, mime, lang);
    else if (provider === 'whisper') out = await whisper(bytes, mime, lang);
    else return fail('unavailable', 'No transcription service is configured on the server.', 503);
    const minutes = (out.duration || bytes.length / 16000) / 60;
    await logUsage({ user, kind: 'transcribe', tier: provider, model: provider, usage: { input_tokens: 0, output_tokens: 0 }, ms: Date.now() - t0, meta: { step: 'transcribe', doc: url.searchParams.get('doc') || null } });
    return json({ ...out, minutes: Number(minutes.toFixed(2)), mock: provider === 'mock' });
  } catch (e) {
    return fail(e.code || 'upstream', e.code === 'upstream' ? 'The transcription service did not answer. You can type your answer instead.' : (e.message || 'Transcription failed'), 502);
  }
};
