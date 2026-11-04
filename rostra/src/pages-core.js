/* ================================================================
   Pages: Home, Analyze, Report
   ================================================================ */

const KIND_META = {
  strength: { label: 'Strength', color: 'var(--gold)' },
  device: { label: 'Device', color: 'var(--ethos)' },
  fallacy: { label: 'Fallacy', color: 'var(--bad)' },
  inconsistency: { label: 'Inconsistency', color: 'var(--violet)' },
  vague: { label: 'Unsupported', color: 'var(--warn)' },
  weak: { label: 'Weak spot', color: 'var(--warn)' },
  filler: { label: 'Filler', color: 'var(--warn)' },
  ethos: { label: 'Ethos', color: 'var(--ethos)' },
  pathos: { label: 'Pathos', color: 'var(--pathos)' },
  logos: { label: 'Logos', color: 'var(--logos)' },
};
const VERDICT_COLOR = { strong: 'var(--logos)', solid: 'var(--ethos)', weak: 'var(--warn)', missing: 'var(--bad)' };
const Celebrate = { pending: null };

/* What the Analyze button will pay, in words. Mirrors the XP rule in runSpeechAnalysis. */
function analyzeXpHint(words, hasFile, hasSpeeches, aiReady) {
  const coach = aiReady && words >= 30 ? 20 : 0;
  const xp = (hasFile ? 100 : Math.round(100 * clamp(words / 150, 0.25, 1))) + coach;
  const short = !hasFile && words < 150;
  return `+${xp} XP${short ? ` at this length, +${100 + coach} from 150 words` : ''}${hasSpeeches ? ', more if you beat your last scores' : ''}. The same speech again earns 0.`;
}
/* One card per kind of problem: identical word-pattern flags collapse into one card that lists every quote. */
function groupFlags(flags, transcript) {
  const groups = new Map();
  (flags || []).forEach((f) => {
    const key = (f.label || f.kind) + '|' + (f.note || '');
    if (!groups.has(key)) groups.set(key, { ...f, quotes: [], count: 0 });
    const g = groups.get(key);
    g.count += 1;
    const q = f.quote || (transcript && f.start != null && f.end != null ? transcript.slice(f.start, f.end).trim() : '');
    if (q && !g.quotes.some((x) => x.toLowerCase() === q.toLowerCase())) g.quotes.push(q);
  });
  return [...groups.values()];
}
/* The report's next step: a lesson first, then another pass at the same text, then the Gym */
function reportNextSteps(sp, lessonsHere, p) {
  if (sp.sample) return [{ label: 'Analyze my first speech', icon: 'mic', to: ['analyze'] }, { label: 'Practice out loud in the Gym', icon: 'dumbbell', to: ['gym', 'impromptu'] }];
  const steps = [];
  const here = (lessonsHere || []).find((l) => !lessonDone(p, l.id));
  const lesson = here ? null : nextLesson(p);
  if (here) steps.push({ label: `Start lesson: ${here.title} · +40 XP`, icon: 'book', to: ['lesson', here.id] });
  else if (lesson) steps.push({ label: `Train ${(POLES[lesson.pole] || POLES.logos).name}: ${lesson.title}`, icon: 'book', to: ['lesson', lesson.id] });
  if (sp.transcript) steps.push({ label: 'Edit and analyze again', icon: 'refresh', to: ['analyze', { text: sp.transcript, title: sp.title, occasion: sp.occasion }] });
  steps.push({ label: 'Rehearse it in the Gym', icon: 'dumbbell', to: ['gym', 'impromptu'] });
  return steps;
}

