#!/usr/bin/env node
/* Estimate the AI cost of one full oral exam, from the real prompts the app builds.
   Loads the app in the headless harness, plays a realistic Standard exam (5 questions, one follow-up each, 60-second
   spoken answers), builds every prompt the app would send (plan, 10 marks, report) and prices the tokens.
   Tokens are estimated at 3.8 characters per token (Claude's tokenizer averages 3.5–4.2 on English prose; Bulgarian
   is costlier, about 2.2–2.8 characters per token, shown separately). Output tokens follow the JSON shapes asked for.
   The real figure appears in the `usage` table once a key is set; see scripts/cost-report.mjs.
   Run: node scripts/cost-estimate.mjs */
import { makeContext } from '../tests/unit/harness.mjs';

const ctx = makeContext();
const V = (name) => ctx[name];
const PRICES = { 'claude-opus-5-5': [4, 20], 'claude-sonnet-5-5': [2, 10], 'claude-haiku-5-5': [0.1, 0.5] };
const ANSWER = 'The French Revolution began in 1789 because the monarchy was bankrupt after decades of war and the American campaign, because two failed harvests pushed bread prices to most of a worker’s wage, and because the Third Estate, which paid most of the tax, had no voice in how it was spent. For example, when the Estates-General met for the first time since 1614, the deputies demanded voting by head instead of by order, and when the king refused they declared themselves the National Assembly. So the deeper cause was a fiscal crisis meeting a political system that could not adapt.';

const plan = V('vivaFallbackPlan')({ format: 'standard', persona: 'socratic', subject: 'The French Revolution', topic: 'Causes; the Estates-General; the Terror', level: 'school' }).questions;
const doc = V('vivaNewDoc')({ subject: 'The French Revolution', topic: 'Causes; the Estates-General; the Terror', level: 'school', format: 'standard', persona: 'socratic', status: 'live', source: 'ai', mode: 'speak', plan, material: '' });
const turns = [];
const mk = (qi, kind, fType) => Object.assign(V('vivaMakeTurn')({ qi, kind, fType, q: kind === 'main' ? plan[qi].q : 'Why does that follow? Take it one level deeper.', examiner: 'elenchos' }), { answered: true, answer: ANSWER, spoken: true, answerSec: 60, thinkSec: 15, delivery: { durationSec: 60, words: 95, wpm: 95, pausesLong: 1, fillers: 2 } });
const evalOf = () => ({ scores: { accuracy: 70, depth: 60, reasoning: 65, communication: 70 }, covered: ['a'], missing: ['b'], misconception: '', notes: 'Right outline, thin on why.', reaction: 'Noted.', next: { action: 'move_on' } });

const calls = [];
const chars = (s) => s.length;
calls.push({ step: 'plan', tier: 'complex', inChars: chars(V('vivaPlanPrompt')(doc)), outTokens: 900 });
for (let qi = 0; qi < 5; qi++) {
  for (const kind of ['main', 'follow']) {
    const t = mk(qi, kind, kind === 'follow' ? 'probe' : null);
    turns.push(t);
    doc.turns = turns;
    const prompt = V('vivaEvalPrompt')(doc, turns.length - 1);
    calls.push({ step: `mark q${qi + 1} ${kind}`, tier: 'complex', inChars: chars(prompt), outTokens: 320 });
    t.eval = evalOf();
  }
}
calls.push({ step: 'report', tier: 'complex', inChars: chars(V('vivaReportPrompt')(doc)), outTokens: 1400 });
calls.push({ step: 'help (optional, x1)', tier: 'default', inChars: chars(V('vivaHelpPrompt')(doc, turns[0], '')), outTokens: 80 });

const MODELS = { complex: process.env.ROSTRA_MODEL_COMPLEX || 'claude-opus-5-5', default: process.env.ROSTRA_MODEL_DEFAULT || 'claude-sonnet-5-5', quick: process.env.ROSTRA_MODEL_QUICK || 'claude-haiku-5-5' };
function price(cpt, thinkingFactor) {
  let inTok = 0, outTok = 0, usd = 0;
  for (const c of calls) {
    const m = MODELS[c.tier]; const [pi, po] = PRICES[m];
    const i = Math.round(c.inChars / cpt), o = Math.round(c.outTokens * thinkingFactor);
    inTok += i; outTok += o; usd += (i * pi + o * po) / 1e6;
  }
  return { inTok, outTok, usd };
}
console.log(`One Standard oral exam: ${calls.length} AI calls (1 plan, 10 marks, 1 report, 1 help).`);
console.log('Prompt sizes (characters):', calls.map((c) => `${c.step} ${c.inChars}`).join(' · '));
for (const [label, cpt, tf] of [['English, no visible thinking overhead', 3.8, 1], ['English, low-effort thinking (~1.5x output)', 3.8, 1.5], ['Bulgarian, low-effort thinking', 2.5, 1.5]]) {
  const r = price(cpt, tf);
  console.log(`${label}: ~${r.inTok.toLocaleString()} input + ~${r.outTok.toLocaleString()} output tokens → $${r.usd.toFixed(3)} (≈ €${(r.usd * 0.92).toFixed(2)}) with ${MODELS.complex} for marking`);
}
const alt = { ...MODELS, complex: 'claude-sonnet-5-5' };
{
  const saved = MODELS.complex; MODELS.complex = 'claude-sonnet-5-5';
  const r = price(3.8, 1.5);
  console.log(`Same exam with Sonnet 5.5 for marking: $${r.usd.toFixed(3)} (≈ €${(r.usd * 0.92).toFixed(2)})`);
  MODELS.complex = saved;
}
console.log('Transcription (Deepgram Nova-3, ~$0.0045/min): 10 answers × 1 min ≈ $0.045 (≈ €0.04) per exam; browser recognition is free.');