function greeting() { const h = new Date().getHours(); return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
function PoleChip({ pole }) { return pole && POLES[pole] ? html`<span className=${'chip chip-sm chip-' + pole}>${POLES[pole].name}</span>` : null; }

/* ---------- Home ---------- */
function Onboarding() {
  const { profile } = useStore();
  const [name, setName] = useState(profile.name || '');
  const [goal, setGoal] = useState(profile.goal || '');
  const begin = (e) => {
    e.preventDefault();
    Store.act((p, ctx) => { p.name = name.trim().slice(0, 40); p.goal = goal || 'presentation'; p.onboarded = true; ctx.xp(20, 'Took the stage'); });
    celebrate({ count: 90 });
    go(goal === 'exam' ? 'viva' : 'analyze');
  };
  return html`<form className="card onboard" onSubmit=${begin} aria-labelledby="ob-title">
    <div className="stack" style=${{ gap: 12 }}>
      <div className="eyebrow">Your first step</div>
      <h2 id="ob-title" className="onboard-title">Step up to the speaker’s platform.</h2>
      <p className="lead">Upload a speech and get coached on all three of Aristotle’s appeals. Prepare new ones with a coach that asks before it tells. Rehearse oral exams with an examiner who follows up. Earn your laurels.</p>
      <p className="fact">The Rostra was the speakers’ platform in the Roman Forum, named for the bronze ship prows (<i>rostra</i>) mounted on its front. Cicero spoke from it.</p>
    </div>
    <div className="stack" style=${{ gap: 14 }}>
      <div className="field"><label htmlFor="ob-name">What should your coach call you?</label><input id="ob-name" className="input" value=${name} onInput=${(e) => setName(e.target.value)} placeholder="Your first name" autoComplete="given-name" /></div>
      <div className="field"><span className="label">What do you mostly speak for?</span>
        <div className="row" style=${{ gap: 6 }}>${OCCASIONS.map((o) => html`<button type="button" key=${o.id} className="chip" aria-pressed=${goal === o.id} onClick=${() => setGoal(o.id)}>${o.label}</button>`)}</div>
      </div>
      <button className="btn-cta" type="submit">Start · +20 XP</button>
    </div>
  </form>`;
}

function PolePanel({ sel, setSel, scores, profile, example }) {
  if (!sel) {
    return html`<div className="stack" style=${{ gap: 4 }}>
      ${POLE_KEYS.map((k) => html`<button key=${k} type="button" className="pole-row" onClick=${() => setSel(k)}>
        <span className="pole-ic" style=${{ background: POLES[k].soft, color: POLES[k].color }}><${Icon} name=${POLES[k].icon} /></span>
        <span style=${{ minWidth: 0 }}><span className="row" style=${{ gap: 8 }}><b>${POLES[k].name}</b><span className="greek small">${POLES[k].greek}</span></span><${TierMedal} score=${scores[k]} /></span>
        <span className="pole-score">${scores[k] == null ? '–' : scores[k]}</span>
      </button>`)}
      <p className="hint" style=${{ padding: '4px 12px' }}>Tap a corner of the triangle or a row to see what drives it.</p>
    </div>`;
  }
  const P = POLES[sel];
  const subs = example ? SAMPLE_AI.subscores[sel] : profile.subs[sel];
  const trail = example ? SAMPLE_PROFILE.trail : profile.trail;
  const series = trail.map((t) => ({ ethos: t.e, pathos: t.p, logos: t.l })[sel]).filter((v) => v != null);
  return html`<div className="stack" style=${{ gap: 12 }}>
    <div className="row-between">
      <div className="row"><span className="pole-ic" style=${{ background: P.soft, color: P.color }}><${Icon} name=${P.icon} /></span>
        <div><div className="row" style=${{ gap: 8 }}><span className="inscr" style=${{ color: P.color }}>${P.name}</span><span className="greek" lang="grc">${P.greek}</span><${TierMedal} score=${scores[sel]} /></div><div className="small muted">${P.ask}</div></div></div>
      <button className="btn btn-ghost btn-sm btn-icon" onClick=${() => setSel(null)} aria-label="Show all three appeals"><${Icon} name="x" size=${18} /></button>
    </div>
    <p className="small" style=${{ color: 'var(--ink-2)' }}>${P.desc}</p>
    ${subs ? Object.entries(P.subs).map(([sk, label]) => html`<div className="sub-row" key=${sk}><span>${label} <span className="greek" lang="grc">${P.subsGreek[sk]}</span></span><b className="num" style=${{ textAlign: 'right' }}>${subs[sk] == null ? '–' : subs[sk]}</b><${Bar} value=${subs[sk]} color=${P.color} /></div>`)
      : html`<p className="hint">Your next analysis with a transcript fills in the sub-skills behind this score.</p>`}
    ${series.length > 1 ? html`<div><div className="row-between small muted" style=${{ marginBottom: 2 }}><span>Trend across ${series.length} speeches</span><b className="num" style=${{ color: P.color }}>${series[0]} → ${series[series.length - 1]}</b></div><${Sparkline} values=${series} color=${P.color} /></div>` : null}
    <button className="btn btn-sm" style=${{ justifySelf: 'start' }} onClick=${() => go('learn', sel)}>Train ${P.name}<${Icon} name="arrowR" size=${16} /></button>
  </div>`;
}

function QuestsCard() {
  const { profile: p, preps, vivas } = useStore();
  const q = todayQuests(p);
  const picks = q.picks;
  const doneCount = picks.filter((k) => q.claimed[k]).length;
  return html`<div className="card quests-card" id="home-quests">
    <div className="card-head" style=${{ marginBottom: 4 }}><div><div className="eyebrow">Daily quests <span className="greek" lang="grc">ἆθλα</span></div><h3>Today’s laurels</h3></div><span className="chip chip-sm"><${Icon} name="clock" size=${14} />Resets at midnight</span></div>
    ${picks.map((key) => {
      const Q = QUESTS[key];
      if (!Q) return null;
      const prog = q.progress[key] || 0; const done = q.claimed[key];
      return html`<button key=${key} type="button" className=${'quest' + (done ? ' done' : '')} onClick=${() => go(...questGo(key, p, { preps, vivas }))}>
        <span className="quest-ic"><${Icon} name=${done ? 'check' : Q.icon} size=${19} /></span>
        <span style=${{ minWidth: 0 }}><span className="quest-title">${Q.label}</span><span className="quest-bar"><${MeanderBar} value=${(prog / Q.target) * 100} height=${10} label=${`${Q.label}: ${prog} of ${Q.target}`} /></span></span>
        <span className="quest-xp">${done ? 'Done' : `+${Q.xp} XP`}</span>
      </button>`;
    })}
    <div className=${'chest' + (q.chest ? ' open' : '')}><span className="chest-ic"><${Icon} name="gift" size=${20} /></span><span>${q.chest ? (typeof q.chest === 'number' ? `Laurel chest opened: +${q.chest} XP` : 'Laurel chest opened') : `${doneCount} of ${picks.length} done. Finish all three to open the laurel chest: ${CHEST_XP} to 250 XP`}</span></div>
  </div>`;
}
function StreakCard() {
  const { profile: p } = useStore();
  const live = liveStreak(p);
  const today = dayKey();
  const days = [-6, -5, -4, -3, -2, -1, 0].map((n) => addDays(today, n));
  const active = new Set(p.streak.days || []);
  const doneToday = p.streak.last === today;
  const tomorrow = doneToday ? QUESTS[pickQuests(addDays(today, 1), p)[0]] : null;
  const streakHint = doneToday ? 'Today counts.' + (tomorrow ? ` Tomorrow’s first quest: ${tomorrow.label}.` : ' Come back tomorrow to keep the flame alive.')
    : live ? 'Earn any XP today to keep your streak.'
      : p.streak.best > 1 ? `Your ${p.streak.best}-day streak ended. Earn any XP today to start a new one.`
        : 'Earn any XP today to light your first flame.';
  return html`<div className=${'card streak-card' + (live ? ' is-live' : '')}>
    <div className="row-between" style=${{ flexWrap: 'nowrap' }}>
      <div><div className="eyebrow">Streak <span className="greek" lang="grc">συνέχεια</span></div><div className="row" style=${{ gap: 8, alignItems: 'baseline' }}><span className="big-num">${live}</span><span className="muted">${live === 1 ? 'day' : 'days'} · best ${p.streak.best || 0}</span></div></div>
      <span className="streak-flame" aria-hidden="true"><${Icon} name="flame" size=${40} /></span>
    </div>
    <div className="week" style=${{ marginTop: 14 }}>
      ${days.map((d) => html`<div key=${d} className=${'day' + (active.has(d) ? ' on' : '') + (d === today ? ' today' : '')}><i>${active.has(d) ? html`<${Icon} name="check" size=${14} stroke=${3} />` : null}</i>${new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })}</div>`)}
    </div>
    <p className="hint" style=${{ marginTop: 12 }}>${streakHint}</p>
  </div>`;
}
function LevelCard() {
  const { profile: p } = useStore();
  const li = levelInfo(p.xp);
  const nextTitle = levelInfo(li.next).title;
  const near = closestBadge(p);
  return html`<button type="button" className="card level-card" onClick=${() => go('trophies')}>
    <div className="row-between" style=${{ flexWrap: 'nowrap' }}><div style=${{ minWidth: 0 }}><div className="eyebrow">Level ${li.level}</div><div className="arch-name level-title">${li.title}</div><div className="greek level-greek" lang="grc">${li.greek}</div></div><${LevelBadge} level=${li.level} size=${62} /></div>
    <${MeanderBar} value=${li.progress * 100} height=${14} label="Progress to the next level" />
    <div className="row-between small muted num"><span>${li.into.toLocaleString()} / ${li.need.toLocaleString()} XP</span><span>${nextTitle} next</span></div>
    ${near ? html`<div className="small muted">Closest badge: <b>${near.badge.name}</b>, ${near.value} of ${near.max}</div>` : null}
  </button>`;
}
function nextLesson(p) {
  const custom = (p.lessons || []).find((l) => !lessonDone(p, l.id));
  if (custom) return custom;
  const weak = weakestPole(p.skills) || 'logos';
  return LESSONS.find((l) => l.pole === weak && !lessonDone(p, l.id)) || LESSONS.find((l) => !lessonDone(p, l.id)) || null;
}
/* Countable badges, for the "closest badge" line. The thresholds mirror BADGE_RULES. */
const BADGE_COUNTS = {
  kindling: (p) => [p.streak.best, 3], eternal_flame: (p) => [p.streak.best, 7], fortnight: (p) => [p.streak.best, 14], perennial: (p) => [p.streak.best, 30],
  scholar: (p) => [p.stats.lessons, 5], historian: (p) => [(p.stats.read || []).length, 5],
  fallacy_hunter: (p) => [p.stats.fallacies, 25], wordsmith: (p) => [p.stats.devices, 25], unbroken: (p) => [p.stats.bestCombo, 10],
  improviser: (p) => [p.stats.impromptus, 5], zen: (p) => [p.stats.breaths, 10],
};
function closestBadge(p) {
  let best = null;
  BADGES.forEach((badge) => {
    const count = BADGE_COUNTS[badge.id];
    if (!count || p.badges[badge.id]) return;
    const [raw, max] = count(p);
    const value = Number(raw) || 0;
    if (value > 0 && value < max && (!best || value / max > best.value / best.max)) best = { badge, value, max };
  });
  return best;
}
/* Today's quests, or a preview of them if nothing has refreshed the sheet yet today */
function todayQuests(p) {
  const q = p.quests;
  if (q.day === dayKey()) return { picks: q.picks, claimed: q.claimed || {}, progress: q.progress || {}, chest: q.chest };
  return { picks: pickQuests(dayKey(), p), claimed: {}, progress: {}, chest: false };
}
/* Where a quest should take you: the thing itself when there is one, the list otherwise */
function questGo(key, p, st) {
  const fallback = (QUESTS[key] && QUESTS[key].go) || ['home'];
  const s = st || Store.state;
  const exams = (s.vivas || []).filter((v) => v && v.id);
  if (key === 'lesson' || key === 'drill') { const l = nextLesson(p); return l ? ['lesson', l.id] : fallback; }
  if (key === 'viva') { const open = exams.find((v) => v.status !== 'done'); return open ? ['viva', open.id] : fallback; }
  if (key === 'forge') { const draft = (s.preps || []).find((x) => !x.done); return draft ? ['prepare', draft.id] : fallback; }
  if (key === 'read') { const read = p.stats.read || []; const s2 = LIBRARY.find((x) => !read.includes(x.id)); return s2 ? ['speech', s2.id] : fallback; }
  if (key === 'revise') { const last = exams.find((v) => v.status === 'done' && v.report && (v.report.cards || []).length); return last ? ['viva', last.id + ':revise'] : fallback; }
  return fallback;
}
function clipLabel(s, n = 36) { const t = String(s || ''); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; }
/* The one thing Home should push you toward right now */
function homePrimary(p, preps, vivas) {
  const exams = (vivas || []).filter((v) => v && v.id);
  const live = exams.find((v) => v.status === 'live');
  if (live) return { id: 'viva', label: 'Resume your exam: ' + clipLabel(typeof live.subject === 'string' && live.subject ? live.subject : 'oral exam'), icon: 'scroll', to: ['viva', live.id] };
  const draft = (preps || []).find((x) => !x.done);
  if (draft) return { id: 'prepare', label: 'Continue: ' + clipLabel((draft.brief && draft.brief.title) || 'your draft'), icon: 'pen', to: ['prepare', draft.id] };
  if (p.goal === 'exam') { const open = exams.find((v) => v.status !== 'done'); return { id: 'viva', label: 'Take an oral exam', icon: 'scroll', to: open ? ['viva', open.id] : ['viva'] }; }
  const t = todayQuests(p);
  const next = t.picks.find((k) => QUESTS[k] && !t.claimed[k]);
  if (next) {
    const Q = QUESTS[next];
    const to = questGo(next, p, { preps, vivas });
    return { id: to[0], label: Q.label + (Q.target > 1 ? ` · ${t.progress[next] || 0} of ${Q.target}` : ''), icon: Q.icon, to };
  }
  return { id: 'analyze', label: 'Analyze a speech', icon: 'mic', to: ['analyze'] };
}
/* The daily loop in one tappable line, right under the hero */
function TodayStrip({ p, preps, vivas }) {
  const t = todayQuests(p);
  const picks = t.picks.filter((k) => QUESTS[k]);
  const done = picks.filter((k) => t.claimed[k]).length;
  const next = picks.find((k) => !t.claimed[k]);
  const live = liveStreak(p);
  const open = () => {
    if (next) { go(...questGo(next, p, { preps, vivas })); return; }
    const el = document.getElementById('home-quests');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' });
  };
  return html`<button type="button" className="today-strip" onClick=${open}>
    <${Icon} name="flame" size=${18} className=${live ? 'today-flame' : ''} />
    <span>${done} of ${picks.length} quests${live ? ` · ${live}-day streak` : ''}${next ? ` · Next: ${QUESTS[next].label}` : ' · All done for today'}</span>
    <${Icon} name="chevR" size=${16} />
  </button>`;
}

/* The stoa: the home hero. Three lights, one voice, and your triangle standing in them. */
function splitLabel(label) { const i = String(label).indexOf(': '); return i > 0 ? [label.slice(0, i), label.slice(i + 2)] : [label, '']; }
function splitThe(name) { const m = /^The (.+)$/.exec(name || ''); return m ? ['The', m[1]] : [null, name || '']; }
const UNLIT_STAGE = { ethos: 30, pathos: 30, logos: 30 }; // a dim house before your first speech
const HOME_ACTIONS = [
  { id: 'analyze', label: 'Analyze a speech', icon: 'mic', to: ['analyze'] },
  { id: 'prepare', label: 'Prepare a speech', icon: 'pen', to: ['prepare'] },
  { id: 'viva', label: 'Take an oral exam', icon: 'scroll', to: ['viva'] },
  { id: 'gym', label: 'Warm up in the Gym', icon: 'dumbbell', to: ['gym'] },
];
function homeActions(p, preps, vivas, example) {
  const examGoal = p.goal === 'exam';
  const fresh = example && !(vivas || []).some((v) => v && v.id) && !(preps || []).some((x) => !x.done);
  if (fresh) {
    const first = { id: 'analyze', label: 'Analyze my first speech', icon: 'mic', to: ['analyze'] };
    const sample = { id: 'sample', label: 'See a sample report', icon: 'file', to: ['report', 'sample'] };
    return examGoal ? [{ id: 'viva', label: 'Take an oral exam', icon: 'scroll', to: ['viva'] }, first, sample] : [first, sample];
  }
  const primary = homePrimary(p, preps, vivas);
  const rest = HOME_ACTIONS.filter((a) => a.id !== primary.id);
  return [primary, ...(examGoal ? rest.sort((a, b) => (b.id === 'viva') - (a.id === 'viva')) : rest)];
}
function HomeStage({ scores, example, trail, ghost, triLine, onPoster }) {
  const { profile: p, preps, vivas } = useStore();
  const [mode, setMode] = useState('now');
  const [sel, setSel] = useState(null);
  const sc = example ? UNLIT_STAGE : scores || {};
  const arch = archetypeOf(sc);
  const [the, rest] = splitThe(arch.name);
  const greet = p.onboarded ? greeting() + (p.name ? ', ' + p.name : '') + '.' : 'Welcome to the Rostra.';
  const examGoal = p.goal === 'exam';
  const line = !example ? arch.blurb : examGoal ? 'Pick a subject and answer the questions one by one. You get a grade and a list of what to revise.' : 'Paste a speech or upload a recording. In about a minute you see how it scores on trust, emotion and logic.';
  const canPoster = p.stats.speeches > 0 || p.stats.vivas > 0;
  const actions = homeActions(p, preps, vivas, example).slice(0, 3);
  return html`<section className="home-stage" aria-labelledby="hs-title">
    <${Stoa} scores=${sc} selected=${sel}>
      <div className=${'hs' + (sel ? ' has-sel' : '')}>
        <div className="hs-top">
          <p className="hs-greet">${greet}</p>
          <span className="hs-tools">
            ${example ? html`<span className="chip chip-sm chip-example">Example data</span>` : null}
            <span className="seg" role="group" aria-label="Triangle view"><button aria-pressed=${mode === 'now'} onClick=${() => setMode('now')}>Now</button><button aria-pressed=${mode === 'journey'} onClick=${() => setMode('journey')}>Journey</button></span>
            ${canPoster ? html`<button type="button" className="btn btn-sm btn-icon hs-poster" onClick=${onPoster} aria-label="Make my poster" title="Make my poster"><${Icon} name="image" size=${15} /></button>` : null}
          </span>
        </div>
        <div className="hs-copy">
          ${example ? html`<h1 id="hs-title" className="hs-arch hs-arch-first">${examGoal ? 'Get ready for your oral exam.' : 'Find your three lights.'}</h1>`
            : html`<${Fragment}>${arch.greek ? html`<p className="hs-greek" lang="grc">${arch.greek}</p>` : null}<h1 id="hs-title" className="hs-arch">${the ? html`<span className="sr-only">${the} </span>` : null}${rest}</h1><//>`}
          <${Scholion} fig=${example ? null : arch.fig} mark=${arch.mark} className="hs-blurb">${line}<//>
        </div>
        <div className="hs-tri">
          <${StoaScene} className="stoa-scene-narrow" scores=${sc} selected=${sel} from=${0.03} to=${0.97} steps=${42} />
          <${Triangle} scores=${scores} ghost=${mode === 'now' ? ghost : null} trail=${trail} mode=${mode} selected=${sel} onSelect=${setSel} />
        </div>
        ${sel ? html`<div className="hs-detail"><${PolePanel} sel=${sel} setSel=${setSel} scores=${scores} profile=${p} example=${example} /></div>` : null}
        <div className="hs-actions">
          ${actions.map((a, i) => { const [main, rest] = splitLabel(a.label); return html`<button key=${a.id + i} type="button" className=${i ? 'btn hs-gym' : 'btn-cta hs-cta'} onClick=${() => go(...a.to)}><${Icon} name=${a.icon} size=${18} /><span className="hs-cta-text"><span>${main}</span>${!i && rest ? html`<small>${rest}</small>` : null}</span></button>`; })}
        </div>
        <p className="hs-note">${mode === 'journey' ? 'Each dot is one speech’s center of gravity, oldest to newest.' : html`${triLine}${ghost ? ` Dashed: ${example ? 'where this speaker started' : 'your first speech'}. Dot: ${example ? 'their' : 'your'} center of gravity.` : ''}${sel ? '' : ' Tap a corner for detail.'}`}</p>
      </div>
    <//>
  </section>`;
}

/* Oral exams on the home page */
const EXAM_STATUS = { setup: 'Ready to start', live: 'In progress', done: 'Graded' };
function examPercent(v) {
  const n = v && v.report ? Number(v.report.percent) : NaN;
  return isFinite(n) ? Math.round(clamp(n, 0, 100)) : null;
}
function ExamRow({ v }) {
  const pct = examPercent(v);
  const done = v.status === 'done';
  const grade = v.report && typeof v.report.grade === 'string' ? v.report.grade.slice(0, 18) : '';
  const meta = [typeof v.topic === 'string' ? v.topic : '', EXAM_STATUS[v.status] || 'Draft', v.updated ? fmtDate(v.updated) : ''].filter(Boolean).join(' · ');
  return html`<button type="button" className="list-item exam-row" onClick=${() => go('viva', v.id)}>
    <span className=${'exam-seal' + (done ? ' is-done' : v.status === 'live' ? ' is-live' : '')}>${done && pct != null ? html`<b className="num">${pct}<small>%</small></b>` : html`<${Icon} name="scroll" size=${20} />`}</span>
    <span style=${{ minWidth: 0 }}><span className="li-title" style=${{ display: 'block' }}>${typeof v.subject === 'string' && v.subject ? v.subject : 'Oral exam'}</span><span className="small muted exam-meta">${meta}</span></span>
    <span className="exam-end">${done
      ? (grade ? html`<span className=${'chip chip-sm' + (pct != null && pct >= 85 ? ' chip-good' : '')}>${grade}</span>` : null)
      : html`<span className="chip chip-sm">${v.status === 'live' ? 'Resume' : 'Start'}<${Icon} name="chevR" size=${13} /></span>`}</span>
  </button>`;
}
function ExamEmpty() {
  return html`<div className="exam-empty">
    <span className="exam-seal" aria-hidden="true"><${Icon} name="scroll" size=${20} /></span>
    <div className="stack" style=${{ gap: 6 }}>
      <b>No oral exams yet</b>
      <span className="small muted">Pick a subject. An examiner asks, you answer, and every thin answer gets a follow-up. You get a grade at the end.</span>
      <button type="button" className="btn btn-sm" style=${{ justifySelf: 'start' }} onClick=${() => go('viva')}>Set up your first exam<${Icon} name="arrowR" size=${15} /></button>
    </div>
  </div>`;
}

function HomePage() {
  const { profile: p, speeches, preps, vivas } = useStore();
  const hasData = speeches.length > 0;
  const scores = hasData ? p.skills : SAMPLE_PROFILE.scores;
  const trail = hasData ? p.trail : SAMPLE_PROFILE.trail;
  const ghost = hasData ? (p.trail.length > 1 ? { ethos: p.trail[0].e, pathos: p.trail[0].p, logos: p.trail[0].l } : null) : SAMPLE_PROFILE.first;
  const [poster, setPoster] = useState(false);
  const lesson = nextLesson(p);
  const openPrep = preps.find((x) => !x.done);
  const exams = (vivas || []).filter((v) => v && v.id);
  const openExam = exams.find((v) => v.status !== 'done');
  const lastExam = exams.find((v) => v.status === 'done');
  const lastPct = examPercent(lastExam);
  const weak = weakestPole(p.skills);
  const strong = strongestPole(p.skills);
  const triLine = !hasData ? 'A sample speaker’s triangle. Analyze your first speech and this becomes yours.'
    : weak && strong && weak !== strong ? `${POLES[strong].name} leads. ${POLES[weak].name} is your fastest way up.`
      : 'Every speech you analyze moves this triangle.';
  return html`<${Fragment}>
    ${!p.onboarded ? html`<${Onboarding} />` : null}
    <${HomeStage} scores=${scores} example=${!hasData} trail=${trail} ghost=${ghost} triLine=${triLine} onPoster=${() => setPoster(true)} />
    ${poster ? html`<${PosterModal} onClose=${() => setPoster(false)} />` : null}
    ${p.onboarded && (hasData || exams.length || openPrep) ? html`<${TodayStrip} p=${p} preps=${preps} vivas=${vivas} />` : null}
    <section className="home-cards">
      <${LevelCard} />
      <${QuestsCard} />
      <${StreakCard} />
    </section>
    <section className="stack resume">
      <div className="sec-head"><div><div className="eyebrow">Keep moving <span className="greek" lang="grc">ἄσκησις</span></div><h2>${speeches.length || openPrep || openExam ? 'Pick up where you left off' : 'More ways to practice'}</h2></div></div>
      <div className="tile-grid">
        <button className="tile-btn" onClick=${() => go('analyze')}>
          <span className="tile-ic"><${Icon} name="mic" /></span>
          <h3>Analyze a speech</h3><span className="small muted">Upload a recording, a transcript, or both. Get delivery and content feedback.</span>
        </button>
        <button className="tile-btn" onClick=${() => (openPrep ? go('prepare', openPrep.id) : go('prepare'))}>
          <span className="tile-ic"><${Icon} name="pen" /></span>
          <h3>${openPrep ? 'Continue: ' + (openPrep.brief.title || 'your draft') : 'Prepare a speech'}</h3><span className="small muted">${openPrep ? 'Your coach is waiting on the next section.' : 'Find your angle, then write it with a coach at your side.'}</span>
        </button>
        <button className="tile-btn" onClick=${() => (openExam ? go('viva', openExam.id) : go('viva'))}>
          <span className="tile-ic"><${Icon} name="scroll" /></span>
          <h3>${openExam ? 'Continue: ' + (openExam.subject || 'your oral exam') : 'Take an oral exam'}</h3>
          <span className="small muted">${openExam ? (openExam.status === 'live' ? 'Your examiner is waiting for your next answer.' : 'Your exam is set up. Start when you’re ready.') : lastExam && lastPct != null ? `Last result: ${lastPct}% in ${lastExam.subject || 'your last exam'}. Go again.` : 'Explain what you know out loud, to an examiner who follows up.'}</span>
        </button>
        <button className="tile-btn" onClick=${() => go('gym')}>
          <span className="tile-ic"><${Icon} name="dumbbell" /></span>
          <h3>Warm up in the Gym</h3><span className="small muted">${p.stats.impromptus ? `${plural(p.stats.impromptus, 'impromptu')} spoken so far. Keep the voice warm.` : 'Breathing, tongue twisters and impromptu topics. Five minutes before you speak.'}</span>
        </button>
        ${lesson ? html`<button className="tile-btn" style=${{ '--tc': POLES[lesson.pole].color }} onClick=${() => go('lesson', lesson.id)}>
          <span className="tile-ic" style=${{ background: POLES[lesson.pole].soft, color: POLES[lesson.pole].color }}><${Icon} name="book" /></span>
          <h3>${lesson.title}</h3><span className="small muted">${lesson.from ? 'Written for you after “' + (lesson.fromTitle || 'your speech') + '”.' : POLES[lesson.pole].name + ' lesson · ' + (lesson.minutes || 4) + ' min'}</span>
        </button>` : null}
        <button className="tile-btn" onClick=${() => go('game', 'fallacy')}>
          <span className="tile-ic"><${Icon} name="target" /></span>
          <h3>Fallacy Hunt</h3><span className="small muted">${p.stats.best && p.stats.best.fallacy ? 'Your best: ' + p.stats.best.fallacy.toLocaleString() + ' points.' : 'Ten rounds, fifteen seconds each. Build a combo.'}</span>
        </button>
      </div>
    </section>
    <section className="home-recent">
      <div className="slab">
        <div className="card-head"><div><div className="eyebrow">History <span className="greek" lang="grc">λόγοι</span></div><h2>Recent speeches</h2></div><button className="btn btn-sm" onClick=${() => go('analyze')}><${Icon} name="plus" size=${16} />New analysis</button></div>
        ${hasData ? speeches.slice(0, 5).map((s) => html`<${SpeechRow} key=${s.id} s=${s} />`) : html`<${SpeechRow} s=${getSample()} example=${true} />`}
      </div>
      <div className="slab">
        <div className="card-head"><div><div className="eyebrow">Oral exams <span className="greek" lang="grc">ἐξετάσεις</span></div><h2>Recent oral exams</h2></div><button className="btn btn-sm" onClick=${() => go('viva')}><${Icon} name="plus" size=${16} />New exam</button></div>
        ${exams.length ? exams.slice(0, 5).map((v) => html`<${ExamRow} key=${v.id} v=${v} />`) : html`<${ExamEmpty} />`}
      </div>
    </section>
  <//>`;
}
function SpeechRow({ s, example }) {
  return html`<button type="button" className="list-item" onClick=${() => go('report', s.id)}>
    <${MiniTriangle} scores=${s.scores} size=${46} />
    <span style=${{ minWidth: 0 }}><span className="li-title" style=${{ display: 'block' }}>${s.title}</span><span className="small muted">${occasionOf(s.occasion).label} · ${fmtDate(s.date)} · ${fmtTime(s.durationSec)}${example ? ' · ' : ''}${example ? html`<span className="chip chip-sm chip-example">Example</span>` : null}</span></span>
    <span className="score-trio"><span style=${{ color: 'var(--ethos)' }}>${s.scores.ethos ?? '–'}</span><span style=${{ color: 'var(--pathos)' }}>${s.scores.pathos ?? '–'}</span><span style=${{ color: 'var(--logos)' }}>${s.scores.logos ?? '–'}</span></span>
  </button>`;
}

/* ---------- Analyze ---------- */
function Dropzone({ accept, onFile, icon, title, sub }) {
  const [over, setOver] = useState(false);
  return html`<label className=${'drop' + (over ? ' over' : '')} onDragOver=${(e) => { e.preventDefault(); setOver(true); }} onDragLeave=${() => setOver(false)} onDrop=${(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) onFile(f); }}>
    <input type="file" accept=${accept} onChange=${(e) => { const f = e.target.files && e.target.files[0]; if (f) onFile(f); e.target.value = ''; }} />
    <span className="tile-ic" style=${{ background: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}><${Icon} name=${icon} /></span>
    <b>${title}</b><span className="small muted">${sub}</span>
  </label>`;
}
function RunTheater({ run, plan, onStop }) {
  const lines = ['Weighing ethos, pathos and logos…', 'Hunting for fallacies…', 'Checking that the numbers add up…', 'Mapping your structure…', 'Finding your best line…', 'Writing lessons for your weak spots…'];
  const [li, setLi] = useState(0);
  useEffect(() => { const t = setInterval(() => setLi((i) => (i + 1) % lines.length), 3200); return () => clearInterval(t); }, []);
  const order = plan.map((p) => p.id);
  const idx = order.indexOf(run.stage === 'energy' ? 'energy' : run.stage);
  return html`<div className="stage run-stage"><div className="run-lights" aria-hidden="true">${POLE_KEYS.map((k, i) => html`<i key=${k} style=${{ '--c': UI_STAGE_COLOR[k], animationDelay: i * -1.3 + 's' }}></i>`)}</div><div className="theater">
    <svg className="theater-tri" viewBox="0 0 150 150" aria-hidden="true">
      <path d="M75 14 138 128H12z" style=${{ stroke: 'var(--stage-line)', animation: 'none', strokeDasharray: 'none' }} />
      <path d="M75 14 138 128H12z" style=${{ stroke: 'var(--stage-ethos)' }} />
      <path d="M75 14 138 128H12z" style=${{ stroke: 'var(--stage-pathos)', animationDelay: '-.9s' }} />
      <path d="M75 14 138 128H12z" style=${{ stroke: 'var(--stage-logos)', animationDelay: '-1.8s' }} />
    </svg>
    <div><div className="eyebrow">Weighing it <span className="greek" lang="grc">κρίσις</span></div><h2>Your coach is reading your speech</h2><p className="muted" style=${{ marginTop: 6 }} aria-live="polite">${run.stage === 'ai' ? (run.chars > 0 ? `${lines[li]} (${run.chars.toLocaleString()} characters written)` : lines[li]) : 'Measuring on your device. Nothing leaves your browser at this step.'}</p></div>
    <div className="run-steps">
      ${plan.map((p, i) => {
        const state = i < idx ? 'done' : i === idx ? 'active' : '';
        return html`<div key=${p.id} className=${'run-step ' + state}>
          ${state === 'done' ? html`<${Icon} name="check" size=${18} className="ok" />` : state === 'active' ? html`<span className="spin" style=${{ color: 'var(--stage-gold)' }}></span>` : html`<${Icon} name=${p.icon} size=${18} />`}
          <span>${p.label}</span>
          <span className="tiny muted num">${state === 'active' && p.id !== 'ai' && run.p ? Math.round(run.p * 100) + '%' : ''}</span>
        </div>`;
      })}
    </div>
    <button className="btn" onClick=${onStop}><${Icon} name="stop" size=${16} />Stop</button>
  </div></div>`;
}
function AnalyzePage({ param }) {
  const { speeches, ai, profile } = useStore();
  const pre = param && typeof param === 'object' ? param : null;
  const [file, setFile] = useState(null);
  const [tMode, setTMode] = useState('paste');
  const [text, setText] = useState(pre ? pre.text || '' : '');
  const [cues, setCues] = useState(null);
  const [tName, setTName] = useState('');
  const [title, setTitle] = useState(pre ? pre.title || '' : '');
  const [occasion, setOccasion] = useState((pre && pre.occasion) || profile.goal || 'presentation');
  const [focus, setFocus] = useState([]);
  const [run, setRun] = useState(null);
  const [err, setErr] = useState('');
  const [idea, setIdea] = useState('');
  const ctl = useRef(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const words = wordsOf(text).length;
  const isVideo = file && (/^video\//.test(file.type) || /\.(mp4|mov|webm|m4v)$/i.test(file.name));
  const canRun = !!file || words >= 30;
  const pickMedia = (f) => {
    if (!/^(audio|video)\//.test(f.type) && !/\.(mp3|m4a|wav|aac|ogg|oga|flac|webm|mp4|mov|m4v)$/i.test(f.name)) { setErr('That file isn’t audio or video. Try MP3, M4A, WAV, MP4 or MOV.'); return; }
    if (f.size > 400e6) { setErr('That file is over 400 MB. Trim it or export the audio only.'); return; }
    setErr(''); setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 60));
  };
  const pickTranscript = async (f) => {
    if (f.size > 2e6) { setErr('That transcript file is too large. Keep it under 2 MB.'); return; }
    const raw = await f.text();
    const r = readTranscriptFile(f.name, raw);
    setText(r.text); setCues(r.cues); setTName(f.name); setTMode('paste'); setErr('');
  };
  const writeOnPrompt = () => {
    const cat = GYM_CATS[Math.floor(Math.random() * GYM_CATS.length)];
    const q = gymPickPrompt(cat.id);
    if (!q) return;
    setIdea(q); setTitle(q.slice(0, 80)); setTMode('paste');
    setTimeout(() => { const el = document.getElementById('an-text'); if (el && el.focus) el.focus(); }, 0);
  };
  const plan = [];
  if (file) plan.push({ id: 'decode', label: 'Decoding audio', icon: 'wave' }, { id: 'energy', label: 'Measuring pace and pauses', icon: 'clock' }, { id: 'pitch', label: 'Tracing pitch and volume', icon: 'trend' });
  else if (cues) plan.push({ id: 'captions', label: 'Reading caption timing', icon: 'clock' });
  if (file && isVideo && ai === 'ready' && AI.images) plan.push({ id: 'presence', label: 'Reading body language', icon: 'video' });
  if (words >= 30) plan.push({ id: 'ai', label: ai === 'off' ? 'Reading your content (on-device)' : 'Reading your argument', icon: 'sparkles' });
  async function start() {
    setErr('');
    const c = new AbortController(); ctl.current = c;
    setRun({ stage: plan[0] ? plan[0].id : 'ai', p: 0, chars: 0 });
    try {
      const sp = await runSpeechAnalysis({ file, transcript: text, cues, title: title.trim(), occasion, focus }, (stage, v) => setRun((r) => (stage === 'ai' ? { ...r, stage, chars: v || 0 } : { ...r, stage, p: v || 0 })), c.signal);
      if (alive.current) {
        Celebrate.pending = sp.id;
        Celebrate.release = FX.hold(9000);
        Store.addSpeech(sp);
        go('report', sp.id);
      } else {
        Store.addSpeech(sp);
        toast('Your analysis of “' + sp.title + '” is ready in Analyze.', 'gold');
      }
    } catch (e) {
      if (!alive.current) return;
      setRun(null);
      if (e && e.code === 'cancelled') return;
      if (e && ['decode', 'short', 'silent'].includes(e.code)) setErr(e.message);
      else if (e && e.code) setErr(aiErrorText(e));
      else { console.error(e); setErr(file ? 'The analysis stopped unexpectedly. Try a different file format.' : 'The analysis stopped unexpectedly. Your text is still here, so try again.'); }
    }
  }
  if (run) return html`<${RunTheater} run=${run} plan=${plan} onStop=${() => ctl.current && ctl.current.abort()} />`;
  return html`<${Fragment}>
    <${PageHead} label="Analyze" greek="ἀνάλυσις" title="Bring a speech to the coach" fig="anaphora" mark=${['Bring']} line="Bring the recording for delivery. Bring the words for content. Bring both for the full picture." />
    <div className="analyze-grid">
      <div className="card">
        <div className="step">
          <span className=${'step-n' + (file ? ' ok' : '')}>${file ? html`<${Icon} name="check" size=${16} stroke=${3} />` : '1'}</span>
          <div className="stack" style=${{ gap: 10 }}>
            <div><h3>Recording</h3><p className="small muted">Pace, pauses, pitch and volume are measured on your device. Video also gets a body-language read.</p></div>
            ${file ? html`<div className="file-pill">
              <span className="tile-ic" style=${{ background: 'var(--ethos-soft)', color: 'var(--ethos)' }}><${Icon} name=${isVideo ? 'video' : 'wave'} /></span>
              <span style=${{ minWidth: 0 }}><span className="file-name" style=${{ display: 'block' }}>${file.name}</span><span className="small muted">${isVideo ? 'Video' : 'Audio'} · ${fmtBytes(file.size)}</span></span>
              <button className="btn btn-ghost btn-sm btn-icon" onClick=${() => setFile(null)} aria-label="Remove recording"><${Icon} name="x" size=${18} /></button>
            </div>` : html`<${Dropzone} accept="audio/*,video/*,.m4a,.mp3,.wav,.mp4,.mov,.webm" onFile=${pickMedia} icon="upload" title="Drop a recording or browse" sub="MP3, M4A, WAV, MP4, MOV · a phone voice memo works great" />`}
          </div>
        </div>
        <div className="step">
          <span className=${'step-n' + (words >= 30 ? ' ok' : '')}>${words >= 30 ? html`<${Icon} name="check" size=${16} stroke=${3} />` : '2'}</span>
          <div className="stack" style=${{ gap: 10 }}>
            <div><h3>Transcript</h3><p className="small muted">${ai === 'off' ? 'Unlocks a content estimate from word patterns: evidence, hedges and sweeping claims.' : 'Unlocks content analysis: structure, evidence, fallacies, inconsistencies and personal lessons.'}</p></div>
            <div className="seg" role="group" aria-label="Transcript input"><button aria-pressed=${tMode === 'paste'} onClick=${() => setTMode('paste')}>Paste text</button><button aria-pressed=${tMode === 'file'} onClick=${() => setTMode('file')}>Upload file</button></div>
            ${tMode === 'file' ? html`<${Dropzone} accept=".txt,.vtt,.srt,.md,text/plain,text/vtt" onFile=${pickTranscript} icon="file" title="Drop a transcript or browse" sub="TXT, or VTT and SRT caption files (their timing is used for pacing)" />`
              : html`<div className="field">
                <textarea id="an-text" className="textarea" rows="9" value=${text} onInput=${(e) => { setText(e.target.value); if (cues) { setCues(null); setTName(''); } }} placeholder=${idea ? idea + ' Write about 30 seconds on it, as you would say it.' : 'Paste what you said, or the script you plan to say…'}></textarea>
                <div className="row-between hint"><span>${tName ? `From ${tName}${cues ? ' · caption timing found' : ''}` : words ? `${words.toLocaleString()} words · about ${Math.max(1, Math.round(words / 140))} min spoken` : 'At least 30 words'}</span>${text ? html`<button className="btn btn-ghost btn-sm" onClick=${() => { setText(''); setCues(null); setTName(''); }}>Clear</button>` : null}</div>
              </div>`}
            ${!speeches.length && !file && !text ? html`<div className="no-speech">
              <b>No speech handy?</b>
              <div className="row" style=${{ gap: 8 }}><button type="button" className="btn btn-sm" onClick=${writeOnPrompt}><${Icon} name="pen" size=${15} />Write 30 seconds on a prompt</button><button type="button" className="btn btn-sm" onClick=${() => go('gym', 'impromptu')}><${Icon} name="dumbbell" size=${15} />Practice out loud in the Gym</button></div>
            </div>` : null}
            <details className="details"><summary><${Icon} name="info" size=${16} />Where to get a transcript</summary>
              <div className="details-body">
                <span><b>Zoom, Teams, Meet:</b> download the meeting transcript (.vtt) from the recording page.</span>
                <span><b>YouTube:</b> open the video, choose “Show transcript” under the description, and copy the text.</span>
                <span><b>iPhone Voice Memos:</b> open a recording and tap the transcript icon, then copy.</span>
                <span><b>Writing a speech?</b> Paste your script to check the content before you deliver it.</span>
              </div>
            </details>
          </div>
        </div>
        <div className="step">
          <span className="step-n">3</span>
          <div className="stack" style=${{ gap: 12 }}>
            <div><h3>Context</h3><p className="small muted">The coach calibrates pace and expectations to the occasion.</p></div>
            <div className="field"><label htmlFor="an-title">Title</label><input id="an-title" className="input" value=${title} onInput=${(e) => setTitle(e.target.value)} placeholder=${ai === 'off' ? 'Optional' : 'Optional. The coach will suggest one.'} /></div>
            <div className="field"><span className="label">Occasion</span><div className="row" style=${{ gap: 6 }}>${OCCASIONS.map((o) => html`<button key=${o.id} className="chip" aria-pressed=${occasion === o.id} onClick=${() => setOccasion(o.id)} title=${o.hint}>${o.label}</button>`)}</div></div>
            <div className="field"><span className="label">Anything you want extra feedback on?</span><div className="row" style=${{ gap: 6 }}>${FOCUS_OPTIONS.map((f) => html`<button key=${f} className="chip chip-sm" aria-pressed=${focus.includes(f)} onClick=${() => setFocus((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]))}>${f}</button>`)}</div></div>
          </div>
        </div>
        ${err ? html`<div className="notice notice-warn" style=${{ marginTop: 18 }}><${Icon} name="alert" size=${18} /><span>${err}</span></div>` : null}
        ${ai === 'off' && words >= 30 ? html`<div className="notice" style=${{ marginTop: 18 }}><${Icon} name="info" size=${18} /><span>The AI coach isn’t available in this view, so content gets an on-device estimate instead of a full read.</span></div>` : null}
        <div className="row" style=${{ marginTop: 20 }}>
          <button className="btn-cta" disabled=${!canRun} onClick=${start}><${Icon} name="sparkles" size=${18} />${!file && words >= 30 ? 'Analyze content' : file && words < 30 ? 'Analyze delivery' : 'Analyze speech'}</button>
          <span className="hint">${canRun ? analyzeXpHint(words, !!file, speeches.length > 0, ai === 'ready') : 'Add a recording or at least 30 words of transcript.'}</span>
        </div>
      </div>
      <div className="stack">
        <div className="card">
          <div className="card-head" style=${{ marginBottom: 6 }}><div><div className="eyebrow">What you get</div><h3>A full read in three layers</h3></div></div>
          <ul className="list-check">
            <li><${Icon} name="wave" size=${20} style=${{ color: 'var(--ethos)' }} /><span><b>Delivery.</b> Words per minute, deliberate pauses vs. frozen silences, pitch variety in semitones, volume dynamics, filler words.</span></li>
            <li><${Icon} name="scale" size=${20} style=${{ color: 'var(--logos)' }} /><span>${ai === 'off' ? html`<b>Content estimate.</b> Word-pattern checks for evidence, hedges and sweeping claims.` : html`<b>Content.</b> Structure map, evidence check, logical fallacies and contradictions, highlighted in your own words.`}</span></li>
            <li><${Icon} name="book" size=${20} style=${{ color: 'var(--pathos)' }} /><span>${ai === 'off' ? html`<b>Growth.</b> Core lessons matched to your weakest appeal.` : html`<b>Growth.</b> Three lessons written for your weak spots, each with a drill your coach will grade.`}</span></li>
          </ul>
        </div>
        <div className="card">
          <div className="card-head" style=${{ marginBottom: 4 }}><div><div className="eyebrow">Your analyses</div><h3>${speeches.length ? plural(speeches.length, 'speech', 'speeches') : 'Nothing yet'}</h3></div></div>
          ${speeches.slice(0, 6).map((s) => html`<${SpeechRow} key=${s.id} s=${s} />`)}
          <${SpeechRow} s=${getSample()} example=${true} />
        </div>
      </div>
    </div>
  <//>`;
}

/* ---------- Report ---------- */
function NoteCard({ item, onClose }) {
  if (!item) return null;
  const meta = KIND_META[item.kind] || KIND_META.weak;
  return html`<div className="note-card">
    <div className="row-between"><span className="row" style=${{ gap: 8 }}><span className="k-dot" style=${{ background: meta.color }}></span><span className="eyebrow" style=${{ color: meta.color }}>${meta.label}</span></span>${onClose ? html`<button className="btn btn-ghost btn-sm btn-icon" onClick=${onClose} aria-label="Close note"><${Icon} name="x" size=${16} /></button>` : null}</div>
    <h3>${item.label}</h3>
    ${item.quote ? html`<blockquote>“${item.quote}”</blockquote>` : null}
    ${item.note ? html`<p className="small" style=${{ color: 'var(--ink-2)' }}>${item.note}</p>` : null}
    ${item.fix ? html`<div className="fix"><${Icon} name="check" size=${16} style=${{ color: 'var(--good)', flex: 'none', marginTop: 1 }} /><span>${item.fix}</span></div>` : null}
    ${item.pole && POLES[item.pole] ? html`<div><${PoleChip} pole=${item.pole} /></div>` : null}
  </div>`;
}
function Annotated({ text, items, verse, emptyHint }) {
  const marks = useMemo(() => placeMarks(text, items), [text, items]);
  const segs = useMemo(() => segmentText(text, marks), [text, marks]);
  const [active, setActive] = useState(null);
  const [hidden, setHidden] = useState({});
  const counts = {};
  marks.forEach((m) => { counts[m.kind] = (counts[m.kind] || 0) + 1; });
  const kinds = Object.keys(counts).sort((a, b) => (KIND_PRIORITY[b] || 0) - (KIND_PRIORITY[a] || 0));
  const activate = (idx) => setActive((a) => (a === idx ? null : idx));
  return html`<div className="transcript-wrap">
    <div className="stack" style=${{ gap: 14 }}>
      ${kinds.length ? html`<div className="row" role="group" aria-label="Show or hide highlight types" style=${{ gap: 6 }}>
        ${kinds.map((k) => html`<button key=${k} className="chip chip-sm" aria-pressed=${!hidden[k]} onClick=${() => setHidden((h) => ({ ...h, [k]: !h[k] }))} style=${hidden[k] ? null : { background: 'var(--surface)', color: 'var(--ink)', borderColor: KIND_META[k] ? KIND_META[k].color : 'var(--line)' }}><span className="k-dot" style=${{ background: KIND_META[k] ? KIND_META[k].color : 'var(--muted)' }}></span>${(KIND_META[k] || { label: k }).label} · ${counts[k]}</button>`)}
      </div>` : null}
      <div className=${'transcript' + (verse ? ' verse' : '')}>${segs.map((s, i) => (s.mark && !hidden[s.mark.kind]
        ? html`<span key=${i} role="button" tabIndex="0" className=${'hl k-' + s.mark.kind + (active === s.mark.idx ? ' is-active' : '')} onClick=${() => activate(s.mark.idx)} onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(s.mark.idx); } }}>${s.text}</span>`
        : html`<span key=${i}>${s.text}</span>`))}</div>
    </div>
    <aside className="transcript-aside">${active != null ? html`<${NoteCard} item=${items[active]} onClose=${() => setActive(null)} />` : html`<div className="note-card desk-only"><span className="eyebrow">Coach’s notes</span><p className="small muted">${emptyHint || 'Tap any highlight to read the note behind it.'}</p></div>`}</aside>
  </div>`;
}
function MetricTile({ label, value, unit, sub, score, children }) {
  const tone = score == null ? null : score >= 70 ? 'good' : 'warn';
  return html`<div className="metric">
    <div className="row-between"><span className="label">${label}</span>${tone ? html`<span className=${'chip chip-sm chip-' + tone}>${tone === 'good' ? 'On point' : 'Work on it'}</span>` : null}</div>
    <div><span className="val">${value}</span>${unit ? html`<span className="unit">${unit}</span>` : null}</div>
    ${children}
    ${sub ? html`<span className="tiny muted">${sub}</span>` : null}
  </div>`;
}
function DeliverySection({ sp }) {
  const m = sp.metrics, d = sp.delivery;
  if (!m || !d) return null;
  const audio = m.source === 'audio';
  return html`<section className="card stack" style=${{ gap: 18 }}>
    <div className="sec-head"><div><div className="eyebrow">Delivery <span className="greek" lang="grc">ὑπόκρισις</span></div><h2>How you sounded</h2><p className="small muted">${audio ? 'Measured from your recording, on your device.' : 'Estimated from caption timing. Upload the recording for pitch and volume.'}</p></div>
      <div className="row"><span className="chip"><${Icon} name="shield" size=${14} style=${{ color: 'var(--ethos)' }} />Confidence ${d.confidence ?? '–'}</span>${d.expressiveness != null ? html`<span className="chip"><${Icon} name="heart" size=${14} style=${{ color: 'var(--pathos)' }} />Expressiveness ${d.expressiveness}</span>` : null}</div></div>
    ${m.wave ? html`<div>
      <${Waveform} wave=${m.wave} duration=${m.duration} pauses=${m.pauses.list} />
      <div className="row-between tiny muted num" style=${{ marginTop: 4 }}><span>0:00</span><span>${fmtTime(m.duration / 2)}</span><span>${fmtTime(m.duration)}</span></div>
      <div className="legend" style=${{ marginTop: 6 }}><span><i style=${{ background: 'color-mix(in srgb, var(--ethos) 35%, transparent)' }}></i>Deliberate pause (0.7–2 s)</span><span><i style=${{ background: 'color-mix(in srgb, var(--warn) 45%, transparent)' }}></i>Frozen silence (over 2 s)</span></div>
    </div>` : null}
    <div className="metric-grid">
      <${MetricTile} label="Pace" value=${d.wpm ?? '–'} unit="wpm" score=${d.paceScore} sub=${`Ideal ${d.pace[0]}–${d.pace[1]} for this occasion · ${d.wpmSource === 'transcript' ? 'from transcript' : d.wpmSource === 'captions' ? 'from captions' : 'estimated from syllables'}`}><${Gauge} value=${d.wpm} min=${80} max=${220} band=${d.pace} /><//>
      ${d.pauseScore != null ? html`<${MetricTile} label="Pauses" value=${m.pauses.deliberate} unit="deliberate" score=${d.pauseScore} sub=${`${m.pauses.long} over 2 s · ${m.pauses.short} short breaths`} />` : null}
      ${m.pitch ? html`<${MetricTile} label="Pitch variety" value=${m.pitch.std.toFixed(1)} unit="semitones" score=${d.pitchScore} sub=${`Around ${m.pitch.median} Hz · lively speakers move 3–5`}><${Gauge} value=${m.pitch.std} min=${0} max=${8} band=${[2.5, 5]} /><//>` : null}
      ${m.loudness ? html`<${MetricTile} label="Volume dynamics" value=${m.loudness.std.toFixed(1)} unit="dB" score=${d.volumeScore} sub=${`${m.loudness.range.toFixed(0)} dB between your quiet and loud phrases`}><${Gauge} value=${m.loudness.std} min=${0} max=${10} band=${[3.5, 8]} /><//>` : null}
      ${d.fillersPerMin != null ? html`<${MetricTile} label="Filler words" value=${d.fillersPerMin.toFixed(1)} unit="/ min" score=${d.fillerScore} sub=${`${plural(d.fillerCount, 'filler')} in ${fmtTime(m.spanSec)}`} />` : null}
      <${MetricTile} label="Length" value=${fmtTime(m.duration)} unit="" sub=${m.speakingSec ? `${Math.round((m.speakingSec / Math.max(1, m.spanSec)) * 100)}% of the time you were voicing` : 'From the first to the last caption'} />
    </div>
    ${m.timeline && m.timeline.length > 3 ? html`<div><div className="label" style=${{ marginBottom: 8 }}>Your arc, start to finish</div><${ArcChart} timeline=${m.timeline} duration=${m.duration} /></div>` : null}
    <div className="note-list">
      ${d.notes.map((n, i) => html`<div key=${i} className="note"><span className=${'note-ic ' + n.tone}><${Icon} name=${n.tone === 'good' ? 'check' : 'alert'} size=${16} /></span><span><b>${n.title}.</b> ${n.text}</span></div>`)}
    </div>
  </section>`;
}
/* Three spotlights, three numbers: each appeal stands in its own light, as bright as its score */
function SpotlitScore({ k, sp, prev, index = 0 }) {
  const a = sp.ai, h = sp.heur;
  const subs = a && a.subscores ? a.subscores[k] : h && h.subscores ? h.subscores[k] : null;
  const v = sp.scores ? sp.scores[k] : null;
  const dv = prev && prev.scores && v != null && prev.scores[k] != null ? v - prev.scores[k] : null;
  const f = v == null || !isFinite(v) ? 0 : clamp(v, 0, 100) / 100;
  return html`<div className=${'spot spot-' + k + (v == null ? ' is-dark' : '')} style=${{ '--c': UI_STAGE_COLOR[k], '--f': f.toFixed(2), '--d': (0.25 + index * 0.35).toFixed(2) + 's' }}>
    <span className="spot-cone" aria-hidden="true"></span>
    <span className="spot-lamp" aria-hidden="true"></span>
    <div className="spot-head"><span className="inscr">${POLES[k].name}</span><${Delta} value=${dv} /></div>
    <div className="spot-num num" aria-label=${`${POLES[k].name} ${v == null ? 'not measured' : Math.round(v)}`}><${CountUp} value=${v} /></div>
    <div className="spot-tier"><${TierMedal} score=${v} /><span className="greek">${POLES[k].greek}</span></div>
    <div className="spot-subs">${subs ? Object.entries(POLES[k].subs).map(([sk, lab]) => html`<div key=${sk} className="sub-row"><span>${lab}</span><b className="num" style=${{ textAlign: 'right' }}>${subs[sk] == null ? '–' : subs[sk]}</b><${Bar} value=${subs[sk]} color=${UI_STAGE_COLOR[k]} /></div>`)
      : html`<span className="tiny muted">${k === 'logos' ? 'Needs a transcript' : 'From delivery only'}</span>`}</div>
  </div>`;
}
function ReportStage({ sp, prev }) {
  const a = sp.ai, h = sp.heur;
  const content = a || h;
  const arch = archetypeOf(sp.scores);
  const mix = triLight(sp.scores);
  return html`<section className="stage rpt-stage" style=${{ '--mix': mix }} aria-labelledby="rpt-title">
    <span className="rpt-truss" aria-hidden="true"></span>
    <div className="row-between rpt-top">
      <div className="row" style=${{ gap: 6 }}>
        ${sp.sample ? html`<span className="chip chip-sm chip-example">Sample report</span>` : null}
        <span className="chip chip-sm">${occasionOf(sp.occasion).label}</span>
        <span className="chip chip-sm">${fmtDate(sp.date)}</span>
        <span className="chip chip-sm"><${Icon} name="clock" size=${13} />${fmtTime(sp.durationSec)}</span>
        ${sp.source && sp.source.kind ? html`<span className="chip chip-sm"><${Icon} name=${sp.source.kind === 'video' ? 'video' : 'wave'} size=${13} />${sp.source.kind}</span>` : null}
        ${sp.transcript ? html`<span className="chip chip-sm"><${Icon} name="file" size=${13} />${plural(sp.words, 'word')}</span>` : null}
      </div>
      ${!sp.sample ? html`<span className="xp-earned"><${Icon} name="bolt" size=${16} />+${sp.xp} XP</span>` : null}
    </div>
    <div className="rpt-title">
      <div className="eyebrow">Report <span className="greek" lang="grc">κρίσις</span></div>
      <h1 id="rpt-title">${sp.title}</h1>
      ${content && content.summary ? html`<p className="lead">${content.summary}</p>` : null}
    </div>
    <div className="rpt-scores">
      <div className="rpt-overall">
        <${Ring} value=${sp.scores.overall} size=${136} stroke=${12} color=${mix} label="overall" />
        <span className="rpt-arch">${arch.name}</span>
        <span className="tiny muted">All three lights, mixed</span>
      </div>
      ${POLE_KEYS.map((k, i) => html`<${SpotlitScore} key=${k} k=${k} sp=${sp} prev=${prev} index=${i} />`)}
    </div>
    ${a && a.coach_note ? html`<blockquote className="coach-note rpt-note"><span className="coach-avatar"><${LogoMark} size=${24} ink="var(--stage-ink)" /></span><span><span className="eyebrow">From your coach <span className="greek" lang="grc">σύμβουλος</span></span><span className="rpt-note-text">${a.coach_note}</span></span></blockquote>` : null}
  </section>`;
}

/* The structure as a temple: every part of the speech is a column holding up the roof */
const TEMPLE_COL = { strong: 1, solid: 1, weak: 1, missing: 0.4 };
function templeGeometry(n) {
  const colW = 46, pitch = 88, side = 40;
  const W = side * 2 + colW + Math.max(0, n - 1) * pitch;
  return { colW, pitch, side, W, cx: (i) => side + colW / 2 + i * pitch };
}
function StructureTemple({ parts }) {
  const list = (parts || []).filter((s) => s && s.part).slice(0, 8);
  const n = list.length;
  if (!n) return null;
  const g = templeGeometry(n);
  const W = g.W;
  const label = 'Structure: ' + list.map((s) => `${s.part} ${s.verdict || 'unrated'}`).join(', ');
  return html`<svg className="temple" viewBox=${`-12 0 ${W + 24} 226`} role="img" aria-label=${label} style=${{ maxWidth: Math.min(720, 130 * n + 80) + 'px' }}>
    <path d=${`M6 50L${W / 2} 8L${W - 6} 50Z`} className="temple-ped" />
    <path d=${`M34 45L${W / 2} 17L${W - 34} 45Z`} className="temple-tym" />
    <rect x="6" y="50" width=${W - 12} height="16" className="temple-ent" />
    ${list.map((s, i) => { const cx = g.cx(i); return html`<rect key=${'tg' + i} x=${cx - 6} y="53" width="12" height="10" rx="1" className="temple-tri" />`; })}
    ${list.map((s, i) => {
      const cx = g.cx(i), hw = g.colW / 2, vc = VERDICT_COLOR[s.verdict] || 'var(--muted)';
      const missing = s.verdict === 'missing';
      const top = missing ? 132 : 80;
      return html`<g key=${'c' + i} className=${'temple-col v-' + (s.verdict || 'none')} style=${{ '--vc': vc }}>
        ${missing ? null : html`<${Fragment}>
          <rect x=${cx - hw - 6} y="66" width=${g.colW + 12} height="7" rx="1" className="temple-stone" />
          <path d=${`M${cx - hw - 3} 73L${cx + hw + 3} 73L${cx + hw} 80L${cx - hw} 80Z`} className="temple-stone" />
        <//>`}
        <path d=${missing
          ? `M${cx - hw + 3} 176L${cx - hw + 4} 140L${cx - hw + 12} 133L${cx - 3} 141L${cx + 6} 128L${cx + hw - 4} 137L${cx + hw - 3} 176Z`
          : `M${cx - hw + 5} ${top}L${cx + hw - 5} ${top}L${cx + hw - 2} 176L${cx - hw + 2} 176Z`} className="temple-shaft" />
        ${[-11, 0, 11].map((o) => html`<line key=${o} x1=${cx + o} x2=${cx + o * 1.08} y1=${missing ? 144 : top + 3} y2="173" className="temple-flute" />`)}
        ${s.verdict === 'weak' ? html`<path d=${`M${cx - 12} 96L${cx + 1} 110L${cx - 6} 123L${cx + 8} 141L${cx + 3} 150`} className="temple-crack" />` : null}
        ${missing ? html`<path d=${`M${cx + hw + 4} 176l4-9 9 1 3 8z`} className="temple-stone" />` : null}
        <rect x=${cx - hw - 4} y="176" width=${g.colW + 8} height="7" rx="1" className="temple-stone" />
        <text x=${cx} y="218" textAnchor="middle" className="temple-num">${toRoman(i + 1)}</text>
      </g>`;
    })}
    <rect x="0" y="183" width=${W} height="8" className="temple-step" />
    <rect x="-10" y="191" width=${W + 20} height="8" className="temple-step" />
  </svg>`;
}

function ReportPage({ id }) {
  const { speeches, ai: aiState, profile } = useStore();
  const sp = id === 'sample' ? getSample() : speeches.find((s) => s.id === id);
  const [confirmDel, setConfirmDel] = useState(false);
  const [poster, setPoster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [curtain, setCurtain] = useState(() => !!(sp && Celebrate.pending === sp.id));
  const revealed = useRef(false);
  const overall = sp && sp.scores ? sp.scores.overall : null;
  const reveal = useCallback(() => {
    if (revealed.current) return;
    revealed.current = true;
    setCurtain(false);
    if (Celebrate.release) { const rel = Celebrate.release; Celebrate.release = null; setTimeout(rel, 3000); }
    Sound.play('reveal');
    if (overall != null && overall >= 60) { try { Sound.applause(clamp((overall - 55) / 40, 0.2, 1)); } catch (e) { /* sound is optional */ } }
    setTimeout(() => celebrate({ count: overall != null && overall >= 75 ? 180 : 140 }), 250);
  }, [overall]);
  useEffect(() => {
    if (!sp || Celebrate.pending !== sp.id) return undefined;
    Celebrate.pending = null;
    if (!curtain) { reveal(); return undefined; }
    const t = setTimeout(reveal, 6500);
    return () => clearTimeout(t);
  }, [sp && sp.id]);
  const items = useMemo(() => {
    if (!sp) return [];
    const base = sp.ai ? sp.ai.highlights.map((x) => ({ ...x })) : sp.heur ? sp.heur.marks.map((x) => ({ ...x })) : [];
    const fill = (sp.fillers || []).slice(0, 60).map((f) => ({ start: f.start, end: f.end, kind: 'filler', label: 'Filler: ' + f.word, note: 'Fillers read as uncertainty. Replace this with a one-second silent pause.', pole: 'ethos' }));
    return [...base, ...fill];
  }, [sp && sp.id, !!(sp && sp.ai)]);
  if (!sp) return html`<div className="card empty"><${Icon} name="file" size=${32} /><h2>That analysis isn’t here</h2><p>It may have been deleted.</p><button className="btn" onClick=${() => go('analyze')}>Back to Analyze</button></div>`;
  const idx = speeches.findIndex((s) => s.id === sp.id);
  const prev = idx >= 0 ? speeches[idx + 1] : null;
  const a = sp.ai, h = sp.heur;
  const content = a || h;
  const flags = a ? a.highlights.filter((x) => ['fallacy', 'inconsistency', 'vague', 'weak'].includes(x.kind)) : h ? h.marks.filter((x) => ['fallacy', 'vague', 'weak'].includes(x.kind)) : [];
  const lessonsHere = a ? a.lessons.map((l, i) => ({ ...l, id: sp.id + '_l' + i })) : [];
  const flagGroups = groupFlags(flags, sp.transcript);
  const nextSteps = reportNextSteps(sp, lessonsHere, profile);
  const canUpgrade = !!sp.transcript && !sp.sample && aiState !== 'off' && (!!sp.aiError || (!!sp.heur && aiState === 'ready'));
  async function retryAi() {
    setBusy(true);
    try {
      const raw = await AI.json(analysisPrompt({ transcript: sp.transcript, occasion: sp.occasion, focus: sp.focus, title: sp.title, profile: Store.state.profile, metrics: sp.metrics, delivery: sp.delivery }), { modelTier: 'default', cache: false });
      const ai = normalizeAnalysis(raw);
      const scores = combineScores({ content: ai.scores, delivery: sp.delivery, presence: sp.presence, fillerScore: sp.fillerScore });
      const next = { ...sp, ai, heur: null, aiError: null, scores, archetype: archetypeOf(scores).name };
      Store.updateSpeech(next);
      Store.act((p, ctx) => {
        p.trail = p.trail.map((t) => (t.id === sp.id ? { ...t, e: scores.ethos, p: scores.pathos, l: scores.logos } : t));
        const fold = foldSkills(Store.state.speeches);
        p.skills = fold.skills; p.subs = fold.subs;
        const nl = ai.lessons.map((l, i) => ({ ...l, id: sp.id + '_l' + i, from: sp.id, fromTitle: sp.title, created: Date.now() }));
        p.lessons = [...nl, ...p.lessons.filter((l) => l.from !== sp.id)].slice(0, 30);
        ctx.xp(20, 'Full coach read');
      });
      celebrate({ count: 80 });
    } catch (e) { toast(aiErrorText(e), 'bad'); } finally { setBusy(false); }
  }
  return html`<${Fragment}>
    ${curtain ? html`<${Curtain} play=${true} onDone=${reveal} />` : null}
    <${ReportStage} sp=${sp} prev=${prev} />
    <section className="rpt-next" aria-label="Next step">
      ${nextSteps.map((s, i) => html`<button key=${s.label} type="button" className=${i ? 'btn' : 'btn-cta'} onClick=${() => go(...s.to)}><${Icon} name=${s.icon} size=${i ? 16 : 18} />${s.label}</button>`)}
    </section>
    ${(sp.aiError && sp.transcript && !sp.sample) || canUpgrade ? html`<div className=${'notice' + (sp.aiError ? ' notice-warn' : '')}><${Icon} name=${sp.aiError ? 'alert' : 'info'} size=${18} /><div className="stack" style=${{ gap: 8 }}><span>${sp.aiError ? sp.aiError + ' The content scores below are on-device estimates.' : 'The content scores below are on-device estimates. The AI coach can read the full speech now.'}</span>${canUpgrade ? html`<button className="btn btn-sm" style=${{ justifySelf: 'start' }} disabled=${busy} onClick=${retryAi}>${busy ? html`<span className="spin"></span>` : html`<${Icon} name="refresh" size=${16} />`}Get the full coach read</button>` : null}</div></div>` : null}
    ${!sp.transcript && !sp.sample ? html`<div className="notice"><${Icon} name="info" size=${18} /><span>${aiState === 'off' ? 'This analysis covers delivery only. Add a transcript next time to unlock Logos and the content estimate.' : 'This analysis covers delivery only. Add a transcript next time to unlock Logos, fallacy detection and personal lessons.'}</span></div>` : null}

    ${content && (content.strengths.length || content.growth.length) ? html`<section className="grid-2 rpt-verdicts">
      ${content.strengths.length ? html`<div className="card tablet tablet-good"><div className="eyebrow">Strengths</div><h3>Keep doing this</h3><ul className="list-check">${content.strengths.map((s, i) => html`<li key=${i}><${Icon} name="check" size=${20} style=${{ color: 'var(--good)' }} /><span>${s}</span></li>`)}</ul></div>` : null}
      ${content.growth.length ? html`<div className="card tablet tablet-grow"><div className="eyebrow">Growth</div><h3>${content.growth.length === 1 ? 'Your next move' : `Your next ${content.growth.length} moves`}</h3><ul className="list-check">${content.growth.map((s, i) => html`<li key=${i}><span className="move-n num">${i + 1}</span><span>${s}</span></li>`)}</ul></div>` : null}
    </section>` : null}

    <${DeliverySection} sp=${sp} />

    ${sp.presence ? html`<section className="card stack" style=${{ gap: 14 }}>
      <div className="sec-head"><div><div className="eyebrow">Presence</div><h2>What the camera saw</h2><p className="small muted">${plural(sp.presence.thumbs.length, 'frame')} sampled across your video.</p></div><${Ring} value=${sp.presence.score} size=${84} stroke=${9} color="var(--ethos)" /></div>
      <div className="frames">${sp.presence.thumbs.map((t, i) => html`<img key=${i} src=${t} alt=${'Frame ' + (i + 1)} />`)}</div>
      <ul className="list-check">${sp.presence.observations.map((o, i) => html`<li key=${i}><${Icon} name="eye" size=${20} style=${{ color: 'var(--ethos)' }} /><span>${o}</span></li>`)}</ul>
      ${sp.presence.tip ? html`<div className="fix"><${Icon} name="sparkles" size=${16} style=${{ color: 'var(--good)', flex: 'none' }} /><span>${sp.presence.tip}</span></div>` : null}
    </section>` : null}

    ${a && a.structure.length ? html`<section className="card stack structure-card" style=${{ gap: 16 }}>
      <div className="sec-head"><div><div className="eyebrow">Structure <span className="greek" lang="grc">τάξις</span></div><h2>The shape of your speech</h2><p className="small muted">Each part is a column. Strong parts carry the roof; cracked and missing ones are where it sags.</p></div>
        <div className="legend"><span><i style=${{ background: 'var(--logos)' }}></i>Strong</span><span><i style=${{ background: 'var(--ethos)' }}></i>Solid</span><span><i style=${{ background: 'var(--warn)' }}></i>Weak</span><span><i style=${{ background: 'var(--bad)' }}></i>Missing</span></div></div>
      <${StructureTemple} parts=${a.structure} />
      <div className="structure">${a.structure.map((s, i) => html`<div key=${i} className="struct-part" style=${{ '--vc': VERDICT_COLOR[s.verdict] || 'var(--muted)' }}><span className="row" style=${{ gap: 8 }}><span className="struct-num">${toRoman(i + 1)}</span><span className="verdict">${s.verdict}</span></span><b>${s.part}</b><span className="small muted">${s.note}</span></div>`)}</div>
    </section>` : null}

    ${sp.transcript ? html`<section className="card stack" style=${{ gap: 14 }}>
      <div><div className="eyebrow">Your words</div><h2>Annotated transcript</h2><p className="small muted">${a ? 'Highlights from your coach. Fillers are detected on-device.' : 'On-device highlights. The AI coach adds fallacies, contradictions and rhetorical devices.'}</p></div>
      <${Annotated} text=${sp.transcript} items=${items} />
    </section>` : null}

    ${flagGroups.length ? html`<section className="card stack" style=${{ gap: 14 }}>
      <div><div className="eyebrow" style=${{ color: 'var(--bad)' }}>Content check</div><h2>${plural(flagGroups.length, 'thing', 'things')} a sharp listener would catch</h2></div>
      <div className="grid-2">${flagGroups.map((f, i) => html`<div key=${i} className="flag" style=${{ '--fc': (KIND_META[f.kind] || KIND_META.weak).color }}>
        <div className="row" style=${{ gap: 8 }}><span className="k-dot" style=${{ background: (KIND_META[f.kind] || KIND_META.weak).color }}></span><b>${f.label}</b><span className="chip chip-sm">${(KIND_META[f.kind] || KIND_META.weak).label}</span>${f.count > 1 ? html`<span className="tiny muted num">${f.count} times</span>` : null}</div>
        ${f.quotes.slice(0, 4).map((q) => html`<blockquote key=${q}>“${q}”</blockquote>`)}
        ${f.quotes.length > 4 ? html`<span className="tiny muted">and ${f.quotes.length - 4} more, highlighted in your transcript above</span>` : null}
        <span className="small" style=${{ color: 'var(--ink-2)' }}>${f.note}</span>
        ${f.fix ? html`<div className="fix"><${Icon} name="check" size=${16} style=${{ color: 'var(--good)', flex: 'none', marginTop: 1 }} /><span>${f.fix}</span></div>` : null}
      </div>`)}</div>
    </section>` : null}

    ${lessonsHere.length ? html`<section className="stack">
      <div className="sec-head"><div><div className="eyebrow">Written for you</div><h2>Lessons from this speech</h2></div></div>
      <div className="grid-3">${lessonsHere.map((l) => html`<button key=${l.id} className="tile-btn" style=${{ '--tc': (POLES[l.pole] || POLES.logos).color }} onClick=${() => go('lesson', l.id)}>
        <div className="row-between"><${PoleChip} pole=${l.pole} /><span className="quest-xp">+40 XP</span></div>
        <h3>${l.title}</h3><span className="small muted">${l.why}</span>
        <span className="row small" style=${{ fontWeight: 700, color: (POLES[l.pole] || POLES.logos).color }}>Start lesson<${Icon} name="arrowR" size=${16} /></span>
      </button>`)}</div>
    </section>` : null}

    <section className="row rpt-actions">
      <button className="btn" onClick=${() => offerDownload((sp.title || 'speech').replace(/[^\w -]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '-report.md', reportMarkdown(sp))}><${Icon} name="download" size=${16} />Download report</button>
      <button className="btn" onClick=${() => go('analyze')}><${Icon} name="plus" size=${16} />Analyze another</button>
      ${!sp.sample ? html`<button className="btn" onClick=${() => setPoster(true)}><${Icon} name="image" size=${16} />Make my poster</button>` : null}
      ${aiState !== 'off' ? html`<button className="btn" onClick=${() => Router.coach('I just got my report for “' + sp.title + '”. What should I practice first?')}><${Icon} name="message" size=${16} />Ask the coach about it</button>` : null}
      ${!sp.sample ? (confirmDel ? html`<span className="row"><span className="small">Delete this analysis for good?</span><button className="btn btn-sm" style=${{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick=${() => { Store.deleteSpeech(sp.id); toast('Analysis deleted'); go('analyze'); }}>Delete</button><button className="btn btn-sm btn-ghost" onClick=${() => setConfirmDel(false)}>Cancel</button></span>`
        : html`<button className="btn btn-ghost" onClick=${() => setConfirmDel(true)}><${Icon} name="trash" size=${16} />Delete</button>`) : null}
    </section>
    ${poster ? html`<${PosterModal} onClose=${() => setPoster(false)} />` : null}
  <//>`;
}
