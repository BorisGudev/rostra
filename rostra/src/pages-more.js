/* ================================================================
   Pages: Prepare, Learn, Lesson, Arcade, Library, Trophies, Coach
   ================================================================ */

/* ---------- Prepare ---------- */
const STAGES = [['brief', t('Brief')], ['angles', t('Angles')], ['build', t('Build')], ['finish', t('Finish')]];
function draftText(prep, labels) {
  return (prep.sections || []).filter((s) => (s.text || '').trim()).map((s) => (labels ? `[${s.name}]\n` : '') + s.text.trim()).join('\n\n');
}
function newPrep(profile) {
  return { id: uid('p_'), type: 'prep', created: Date.now(), stage: 'brief', brief: { occasion: profile.goal || 'presentation', title: '', audience: '', goal: '', minutes: 5, material: '', stories: '' }, angles: [], questions: [], angle: null, core: '', sections: [], pitfalls: [], slides: [], done: false };
}
function normAngles(raw) {
  const list = (raw && Array.isArray(raw.angles) ? raw.angles : []).slice(0, 3).map((a) => {
    const mix = a.mix || {};
    const tot = POLE_KEYS.reduce((s, k) => s + (Number(mix[k]) || 0), 0) || 100;
    const m = {}; POLE_KEYS.forEach((k) => { m[k] = Math.round(((Number(mix[k]) || 0) / tot) * 100); });
    return { name: String(a.name || t('An angle')), approach: String(a.approach || ''), thesis: String(a.thesis || ''), beats: (a.beats || []).map(String).slice(0, 7), mix: m, fits: String(a.fits || ''), risk: String(a.risk || '') };
  });
  return list.length === 3 ? list : null;
}
function fallbackSections(angle, minutes) {
  const total = (minutes || 5) * 60;
  return angle.beats.map((b, i) => {
    const sc = BEAT_SCAFFOLD[b] || { pole: POLE_KEYS[i % 3], purpose: t('Move the audience one step closer to your big idea.'), technique: t('One point, one example.'), frame: t('[Your point], because [reason]. For example, [example].'), prompts: [t('What is the single point of this part?'), t('What example proves it?')] };
    return { id: uid('sec'), name: b, ...sc, seconds: Math.round(total / angle.beats.length / 5) * 5 || 30, text: '', feedback: null, nudge: null };
  });
}
function mixToScores(mix) { const mx = Math.max(...POLE_KEYS.map((k) => mix[k] || 0)) || 1; const o = {}; POLE_KEYS.forEach((k) => { o[k] = Math.round(((mix[k] || 0) / mx) * 92); }); return o; }
const prepArr = (v) => (Array.isArray(v) ? v : []);
const PREP_BRIEF_CAPS = { material: 40000, stories: 8000 };
function prepCapBrief(k, v) { return PREP_BRIEF_CAPS[k] && typeof v === 'string' ? v.slice(0, PREP_BRIEF_CAPS[k]) : v; }
const prepWrittenCount = (prep) => prepArr(prep && prep.sections).filter((s) => (s.text || '').trim()).length;
/* Keeps the last three outlines that held written text, so a new angle never destroys work. */
function prepArchiveSections(cur) {
  if (!prepWrittenCount(cur)) return { sectionsArchive: prepArr(cur.sectionsArchive) };
  return { sectionsArchive: [...prepArr(cur.sectionsArchive), { angle: cur.angle || null, sections: cur.sections, core: cur.core || '', pitfalls: prepArr(cur.pitfalls), at: Date.now() }].slice(-3) };
}
function prepRestoreSections(cur, i) {
  const list = prepArr(cur.sectionsArchive);
  const item = list[i];
  if (!item) return {};
  const rest = list.filter((_, j) => j !== i);
  const angleIdx = item.angle ? prepArr(cur.angles).findIndex((a) => a.name === item.angle.name) : -1;
  return { ...prepArchiveSections({ ...cur, sectionsArchive: rest }), angle: item.angle, sections: item.sections, core: item.core || '', pitfalls: prepArr(item.pitfalls), angleIdx: angleIdx >= 0 ? angleIdx : null, stage: 'build' };
}
/* Finish asks for half the target length, so a few lines can't collect the biggest Prepare reward. */
const prepHalfTarget = (minutes) => Math.ceil(((minutes || 5) * 140) / 2);
const prepCanFinish = (words, minutes) => words >= prepHalfTarget(minutes);
/* A full teleprompter run: counts every time, pays once per day per draft. */
function prepRehearsal(cur, day) {
  const days = prepArr(cur.rehearsedDays);
  const pay = !days.includes(day);
  return { pay, patch: { rehearsals: (Number(cur.rehearsals) || 0) + 1, rehearsedDays: pay ? [...days, day].slice(-60) : days } };
}

function PrepList() {
  const { preps, profile, ai } = useStore();
  const start = () => { const p = Store.savePrep(newPrep(profile)); go('prepare', p.id); };
  return html`<${Fragment}>
    <${PageHead} label=${t('Prepare')} greek="παρασκευή" title=${t('Write it in your own voice')} fig="anaphora" mark=${[t('Your')]} line=${t('Your angle. Your words. Your voice. Rostra coaches every section and writes none of them.')} end=${html`<button className="btn-cta" onClick=${start}><${Icon} name="plus" size=${18} />${t('New speech')}</button>`} />
    <div className="grid-3">
      ${[[t('Brief'), t('Set out the occasion, the audience and what you want them to do.'), 'file'], [t('Angles'), t('Choose from three different approaches, each tuned to your triangle.'), 'triangle'], [t('Build'), ai === 'off' ? t('Write each section yourself, with prompts and sentence frames.') : t('Write each section yourself, with prompts, frames and live coaching.'), 'pen']].map(([ti, d, ic], i) => html`<div key=${ti} className="card" style=${{ display: 'grid', gap: 8 }}>
        <span className="tile-ic"><${Icon} name=${ic} /></span><h3>${ti}</h3><p className="small muted">${d}</p></div>`)}
    </div>
    <section className="card">
      <div className="card-head"><div><div className="eyebrow">${t('Your drafts')}</div><h2>${preps.length ? tn(preps.length, 'speech', 'speeches') : t('No drafts yet')}</h2></div></div>
      ${preps.length ? preps.map((p) => html`<button key=${p.id} className="list-item" onClick=${() => go('prepare', p.id)}>
        <span className="tile-ic"><${Icon} name=${p.done ? 'check' : 'pen'} /></span>
        <span style=${{ minWidth: 0 }}><span className="li-title" style=${{ display: 'block' }}>${p.brief.title || t('Untitled speech')}</span><span className="small muted">${occasionOf(p.brief.occasion).label} · ${p.done ? t('Finished') : t`Stage: ${(STAGES.find((s) => s[0] === p.stage) || STAGES[0])[1]}`} · ${fmtDate(p.updated || p.created)}</span></span>
        <${Icon} name="chevR" />
      </button>`) : html`<div className="empty"><${Icon} name="pen" size=${30} /><p>${t('Start a new speech and your drafts will live here.')}</p><button className="btn" onClick=${start}>${t('Start a speech')}</button></div>`}
    </section>
  <//>`;
}

function PrepEditor({ id }) {
  const { preps, profile, speeches, ai } = useStore();
  const prep = preps.find((p) => p.id === id);
  const [busy, setBusy] = useState('');
  const [prompter, setPrompter] = useState(false);
  const [labels, setLabels] = useState(true);
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmAngle, setConfirmAngle] = useState(false);
  if (!prep) return html`<div className="card empty"><h2>${t('That draft isn’t here')}</h2><button className="btn" onClick=${() => go('prepare')}>${t('All drafts')}</button></div>`;
  const update = (patch) => { const cur = Store.state.preps.find((p) => p.id === id) || prep; Store.savePrep({ ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) }); };
  const setBrief = (k, v) => update((cur) => ({ brief: { ...cur.brief, [k]: prepCapBrief(k, v) } }));
  const setSection = (sid, patch) => update((cur) => ({ sections: cur.sections.map((s) => (s.id === sid ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s)) }));
  const b = prep.brief;
  const stageIdx = STAGES.findIndex((s) => s[0] === prep.stage);
  const reached = (i) => i <= Math.max(stageIdx, prep.sections.length ? 3 : prep.angles.length ? 1 : 0);

  async function findAngles() {
    setBusy('angles');
    try {
      let angles = null, questions = null;
      if (ai !== 'off') {
        try { const raw = await AI.json(anglesPrompt(b, profile, speeches), { cache: false }); angles = normAngles(raw); questions = prepArr(raw && raw.questions).map(String).slice(0, 3); }
        catch (e) { toast(aiErrorText(e) + ' ' + t('Using classic angles instead.'), 'warn'); }
      }
      if (!angles) { angles = clone(FALLBACK_ANGLES); questions = [t('What moment made you care about this topic?'), t('What does your audience believe right now that you want to change?'), t('If they remember one sentence tomorrow, what should it be?')]; }
      update({ angles, questions: questions.map((q) => ({ q, a: '' })), stage: 'angles', angleIdx: null });
      if (!prep.briefRewarded) { update({ briefRewarded: true }); Store.act((p, ctx) => ctx.xp(10, t('Brief written'))); }
    } finally { setBusy(''); }
  }
  async function buildOutline(confirmed) {
    const angle = prep.angles[prep.angleIdx];
    if (!angle) return;
    const keep = (prep.sections || []).some((s) => (s.text || '').trim());
    if (keep && prep.angle && prep.angle.name === angle.name) { setConfirmAngle(false); update({ stage: 'build' }); return; }
    if (keep && confirmed !== true) { setConfirmAngle(true); return; }
    setConfirmAngle(false);
    setBusy('outline');
    try {
      let sections = null, core = '', pitfalls = [];
      if (ai !== 'off') {
        try {
          const raw = await AI.json(outlinePrompt({ ...prep, angle }, profile, speeches), { cache: false });
          sections = prepArr(raw && raw.sections).slice(0, 8).map((s) => ({ id: uid('sec'), name: String(s.name || t('Section')), pole: POLE_KEYS.includes(s.pole) ? s.pole : 'logos', seconds: clamp(Math.round(Number(s.seconds) || 45), 10, 900), purpose: String(s.purpose || ''), technique: String(s.technique || ''), frame: String(s.frame || ''), prompts: prepArr(s.prompts).map(String).slice(0, 3), text: '', feedback: null, nudge: null }));
          core = String(raw.core || ''); pitfalls = prepArr(raw.pitfalls).map(String).slice(0, 3);
          if (!sections.length) sections = null;
        } catch (e) { sections = null; toast(aiErrorText(e) + ' ' + t('Using a classic scaffold instead.'), 'warn'); }
      }
      if (!sections) sections = fallbackSections(angle, b.minutes);
      update((cur) => ({ ...(keep ? prepArchiveSections(cur) : null), angle, sections, core: core || cur.core || '', pitfalls, stage: 'build' }));
    } finally { setBusy(''); }
  }
  function restoreSections(i) { update((cur) => prepRestoreSections(cur, i)); toast(t('Your earlier sections are back.')); }
  async function coachSection(sec) {
    setBusy('coach' + sec.id);
    try {
      const raw = await AI.json(sectionPrompt({ ...prep, core: prep.core }, sec), { cache: false });
      const fb = { scores: {}, verdict: String(raw.verdict || ''), keep: String(raw.keep || ''), improve: String(raw.improve || ''), question: String(raw.question || ''), flags: prepArr(raw.flags).slice(0, 3).map((f) => ({ quote: String(f.quote || ''), issue: String(f.issue || ''), note: String(f.note || '') })) };
      POLE_KEYS.forEach((k) => { fb.scores[k] = clamp(Math.round(scoreOr(raw.scores && raw.scores[k], 50)), 0, 100); });
      setSection(sec.id, { feedback: fb, coached: true });
      if (!sec.coached) Store.act((p, ctx) => ctx.xp(10, t('Section coached')));
    } catch (e) { toast(aiErrorText(e), 'bad'); }
    finally { setBusy(''); }
  }
  async function nudge(sec) {
    if (ai === 'off') { setSection(sec.id, { nudge: { questions: prepArr(sec.prompts), starters: [] } }); return; }
    setBusy('nudge' + sec.id);
    try {
      const raw = await AI.json(nudgePrompt({ ...prep, core: prep.core }, sec), { modelTier: 'quick', cache: false });
      setSection(sec.id, { nudge: { questions: prepArr(raw.questions).map(String).slice(0, 2), starters: prepArr(raw.starters).map(String).slice(0, 3) } });
    } catch (e) { toast(aiErrorText(e), 'bad'); }
    finally { setBusy(''); }
  }
  function onWrite(sec, value) {
    setSection(sec.id, { text: value });
    if (!sec.rewarded && wordsOf(value).length >= 12) {
      setSection(sec.id, { rewarded: true });
      Store.act((p, ctx) => { ctx.xp(15, t('Section drafted')); ctx.quest('forge'); });
    }
  }
  async function makeSlides() {
    const draft = draftText(prep, true);
    const draftN = wordsOf(draftText(prep, false)).length;
    if (draftN < 40) { toast(t`Slides need at least 40 words. You have ${draftN}.`, 'warn'); return; }
    setBusy('slides');
    try {
      let slides = null;
      if (ai !== 'off') {
        try { const raw = await AI.json(slidesPrompt(prep, draft), { cache: false }); slides = prepArr(raw && raw.slides).slice(0, 14).map((s) => ({ title: String(s.title || ''), visual: String(s.visual || ''), text: String(s.text || ''), notes: String(s.notes || ''), pole: POLE_KEYS.includes(s.pole) ? s.pole : 'logos' })); }
        catch (e) { slides = null; toast(aiErrorText(e) + ' ' + t('Building a simple outline instead.'), 'warn'); }
      }
      if (!slides || !slides.length) slides = [{ title: b.title || t('Title'), visual: t('One striking photo related to your opening'), text: prep.core || '', notes: t('Pause. Let the image land before you speak.'), pole: 'pathos' }, ...prep.sections.filter((s) => s.text).map((s) => ({ title: s.name, visual: s.technique || t('A simple supporting image'), text: (s.text.match(/[^.!?]+[.!?]/) || [s.text])[0].trim().split(/\s+/).slice(0, 12).join(' '), notes: s.purpose, pole: s.pole }))];
      update({ slides });
    } finally { setBusy(''); }
  }
  function rehearsed() {
    const cur = Store.state.preps.find((x) => x.id === id) || prep;
    const out = prepRehearsal(cur, dayKey());
    update(out.patch);
    if (out.pay) { Store.act((p, ctx) => ctx.xp(25, t('Rehearsed your speech'))); toast(t('Full rehearsal done. +25 XP.'), 'gold'); }
    else toast(t('Full rehearsal done. You already earned today’s XP for this draft.'));
  }
  function finish() {
    if (prep.done || !prepCanFinish(wordsOf(draftText(prep, false)).length, b.minutes)) return;
    update({ done: true });
    Store.act((p, ctx) => { p.stats.preps += 1; ctx.xp(150, t('Speech finished')); });
    celebrate({ count: 160 });
  }
  const draft = draftText(prep, labels);
  const draftWords = wordsOf(draftText(prep, false)).length;
  const targetWords = (b.minutes || 5) * 140;
  const fbScores = prep.sections.filter((s) => s.feedback).map((s) => s.feedback.scores);
  const predicted = fbScores.length ? { ethos: Math.round(mean(fbScores.map((s) => s.ethos))), pathos: Math.round(mean(fbScores.map((s) => s.pathos))), logos: Math.round(mean(fbScores.map((s) => s.logos))) } : null;
  const stepper = html`<div className="stepper" role="tablist" aria-label=${t('Speech preparation stages')}>${STAGES.map(([k, lab], i) => html`<button key=${k} role="tab" aria-selected=${prep.stage === k} disabled=${!reached(i)} className=${(prep.stage === k ? 'is-on ' : '') + (i < stageIdx ? 'ok' : '')} onClick=${() => update({ stage: k })}><b>${i < stageIdx ? html`<${Icon} name="check" size=${13} stroke=${3} />` : i + 1}</b>${lab}</button>`)}</div>`;

  return html`<${Fragment}>
    <div className="sec-head">
      <div style=${{ minWidth: 0 }}><div className="eyebrow">${t`Prepare · ${occasionOf(b.occasion).label}`} <span className="greek" lang="grc">παρασκευή</span></div><h1>${b.title || t('Untitled speech')}</h1></div>
      <div className="row">${confirmDel ? html`<span className="row"><span className="small">${t('Delete this draft?')}</span><button className="btn btn-sm" style=${{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick=${() => { Store.deletePrep(prep.id); go('prepare'); }}>${t('Delete')}</button><button className="btn btn-sm btn-ghost" onClick=${() => setConfirmDel(false)}>${t('Cancel')}</button></span>` : html`<button className="btn btn-ghost btn-sm" onClick=${() => setConfirmDel(true)}><${Icon} name="trash" size=${16} />${t('Delete draft')}</button>`}</div>
    </div>
    ${stepper}

    ${prep.stage === 'brief' ? html`<section className="card stack" style=${{ gap: 16 }}>
      <div><h2>${t('The brief')}</h2><p className="small muted">${t('The more you give, the more the angles sound like you. Rough notes are perfect.')}</p></div>
      <div className="grid-2">
        <div className="field"><label htmlFor="pb-title">${t('Working title')}</label><input id="pb-title" className="input" value=${b.title} onInput=${(e) => setBrief('title', e.target.value)} placeholder=${t('e.g. Why our team should ship weekly')} /></div>
        <div className="field"><label htmlFor="pb-aud">${t('Audience')}</label><input id="pb-aud" className="input" value=${b.audience} onInput=${(e) => setBrief('audience', e.target.value)} placeholder=${t('Who will be in the room? What do they care about?')} /></div>
      </div>
      <div className="field"><span className="label">${t('Occasion')}</span><div className="row" style=${{ gap: 6 }}>${OCCASIONS.map((o) => html`<button key=${o.id} className="chip" aria-pressed=${b.occasion === o.id} onClick=${() => setBrief('occasion', o.id)}>${o.label}</button>`)}</div></div>
      <div className="field"><label htmlFor="pb-goal">${t('What should they think, feel or do afterwards?')}</label><textarea id="pb-goal" className="textarea" rows="2" value=${b.goal} onInput=${(e) => setBrief('goal', e.target.value)} placeholder=${t('e.g. Approve a two-week pilot of weekly releases')}></textarea></div>
      <div className="field"><label htmlFor="pb-min">${t`Length: ${b.minutes} min · about ${(b.minutes * 140).toLocaleString()} words`}</label><input id="pb-min" type="range" min="1" max="30" value=${b.minutes} onInput=${(e) => setBrief('minutes', Number(e.target.value))} style=${{ accentColor: 'var(--pathos)' }} /></div>
      <div className="field"><label htmlFor="pb-mat">${t('Your raw material')}</label><textarea id="pb-mat" className="textarea" rows="5" value=${b.material} onInput=${(e) => setBrief('material', e.target.value)} placeholder=${t('Facts, numbers, arguments, half-formed ideas. Bullet points are fine.')}></textarea>${(b.material || '').length >= PREP_BRIEF_CAPS.material ? html`<span className="hint">${t('You’ve reached the 40,000-character limit, so anything past it was cut.')}</span>` : null}</div>
      <div className="field"><label htmlFor="pb-sto">${t('Personal stories you could use')}</label><textarea id="pb-sto" className="textarea" rows="3" value=${b.stories} onInput=${(e) => setBrief('stories', e.target.value)} placeholder=${t('A moment, a customer, a failure, a conversation. One line each.')}></textarea>${(b.stories || '').length >= PREP_BRIEF_CAPS.stories ? html`<span className="hint">${t('You’ve reached the 8,000-character limit, so anything past it was cut.')}</span>` : null}</div>
      <div className="row"><button className="btn-cta" disabled=${busy === 'angles' || !(b.goal.trim() || b.material.trim() || b.title.trim())} onClick=${findAngles}>${busy === 'angles' ? html`<span className="spin"></span>${t('Finding your angles…')}` : html`<${Icon} name="sparkles" size=${18} />${t('Find my angles')}`}</button><span className="hint">${ai === 'off' ? t('AI coach unavailable here: you’ll get three classic angles.') : t('Your coach reads your profile and proposes three different approaches.')}</span></div>
    </section>` : null}

    ${prep.stage === 'angles' ? html`<section className="stack">
      <div><h2>${t('Choose your angle')}</h2><p className="small muted">${t('Three different ways in. Each one leans on a different mix of ethos, pathos and logos.')}</p></div>
      <div className="grid-3">${prep.angles.map((a, i) => html`<button key=${i} className=${'angle' + (prep.angleIdx === i ? ' is-on' : '')} onClick=${() => { setConfirmAngle(false); update({ angleIdx: i }); }} aria-pressed=${prep.angleIdx === i}>
        <div className="row-between" style=${{ alignItems: 'flex-start' }}><div style=${{ minWidth: 0 }}><span className="chip chip-sm">${a.approach}</span><h3 style=${{ marginTop: 8 }}>${a.name}</h3></div><${MiniTriangle} scores=${mixToScores(a.mix)} size=${54} /></div>
        <p className="small" style=${{ color: 'var(--ink-2)' }}>${a.thesis}</p>
        <div className="row tiny num" style=${{ gap: 10, fontWeight: 700 }}>${POLE_KEYS.map((k) => html`<span key=${k} style=${{ color: POLES[k].color }}>${POLES[k].name} ${a.mix[k]}%</span>`)}</div>
        <ol className="beats">${a.beats.map((x, j) => html`<li key=${j}>${x}</li>`)}</ol>
        ${a.fits ? html`<p className="tiny"><b>${t('Why it fits you:')}</b> ${a.fits}</p>` : null}
        ${a.risk ? html`<p className="tiny muted"><b>${t('Watch out:')}</b> ${a.risk}</p>` : null}
      </button>`)}</div>
      <div className="card stack" style=${{ gap: 12 }}>
        <div><h3>${t('Sharpen your thinking')}</h3><p className="small muted">${t('Optional. Your answers shape the outline. The best material is already in your head.')}</p></div>
        ${prep.questions.map((q, i) => html`<div key=${i} className="field"><label htmlFor=${'pq' + i}>${q.q}</label><textarea id=${'pq' + i} className="textarea" rows="2" style=${{ minHeight: 64 }} value=${q.a} onInput=${(e) => { const v = e.target.value; update((cur) => ({ questions: cur.questions.map((x, j) => (j === i ? { ...x, a: v } : x)) })); }}></textarea></div>`)}
        <div className="row"><button className="btn-cta" disabled=${prep.angleIdx == null || busy === 'outline'} onClick=${buildOutline}>${busy === 'outline' ? html`<span className="spin"></span>${t('Building your outline…')}` : html`<${Icon} name="pen" size=${18} />${t('Build my outline')}`}</button>
          <button className="btn" disabled=${busy === 'angles'} onClick=${findAngles}>${busy === 'angles' ? html`<span className="spin"></span>` : html`<${Icon} name="refresh" size=${16} />`}${t('Show 3 new angles')}</button>
          ${prep.angleIdx == null ? html`<span className="hint">${t('Pick an angle first.')}</span>` : null}</div>
        ${confirmAngle && prep.angleIdx != null ? html`<${PrepAngleConfirm} count=${prepWrittenCount(prep)} onReplace=${() => buildOutline(true)} onKeep=${() => setConfirmAngle(false)} />` : null}
      </div>
    </section>` : null}

    ${prep.stage === 'build' ? html`<section className="stack">
      <div className="card" style=${{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 18, alignItems: 'center' }}>
        <div className="stack" style=${{ gap: 10 }}>
          <div className="field"><label htmlFor="pc-core">${t('Your big idea, in one sentence')}</label><input id="pc-core" className="input" style=${{ fontSize: 17, fontWeight: 600 }} value=${prep.core || ''} onInput=${(e) => update({ core: e.target.value })} placeholder=${t('The one thing they should remember tomorrow')} /><span className="hint">${prep.core ? t`${wordsOf(prep.core).length} words` + (wordsOf(prep.core).length > 18 ? ' ' + t('· aim for 15 or fewer') : '') : t('State a point of view: “remote teams need fewer meetings”.')} ${prep.angle ? t`· Angle: ${prep.angle.name}` : ''}</span></div>
          <div><div className="row-between small"><b>${t('Draft length')}</b><span className="num muted">${draftWords.toLocaleString()} / ~${targetWords.toLocaleString()} words</span></div><${Bar} value=${(draftWords / targetWords) * 100} color="var(--pathos)" /></div>
          ${prep.pitfalls && prep.pitfalls.length ? html`<div className="notice notice-warn"><${Icon} name="alert" size=${18} /><span><b>${t('Traps for this speech:')}</b> ${prep.pitfalls.join(' · ')}</span></div>` : null}
        </div>
        ${predicted ? html`<div style=${{ display: 'grid', justifyItems: 'center', gap: 4 }}><${MiniTriangle} scores=${predicted} size=${96} /><span className="tiny muted">${t('Coached so far')}</span><span className="mini-scores tiny">${POLE_KEYS.map((k) => html`<span key=${k} style=${{ color: POLES[k].color }}>${predicted[k]}</span>`)}</span></div>` : null}
      </div>
      ${prep.sections.map((s, i) => {
        const w = wordsOf(s.text).length, secs = Math.round((w / 140) * 60);
        return html`<div key=${s.id} className="section-card" style=${{ borderLeft: `4px solid ${POLES[s.pole] ? POLES[s.pole].color : 'var(--line)'}` }}>
          <div className="row-between"><div className="row" style=${{ gap: 8 }}><span className="eyebrow">${t`${i + 1} of ${prep.sections.length}`}</span><h3>${s.name}</h3><${PoleChip} pole=${s.pole} /></div><span className="tiny muted num">${secs}s / ~${s.seconds}s</span></div>
          ${s.purpose ? html`<p className="small" style=${{ color: 'var(--ink-2)' }}>${s.purpose}</p>` : null}
          ${s.technique ? html`<p className="small"><${Icon} name="sparkles" size=${14} style=${{ color: 'var(--gold)', verticalAlign: '-2px' }} /> <b>${t('Technique:')}</b> ${s.technique}</p>` : null}
          ${s.frame ? html`<div className="frame"><span className="eyebrow" style=${{ display: 'block', marginBottom: 4, fontFamily: 'var(--font-inscr)' }}>${t('Sentence frame')}</span>${s.frame}</div>` : null}
          ${s.prompts && s.prompts.length ? html`<ul className="prompts">${s.prompts.map((q, j) => html`<li key=${j}>${q}</li>`)}</ul>` : null}
          <textarea className="textarea" rows="5" value=${s.text} onInput=${(e) => onWrite(s, e.target.value)} placeholder=${t('Write it in your own words. Rough is fine.')} aria-label=${t`Your text for ${s.name}`}></textarea>
          <div className="row">
            ${ai !== 'off' ? html`<button className="btn btn-sm btn-ink" disabled=${wordsOf(s.text).length < 8 || busy === 'coach' + s.id} onClick=${() => coachSection(s)}>${busy === 'coach' + s.id ? html`<span className="spin"></span>${t('Coaching…')}` : html`<${Icon} name="sparkles" size=${15} />${t('Coach this section')}`}</button>` : null}
            <button className="btn btn-sm" disabled=${busy === 'nudge' + s.id} onClick=${() => nudge(s)}>${busy === 'nudge' + s.id ? html`<span className="spin"></span>` : html`<${Icon} name="bolt" size=${15} />`}${t('I’m stuck')}</button>
            <span className="tiny muted">${w ? tn(w, 'word', 'words') : ''}${!s.rewarded ? ' ' + t('· +15 XP for your first draft of this section') : ''}</span>
          </div>
          ${ai === 'off' ? html`<p className="hint">${t('Section coaching needs the AI coach. “I’m stuck” still gives you prompts.')}</p>` : null}
          ${s.nudge ? html`<div className="feedback">
            <div className="row-between"><b>${t('A way in')}</b><button className="btn btn-ghost btn-sm btn-icon" onClick=${() => setSection(s.id, { nudge: null })} aria-label=${t('Dismiss')}><${Icon} name="x" size=${15} /></button></div>
            ${s.nudge.questions.map((q, j) => html`<span key=${j}>• ${q}</span>`)}
            ${s.nudge.starters.length ? html`<div className="row" style=${{ gap: 6 }}>${s.nudge.starters.map((st, j) => html`<button key=${j} className="chip chip-sm" onClick=${() => onWrite(s, (s.text ? s.text.trimEnd() + ' ' : '') + st.replace(/…$/, ''))} title=${t('Use this opening')}>${st}</button>`)}</div>` : null}
          </div>` : null}
          ${s.feedback ? html`<div className="feedback">
            <div className="row-between"><b>${s.feedback.verdict}</b><span className="mini-scores small">${POLE_KEYS.map((k) => html`<span key=${k} style=${{ color: POLES[k].color }}>${POLES[k].name[0]} ${s.feedback.scores[k]}</span>`)}</span></div>
            ${s.feedback.keep ? html`<span><b style=${{ color: 'var(--good)' }}>${t('Keep:')}</b> ${s.feedback.keep}</span>` : null}
            ${s.feedback.improve ? html`<span><b style=${{ color: 'var(--pathos)' }}>${t('Improve:')}</b> ${s.feedback.improve}</span>` : null}
            ${s.feedback.flags.map((f, j) => html`<span key=${j} className="small"><span className="chip chip-sm chip-bad">${f.issue}</span> “${f.quote}” ${f.note}</span>`)}
            ${s.feedback.question ? html`<span className="small muted"><b>${t('Think about:')}</b> ${s.feedback.question}</span>` : null}
          </div>` : null}
        </div>`;
      })}
      ${prepArr(prep.sectionsArchive).length ? html`<div className="card stack" style=${{ gap: 8 }}>
        <div><div className="eyebrow">${t('Earlier outlines')}</div><p className="small muted">${t('Your text from other angles. Restoring one puts it back here and keeps what you have now in this list.')}</p></div>
        ${prep.sectionsArchive.map((a, i) => html`<div key=${a.at || i} className="row-between"><span className="small"><b>${a.angle ? a.angle.name : t('Earlier outline')}</b> · ${tn(wordsOf(prepArr(a.sections).map((s) => s.text || '').join(' ')).length, 'word', 'words')}</span><button className="btn btn-sm" onClick=${() => restoreSections(i)}><${Icon} name="refresh" size=${15} />${t('Restore these sections')}</button></div>`)}
      </div>` : null}
      <div className="row"><button className="btn-cta" disabled=${draftWords < 20} onClick=${() => update({ stage: 'finish' })}><${Icon} name="check" size=${18} />${t('Assemble my speech')}</button><span className="hint">${draftWords < 20 ? t('Write at least 20 words to assemble.') : t('You can come back and keep editing.')}</span></div>
    </section>` : null}

    ${prep.stage === 'finish' ? html`<section className="stack">
      <div className="card stack" style=${{ gap: 14 }}>
        <div className="row-between"><div><h2>${t('Your speech')}</h2><p className="small muted num">${t`${draftWords.toLocaleString()} words · about ${Math.max(1, Math.round(draftWords / 140))} min at 140 wpm · target ${b.minutes} min`}</p></div>
          <label className="row small" style=${{ gap: 6 }}><input type="checkbox" checked=${labels} onChange=${(e) => setLabels(e.target.checked)} />${t('Show section labels')}</label></div>
        ${prep.core ? html`<div className="notice notice-gold"><${Icon} name="star" size=${18} /><span><b>${t('Big idea:')}</b> ${prep.core}</span></div>` : null}
        <div className="transcript" style=${{ fontSize: 16 }}>${draft || t('Nothing written yet.')}</div>
        <div className="row">
          <button className="btn-cta" onClick=${() => setPrompter(true)} disabled=${!draftWords}><${Icon} name="play" size=${18} />${t('Rehearse')}</button>
          <button className="btn" onClick=${() => go('analyze', { text: draftText(prep, false), title: b.title, occasion: b.occasion })}><${Icon} name="scale" size=${16} />${t('Analyze this draft')}</button>
          <button className="btn" onClick=${() => offerDownload((b.title || 'speech').replace(/[^\w -]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.md', prepMarkdown(prep))}><${Icon} name="download" size=${16} />${t('Download')}</button>
          <button className="btn" onClick=${() => update({ stage: 'build' })}><${Icon} name="pen" size=${16} />${t('Keep editing')}</button>
        </div>
      </div>
      <div className="card stack" style=${{ gap: 14 }}>
        <div className="row-between"><div><div className="eyebrow">${t('The presentation')}</div><h2>${t('Slide outline')}</h2><p className="small muted">${t('One idea per slide. Slides support you; they don’t repeat the script.')}</p></div>
          <button className="btn btn-ink" disabled=${busy === 'slides'} onClick=${makeSlides}>${busy === 'slides' ? html`<span className="spin"></span>${t('Designing…')}` : html`<${Icon} name="slides" size=${16} />${prep.slides && prep.slides.length ? t('Regenerate slides') : t('Generate slides')}`}</button></div>
        ${prep.slides && prep.slides.length ? html`<div className="slides">${prep.slides.map((s, i) => html`<div key=${i} className="slide" style=${{ '--sc': POLES[s.pole] ? POLES[s.pole].color : 'var(--ink)' }}>
          <span className="slide-n">${i + 1}</span>
          <div style=${{ paddingLeft: 8, display: 'grid', gap: 4 }}><div className="slide-title">${s.title}</div>${s.text ? html`<div className="slide-text">${s.text}</div>` : null}</div>
          <div style=${{ paddingLeft: 8, display: 'grid', gap: 2 }}><div className="slide-vis">${t`Visual: ${s.visual}`}</div><div className="tiny" style=${{ color: 'var(--ink-2)' }}>${t`Say: ${s.notes}`}</div></div>
        </div>`)}</div>` : html`<p className="hint">${t('Generate a slide outline from your draft. Slides are included when you download.')}</p>`}
      </div>
      <div className="card row-between">
        <div><h3>${prep.done ? t('Finished. Now go deliver it.') : t('Ready to call it done?')}</h3><p className="small muted">${prep.done ? t('After you give it, record it and bring it to Analyze. Your script comes with you.') : prepCanFinish(draftWords, b.minutes) ? t('Finishing earns 150 XP and the Speechwright badge on your first one.') : t`${tn(prepHalfTarget(b.minutes) - draftWords, 'more word', 'more words')} to reach half your target.`}</p><p className="tiny muted">${prep.rehearsals ? t`Rehearsed ${tn(prep.rehearsals, 'time', 'times')}` + ' · ' : ''}${t('A full teleprompter run earns 25 XP, once a day for each draft.')}</p></div>
        ${prep.done ? html`<button className="btn" onClick=${() => go('analyze', { text: draftText(prep, false), title: b.title, occasion: b.occasion })}><${Icon} name="mic" size=${16} />${t('Analyze my recording')}</button>` : html`<button className="btn-cta gold" disabled=${!prepCanFinish(draftWords, b.minutes)} onClick=${finish}><${Icon} name="trophy" size=${18} />${t('Finish speech · +150 XP')}</button>`}
      </div>
    </section>` : null}
    ${prompter ? html`<${Prompter} text=${draftText(prep, false)} onClose=${() => setPrompter(false)} onComplete=${rehearsed} />` : null}
  <//>`;
}
function PrepAngleConfirm({ count, onReplace, onKeep }) {
  return html`<div className="notice notice-warn" role="alert"><${Icon} name="alert" size=${18} /><div className="stack" style=${{ gap: 8 }}><span>${t`Replace your ${tn(count, 'written section', 'written sections')} with a new outline? Rostra keeps the old text, and you can restore it from the Build step.`}</span><span className="row" style=${{ gap: 6 }}><button className="btn btn-sm" style=${{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick=${onReplace}>${t('Replace and build')}</button><button className="btn btn-sm btn-ghost" onClick=${onKeep}>${t('Keep my sections')}</button></span></div></div>`;
}
function PreparePage({ param }) { return param ? html`<${PrepEditor} key=${param} id=${param} />` : html`<${PrepList} />`; }

/* A run only counts when the text scrolled for most of its fastest possible playing time. */
const prepFullRun = (played, words) => words > 0 && played >= ((words / 200) * 60) * 0.8;
function Prompter({ text, onClose, onComplete }) {
  const [playing, setPlaying] = useState(false);
  const [wpm, setWpm] = useState(140);
  const [size, setSize] = useState(38);
  const [elapsed, setElapsed] = useState(0);
  const box = useRef(null);
  const pos = useRef(0);
  const played = useRef(0);
  const completed = useRef(false);
  const words = wordsOf(text).length;
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); } };
    window.addEventListener('keydown', k);
    try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* optional */ }
    return () => window.removeEventListener('keydown', k);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now(), raf;
    const el = box.current;
    pos.current = el.scrollTop;
    const step = (now) => {
      const dt = (now - last) / 1000; last = now;
      const travel = el.scrollHeight - el.clientHeight;
      const secs = (words / wpm) * 60;
      pos.current += (travel / Math.max(1, secs)) * dt;
      el.scrollTop = pos.current;
      setElapsed((e) => e + dt);
      played.current += dt;
      if (pos.current >= travel - 1) {
        setPlaying(false);
        if (!completed.current && prepFullRun(played.current, words)) { completed.current = true; if (onComplete) onComplete(); }
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, wpm, size]);
  const parts = text.split('//');
  return html`<div className="prompter" role="dialog" aria-modal="true" aria-label=${t('Rehearsal teleprompter')}>
    <div className="prompter-bar">
      <button className="btn" onClick=${() => setPlaying((p) => !p)}>${playing ? html`<${Icon} name="pause" size=${16} />${t('Pause')}` : html`<${Icon} name="play" size=${16} />${t('Start')}`}</button>
      <button className="btn" onClick=${() => { pos.current = 0; box.current.scrollTop = 0; played.current = 0; completed.current = false; setElapsed(0); setPlaying(false); }}><${Icon} name="refresh" size=${16} />${t('Restart')}</button>
      <span className="num" style=${{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>${fmtTime(elapsed)}</span>
      <span style=${{ flex: 1 }}></span>
      <button className="btn" onClick=${onClose}><${Icon} name="x" size=${16} />${t('Close')}</button>
    </div>
    <div className="prompter-text" ref=${box}><div style=${{ fontSize: size }}>${parts.map((p, i) => html`<${Fragment} key=${i}>${p}${i < parts.length - 1 ? html`<span className="pz"> ‖ </span>` : null}<//>`)}</div></div>
    <div className="prompter-line"></div>
    <div className="prompter-foot">
      <label className="row" style=${{ gap: 8 }}>${t`Pace ${wpm} wpm`}<input type="range" min="90" max="200" value=${wpm} onInput=${(e) => setWpm(Number(e.target.value))} /></label>
      <label className="row" style=${{ gap: 8 }}>${t('Size')}<input type="range" min="24" max="64" value=${size} onInput=${(e) => setSize(Number(e.target.value))} /></label>
      <span style=${{ opacity: 0.7 }}>${t('Space to start or pause · Esc to close · ‖ marks a pause')}</span>
    </div>
  </div>`;
}

/* ---------- Learn ---------- */
function LearnPage({ param }) {
  const { profile: p, ai } = useStore();
  const personal = (p.lessons || []).slice(0, 6);
  const filter = POLE_KEYS.includes(param) ? param : null;
  const tracks = filter ? [filter] : POLE_KEYS;
  return html`<${Fragment}>
    <${PageHead} label=${t('Learn')} greek="μάθησις" title=${t('The Academy')} fig="tricolon" mark=${[t('Learn it.'), t('Drill it.'), t('Own it.')]} line=${t('Learn it. Drill it. Own it.')} end=${filter ? html`<button className="btn" onClick=${() => go('learn')}>${t('Show all three tracks')}</button>` : null}>
      <p className="small muted">${ai === 'off' ? t('Short lessons on the craft, drills you mark yourself, and an arcade for sharpening your ear.') : t('Short lessons on the craft, drills your coach grades, and an arcade for sharpening your ear.')}</p>
    <//>
    <section className="stack">
      <div><div className="eyebrow">${t('Made for you')}</div><h2>${t('Lessons from your speeches')}</h2></div>
      ${personal.length ? html`<div className="grid-3">${personal.map((l) => html`<button key=${l.id} className="tile-btn" onClick=${() => go('lesson', l.id)}>
        <div className="row-between"><${PoleChip} pole=${l.pole} />${lessonDone(p, l.id) ? html`<span className="chip chip-sm chip-good"><${Icon} name="check" size=${13} />${t('Done')}</span>` : html`<span className="quest-xp">${t('+40 XP')}</span>`}</div>
        <h3>${l.title}</h3><span className="small muted">${l.why}</span><span className="tiny muted">${t`From “${l.fromTitle || t('a speech')}”`}</span>
      </button>`)}</div>` : html`<div className="card row-between"><div className="row"><span className="tile-ic" style=${{ background: 'var(--gold-soft)', color: 'var(--gold)' }}><${Icon} name="sparkles" /></span><div><b>${t('Your coach writes lessons for your weak spots')}</b><p className="small muted">${ai === 'off' ? t('Personal lessons need the AI coach. Start with the core lessons below.') : t('Analyze a speech with a transcript and three personal lessons appear here.')}</p></div></div>${ai === 'off' ? null : html`<button className="btn" onClick=${() => go('analyze')}>${t('Analyze a speech')}</button>`}</div>`}
    </section>
    <section className="stack">
      <div><div className="eyebrow">${t('Core curriculum')}</div><h2>${t('The Triangle Path')}</h2></div>
      <div className="path-grid" style=${filter ? { gridTemplateColumns: 'minmax(0, 1fr)' } : null}>
        ${tracks.map((k) => {
          const ls = LESSONS.filter((l) => l.pole === k);
          const doneN = ls.filter((l) => lessonDone(p, l.id)).length;
          const nextId = (ls.find((l) => !lessonDone(p, l.id)) || {}).id;
          return html`<div key=${k} className="card track" style=${{ '--pc': POLES[k].color }}>
            <div className="row-between" style=${{ marginBottom: 8 }}><div className="row"><span className="pole-ic" style=${{ background: POLES[k].soft, color: POLES[k].color }}><${Icon} name=${POLES[k].icon} /></span><div><div className="inscr" style=${{ color: POLES[k].color }}>${POLES[k].name}</div><span className="greek small">${POLES[k].greek}</span></div></div><span className="small muted num">${doneN} / ${ls.length}</span></div>
            ${ls.map((l, i) => html`<button key=${l.id} className=${'track-node' + (lessonDone(p, l.id) ? ' done' : l.id === nextId ? ' next' : '')} onClick=${() => go('lesson', l.id)}>
              <span className="node-ball">${lessonDone(p, l.id) ? html`<${Icon} name="check" size=${22} stroke=${3} />` : i + 1}</span>
              <span style=${{ minWidth: 0 }}><b style=${{ display: 'block' }}>${l.title}</b><span className="tiny muted">${t`${l.minutes} min · quiz + drill`}</span></span>
            </button>`)}
          </div>`;
        })}
      </div>
    </section>
    <section className="stack">
      <div><div className="eyebrow">${t('Arcade')}</div><h2>${t('Train your ear')}</h2></div>
      <div className="arcade">
        <button className="arcade-card" style=${{ '--ac': 'var(--pathos)' }} onClick=${() => go('game', 'fallacy')}>
          <svg className="art" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>
          <span className="inscr" style=${{ opacity: 0.85 }}>${t('Logos drill')}</span><h3>${t('Fallacy Hunt')}</h3><p>${t('Ten flawed arguments. Name the fallacy before the clock runs out. Streaks multiply your score.')}</p>
          <span className="small" style=${{ fontWeight: 800 }}>${p.stats.best && p.stats.best.fallacy ? t`Best ${p.stats.best.fallacy.toLocaleString()} pts` : t('No score yet')} · ${t`${p.stats.fallacies} spotted`}</span>
        </button>
        <button className="arcade-card" style=${{ '--ac': 'var(--ethos)' }} onClick=${() => go('game', 'device')}>
          <svg className="art" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d=${ICONS.sparkles} /></svg>
          <span className="inscr" style=${{ opacity: 0.85 }}>${t('Style drill')}</span><h3>${t('Device Spotter')}</h3><p>${t('Lines from Lincoln, Shakespeare, Kennedy and Douglass. Name the rhetorical device.')}</p>
          <span className="small" style=${{ fontWeight: 800 }}>${p.stats.best && p.stats.best.device ? t`Best ${p.stats.best.device.toLocaleString()} pts` : t('No score yet')} · ${t`${p.stats.devices} named`}</span>
        </button>
      </div>
    </section>
    ${typeof VIVA_LESSONS !== 'undefined' && VIVA_LESSONS.length ? html`<section className="stack">
      <div><div className="eyebrow">${t('Oral exams')}</div><h2>${t('Viva technique')}</h2><p className="small muted" style=${{ marginTop: 4 }}>${t('How to think out loud, answer first, and stay composed when the examiner pushes back.')}</p></div>
      <div className="grid-2">${VIVA_LESSONS.map((l, i) => html`<button key=${l.id} className=${'track-node' + (lessonDone(p, l.id) ? ' done' : '')} style=${{ '--pc': POLES[l.pole] ? POLES[l.pole].color : 'var(--ink)' }} onClick=${() => go('lesson', l.id)}>
        <span className="node-ball">${lessonDone(p, l.id) ? html`<${Icon} name="check" size=${22} stroke=${3} />` : 'V' + (i + 1)}</span>
        <span style=${{ minWidth: 0 }}><b style=${{ display: 'block' }}>${l.title}</b><span className="tiny muted">${t`${l.minutes || 4} min · quiz + drill`}</span></span>
      </button>`)}</div>
    </section>` : null}
    <section className="stack">
      <div><div className="eyebrow">${t('More rooms')}</div><h2>${t('Practice beyond the page')}</h2></div>
      <div className="grid-3">
        <button className="tile-btn" onClick=${() => go('viva')}><span className="tile-ic" style=${{ background: 'var(--ethos-soft)', color: 'var(--ethos)' }}><${Icon} name="scroll" /></span><h3>${t('Viva')}</h3><span className="small muted">${t('Rehearse an oral exam with an examiner panel that asks follow-ups.')}</span></button>
        <button className="tile-btn" onClick=${() => go('gym')}><span className="tile-ic" style=${{ background: 'var(--logos-soft)', color: 'var(--logos)' }}><${Icon} name="dumbbell" /></span><h3>${t('Gym')}</h3><span className="small muted">${t('Breathing, vocal warm-ups, tongue twisters and impromptu roulette.')}</span></button>
        <button className="tile-btn" onClick=${() => go('library')}><span className="tile-ic" style=${{ background: 'var(--pathos-soft)', color: 'var(--pathos)' }}><${Icon} name="columns" /></span><h3>${t('Library')}</h3><span className="small muted">${t('Great speeches annotated move by move.')}</span></button>
      </div>
    </section>
  <//>`;
}

const allCoreLessons = () => LESSONS.concat(typeof VIVA_LESSONS !== 'undefined' ? VIVA_LESSONS : []);
function findLesson(id, p) {
  const core = allCoreLessons().find((l) => l.id === id);
  if (core) return { lesson: core, core: true };
  const mine = (p.lessons || []).find((l) => l.id === id);
  if (mine) return { lesson: mine, core: false };
  const m = /^sample_l(\d)$/.exec(id || '');
  if (m && SAMPLE_AI.lessons[+m[1]]) return { lesson: { ...SAMPLE_AI.lessons[+m[1]], id, fromTitle: SAMPLE_AI.title, sample: true }, core: false };
  return null;
}
function LessonPage({ id }) {
  const { profile: p, ai } = useStore();
  const found = findLesson(id, p);
  const [answers, setAnswers] = useState({});
  const [drill, setDrill] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [earned, setEarned] = useState(null);
  const finishCard = useRef(null);
  useEffect(() => { if (earned != null && finishCard.current && finishCard.current.scrollIntoView) finishCard.current.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' }); }, [earned]);
  if (!found) return html`<div className="card empty"><h2>${t('Lesson not found')}</h2><button className="btn" onClick=${() => go('learn')}>${t('Back to the Academy')}</button></div>`;
  const { lesson: L, core } = found;
  const P = POLES[L.pole] || POLES.logos;
  const rec = p.done[L.id];
  const quiz = L.quiz || [];
  const quizDone = quiz.every((_, i) => answers[i] != null);
  const concept = Array.isArray(L.concept) ? L.concept : [L.concept];
  const answer = (qi, oi) => {
    if (answers[qi] != null) return;
    setAnswers((a) => ({ ...a, [qi]: oi }));
    const right = oi === quiz[qi].answer;
    Sound.play(right ? 'correct' : 'wrong');
    if (right) Store.act((pp, ctx) => lessonPayQuiz(pp, ctx, L.id, qi));
  };
  async function grade() {
    setBusy(true);
    try {
      const raw = await AI.json(drillPrompt(L, drill), { cache: false });
      const r = { score: clamp(Math.round(scoreOr(raw.score, 60)), 0, 100), verdict: String(raw.verdict || ''), worked: String(raw.worked || ''), next: String(raw.next || ''), example: String(raw.example || '') };
      setResult(r);
      if (!(rec && rec.drill)) {
        Store.act((pp, ctx) => { pp.stats.drills += 1; pp.done[L.id] = { ...(pp.done[L.id] || {}), drill: true, drillScore: r.score }; ctx.xp(30, t('Drill graded')); ctx.quest('drill'); });
      }
      if (r.score >= 80) celebrate({ count: 70 });
    } catch (e) { toast(aiErrorText(e), 'bad'); }
    setBusy(false);
  }
  function selfMark() {
    if (rec && rec.drill) return;
    Store.act((pp, ctx) => { pp.stats.drills += 1; pp.done[L.id] = { ...(pp.done[L.id] || {}), drill: true }; ctx.xp(20, t('Drill done')); ctx.quest('drill'); });
    setResult({ self: true });
  }
  function complete() {
    if (lessonDone(p, L.id)) return;
    const right = quiz.filter((q, i) => answers[i] === q.answer).length;
    Store.act((pp, ctx) => { pp.done[L.id] = { ...(pp.done[L.id] || {}), at: Date.now(), quiz: right }; pp.stats.lessons += 1; ctx.xp(40, t('Lesson complete')); ctx.quest('lesson'); });
    celebrate({ count: 100 });
    setEarned(40);
  }
  const canComplete = core ? quizDone : (result || (rec && rec.drill));
  return html`<div className="stack" style=${{ maxWidth: 820, width: '100%', margin: '0 auto', gap: 18 }}>
    <div className="lesson-head" style=${{ '--pc': P.color, '--pc-soft': P.soft }}>
      <div className="row" style=${{ gap: 8 }}><span className="inscr" style=${{ color: P.color }}>${P.name} · ${core ? t('Core lesson') : t('Written for you')}</span>${L.minutes ? html`<span className="chip chip-sm">${t`${L.minutes} min`}</span>` : null}${lessonDone(p, L.id) ? html`<span className="chip chip-sm chip-good"><${Icon} name="check" size=${13} />${t('Completed')}</span>` : null}${L.sample ? html`<span className="chip chip-sm chip-example">${t('From the sample report')}</span>` : null}</div>
      <h1>${L.title}</h1>
      ${L.why ? html`<p className="lead"><b>${t('Why this lesson:')}</b> ${L.why}</p>` : null}
    </div>
    <section className="card prose">${concept.map((c, i) => html`<p key=${i}>${c}</p>`)}</section>
    ${L.terms ? html`<section className="grid-3">${L.terms.map((tm) => html`<div key=${tm.term} className="term"><b style=${{ color: P.color }}>${tm.term}</b><span className="small" style=${{ color: 'var(--ink-2)' }}>${tm.def}</span></div>`)}</section>` : null}
    ${L.example ? (typeof L.example === 'string'
      ? html`<figure className="quote-block"><span className="eyebrow">${t('Example')}</span><q>${L.example.replace(/^[“"]|[”"]$/g, '')}</q></figure>`
      : html`<figure className="quote-block"><span className="eyebrow">${t('From the masters')}</span><q>${L.example.quote}</q><figcaption className="small"><b>${L.example.who}.</b> <span className="muted">${L.example.note}</span></figcaption></figure>`) : null}
    ${quiz.length ? html`<section className="card stack" style=${{ gap: 18 }}>
      <div><div className="eyebrow">${t('Check yourself')}</div><h2>${t('Quick quiz')}</h2></div>
      ${quiz.map((q, qi) => html`<div key=${qi} className="stack" style=${{ gap: 10 }}>
        <b>${q.q}</b>
        <div className="mcq">${q.options.map((o, oi) => {
          const st = answers[qi] == null ? '' : oi === q.answer ? ' right' : oi === answers[qi] ? ' wrong' : '';
          return html`<button key=${oi} className=${'opt' + st} disabled=${answers[qi] != null} onClick=${() => answer(qi, oi)}><span className="k">${'ABCD'[oi]}</span><span>${o}</span></button>`;
        })}</div>
        ${answers[qi] != null ? html`<p className="small" style=${{ color: answers[qi] === q.answer ? 'var(--good)' : 'var(--ink-2)' }}><b>${answers[qi] === q.answer ? t('Correct.') : t('Not quite.')}</b> ${q.why}</p>` : null}
      </div>`)}
    </section>` : null}
    <section className="card stack" style=${{ gap: 12 }}>
      <div><div className="eyebrow">${t('Drill')}</div><h2>${t('Put it into practice')}</h2><p className="small" style=${{ color: 'var(--ink-2)', marginTop: 6 }}>${L.drill}</p></div>
      <textarea className="textarea" rows="5" value=${drill} onInput=${(e) => setDrill(e.target.value)} placeholder=${t('Write your answer here…')} aria-label=${t('Your drill answer')}></textarea>
      <div className="row">
        ${ai !== 'off' ? html`<button className="btn btn-ink" disabled=${wordsOf(drill).length < 6 || busy} onClick=${grade}>${busy ? html`<span className="spin"></span>${t('Grading…')}` : html`<${Icon} name="sparkles" size=${16} />${t('Get coach feedback')}`}</button>` : null}
        <button className="btn" disabled=${wordsOf(drill).length < 6 || (rec && rec.drill)} onClick=${selfMark}>${rec && rec.drill ? t('Drill done') : t('Mark drill done')}</button>
        <span className="hint">${rec && rec.drill ? t('You’ve earned this drill’s XP. Practice is still free.') : ai !== 'off' ? t('+30 XP when graded') : t('+20 XP')}</span>
      </div>
      ${result && !result.self ? html`<div className="feedback" style=${{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
        <${Ring} value=${result.score} size=${86} stroke=${9} color=${P.color} />
        <div className="stack" style=${{ gap: 6 }}><b>${result.verdict}</b>${result.worked ? html`<span><b style=${{ color: 'var(--good)' }}>${t('Works:')}</b> ${result.worked}</span>` : null}${result.next ? html`<span><b style=${{ color: 'var(--pathos)' }}>${t('Next:')}</b> ${result.next}</span>` : null}${result.example ? html`<span className="small muted"><b>${t('One way to say it:')}</b> ${result.example}</span>` : null}</div>
      </div>` : null}
    </section>
    ${lessonDone(p, L.id) ? html`<${LessonDoneCard} lesson=${L} xp=${earned} next=${nextLesson(p)} innerRef=${finishCard} />` : html`<div className="row"><button className="btn-cta" disabled=${!canComplete} onClick=${complete}><${Icon} name="check" size=${18} />${t('Complete lesson · +40 XP')}</button><span className="hint">${canComplete ? '' : core ? t('Answer the quiz to finish.') : t('Do the drill to finish.')}</span></div>`}
  </div>`;
}

/* Each quiz question pays once, ever. The record sits outside p.done so lessonDone stays correct. */
function lessonPayQuiz(pp, ctx, lessonId, qi) {
  if (lessonDone(pp, lessonId)) return;
  pp.quizPaid = pp.quizPaid || {};
  const key = lessonId + ':' + qi;
  if (pp.quizPaid[key]) return;
  pp.quizPaid[key] = 1;
  ctx.xp(5, t('Correct answer'));
}
function LessonDoneCard({ lesson, xp, next, innerRef }) {
  const fromReport = lesson.from && !lesson.sample;
  return html`<section className="card stack" ref=${innerRef} role="status" style=${{ gap: 12 }}>
    <div className="row-between"><div><div className="eyebrow">${t('Lesson complete')}</div><h2>${xp != null ? t('You finished this lesson') : t('You’ve already finished this lesson')}</h2></div>${xp != null ? html`<span className="xp-earned"><${Icon} name="bolt" size=${16} style=${{ color: 'var(--gold)' }} />+${xp} XP</span>` : null}</div>
    <div className="row">
      ${next ? html`<button className="btn-cta" onClick=${() => go('lesson', next.id)}>${t`Next lesson: ${next.title}`}<${Icon} name="arrowR" size=${18} /></button>` : null}
      ${fromReport ? html`<button className="btn" onClick=${() => go('report', lesson.from)}><${Icon} name="file" size=${16} />${t('Back to your report')}</button>` : html`<button className="btn" onClick=${() => go('learn')}><${Icon} name="book" size=${16} />${t('Back to the Academy')}</button>`}
    </div>
  </section>`;
}

/* ---------- Arcade ---------- */
const ROUND_SECONDS = 15;
/* Answer keys must not fire while the user is typing, or while a drawer or dialog sits over the game. */
function gameKeyIgnored(target) {
  if (target && target.closest && target.closest('input, textarea, select, [contenteditable], .drawer, .modal, .modal-scrim')) return true;
  return !!(typeof document !== 'undefined' && document.querySelector && document.querySelector('.drawer, .modal-scrim'));
}
function makeRounds(kind) {
  const bank = kind === 'fallacy' ? FALLACIES : DEVICES;
  const labels = [...new Set(bank.map((b) => b.answer))];
  return shuffle(bank).slice(0, 10).map((it) => ({ ...it, options: shuffle([it.answer, ...shuffle(labels.filter((l) => l !== it.answer)).slice(0, 3)]) }));
}
function GamePage({ param }) {
  const kind = param === 'device' ? 'device' : 'fallacy';
  const [rounds, setRounds] = useState(() => makeRounds(kind));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [right, setRight] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [phase, setPhase] = useState('play');
  const [award, setAward] = useState(0);
  const optsRef = useRef(null);
  const r = rounds[i];
  useEffect(() => {
    if (phase !== 'play' || picked != null) return;
    const start = performance.now() - (ROUND_SECONDS - left) * 1000;
    const t = setInterval(() => {
      const rem = Math.max(0, ROUND_SECONDS - (performance.now() - start) / 1000);
      setLeft(rem);
      if (rem <= 0) { clearInterval(t); choose(-1); }
    }, 100);
    return () => clearInterval(t);
  }, [i, phase, picked]);
  useEffect(() => {
    const k = (e) => { if (phase !== 'play' || gameKeyIgnored(e.target)) return; if (picked == null && ['1', '2', '3', '4'].includes(e.key)) choose(Number(e.key) - 1); else if (picked != null && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  function choose(oi) {
    if (picked != null) return;
    setPicked(oi);
    const ok = oi >= 0 && r.options[oi] === r.answer;
    if (ok) {
      const c = combo + 1;
      const mult = 1 + Math.floor(c / 3) * 0.5;
      setCombo(c); setBest((b) => Math.max(b, c)); setRight((n) => n + 1);
      setScore((s) => s + Math.round((100 + left * 10) * mult));
      Sound.play('correct');
      const el = optsRef.current && optsRef.current.children[oi];
      if (el) { const b = el.getBoundingClientRect(); celebrate({ x: b.left + b.width / 2, y: b.top + b.height / 2, count: 24 + Math.min(40, c * 6), power: 0.55 }); }
    } else { setCombo(0); Sound.play('wrong'); }
  }
  function next() {
    if (i + 1 >= rounds.length) return end();
    setI(i + 1); setPicked(null); setLeft(ROUND_SECONDS);
  }
  function end() {
    setPhase('end');
    const xp = right * 4 + Math.min(20, best * 2) + (right === rounds.length ? 20 : 0);
    setAward(xp);
    Store.act((p, ctx) => {
      if (kind === 'fallacy') p.stats.fallacies += right; else p.stats.devices += right;
      p.stats.bestCombo = Math.max(p.stats.bestCombo || 0, best);
      p.stats.games += 1;
      p.stats.best = { ...(p.stats.best || {}), [kind]: Math.max((p.stats.best || {})[kind] || 0, score) };
      ctx.xp(xp, kind === 'fallacy' ? t('Fallacy Hunt') : t('Device Spotter'));
      ctx.quest(kind === 'fallacy' ? 'hunt' : 'device', right);
    });
    if (right >= 7) setTimeout(() => celebrate({ count: 150 }), 200);
  }
  function again() { setRounds(makeRounds(kind)); setI(0); setPicked(null); setScore(0); setCombo(0); setBest(0); setRight(0); setLeft(ROUND_SECONDS); setPhase('play'); }
  const title = kind === 'fallacy' ? t('Fallacy Hunt') : t('Device Spotter');
  if (phase === 'end') {
    const stars = right >= 9 ? 3 : right >= 7 ? 2 : right >= 4 ? 1 : 0;
    return html`<div className="game"><div className="card" style=${{ display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 14, padding: '32px 20px' }}>
      <div className="eyebrow">${t`${title} · round complete`}</div>
      <div className="stars">${[0, 1, 2].map((s) => html`<span key=${s} style=${{ animationDelay: s * 0.15 + 's' }} className=${s < stars ? 'star-on' : 'star-off'}><svg viewBox="0 0 24 24" style=${{ fill: 'currentColor' }}><path d=${ICONS.star} /></svg></span>`)}</div>
      <div className="big-num" style=${{ fontSize: 56 }}><${CountUp} value=${score} /></div>
      <p className="muted">${t`${right} of ${rounds.length} correct · best combo ${best}`}</p>
      <span className="xp-earned"><${Icon} name="bolt" size=${16} style=${{ color: 'var(--gold)' }} />+${award} XP</span>
      <div className="row" style=${{ justifyContent: 'center' }}><button className="btn-cta" onClick=${again}><${Icon} name="refresh" size=${18} />${t('Play again')}</button><button className="btn" onClick=${() => go('game', kind === 'fallacy' ? 'device' : 'fallacy')}>${t`Try ${kind === 'fallacy' ? t('Device Spotter') : t('Fallacy Hunt')}`}</button><button className="btn btn-ghost" onClick=${() => go('learn')}>${t('Academy')}</button></div>
    </div></div>`;
  }
  const ok = picked != null && picked >= 0 && r.options[picked] === r.answer;
  return html`<div className="game">
    <div className="game-hud">
      <span className="eyebrow">${title}</span><span className="chip chip-sm num">${t`Round ${i + 1} / ${rounds.length}`}</span>
      <span style=${{ flex: 1 }}></span>
      ${combo >= 2 ? html`<span key=${combo} className="combo hot"><${Icon} name="flame" size=${16} />${t`${combo} combo`}${combo >= 3 ? ' · ×' + (1 + Math.floor(combo / 3) * 0.5) : ''}</span>` : null}
      <span className="big-num" style=${{ fontSize: 26 }}>${score.toLocaleString()}</span>
    </div>
    <div className="timer" aria-hidden="true"><i style=${{ width: (left / ROUND_SECONDS) * 100 + '%', backgroundPosition: (1 - left / ROUND_SECONDS) * 100 + '% 0' }}></i></div>
    <div className="prompt-card">
      <span className="eyebrow">${kind === 'fallacy' ? t('Which fallacy is this?') : t('Which device is this?')}</span>
      <div className="stmt">“${r.text}”</div>
      ${r.who ? html`<span className="small muted">${r.who}</span>` : null}
    </div>
    <div className="opts-grid" ref=${optsRef}>
      ${r.options.map((o, oi) => {
        const st = picked == null ? '' : o === r.answer ? ' right' : oi === picked ? ' wrong' : '';
        return html`<button key=${o + oi} className=${'opt' + st} disabled=${picked != null} onClick=${() => choose(oi)}><span className="k">${oi + 1}</span><span>${o}</span></button>`;
      })}
    </div>
    ${picked != null ? html`<div className="feedback" style=${{ borderColor: ok ? 'var(--good)' : 'var(--bad)' }}>
      <b style=${{ color: ok ? 'var(--good)' : 'var(--bad)' }}>${ok ? t('Correct!') : picked < 0 ? t('Time’s up.') : t('Not this time.')} ${t`The answer: ${r.answer}.`}</b>
      <span>${r.why}</span>
      <div className="row"><button className="btn-cta" onClick=${next}>${i + 1 >= rounds.length ? t('See results') : t('Next')}<${Icon} name="arrowR" size=${18} /></button><span className="hint">${t('Enter for next')}</span></div>
    </div>` : html`<p className="hint" style=${{ textAlign: 'center' }}>${t('Press 1–4 to answer. Faster answers score more.')}</p>`}
  </div>`;
}

/* ---------- Library ---------- */
function LibraryPage() {
  const { profile: p } = useStore();
  const read = new Set(p.stats.read || []);
  return html`<${Fragment}>
    <${PageHead} label=${t('Library')} greek="βιβλιοθήκη" title=${t('Learn from the masters')} fig="antithesis" mark=${[t('spoke once'), t('still listening')]} line=${t('They spoke once. We are still listening.')} end=${html`<span className="chip">${t`${read.size} of ${LIBRARY.length} studied`}</span>`}>
      <p className="small muted">${t('Great speeches, annotated move by move. Tap any highlight to see the technique and steal it for your own.')}</p>
    <//>
    <div className="lib-grid">
      ${LIBRARY.map((s) => html`<button key=${s.id} className="lib-card" onClick=${() => go('speech', s.id)}>
        <div style=${{ minWidth: 0 }}><span className="lib-year">${t`${s.year} · ${s.minutes} min`}</span><div className="lib-title">${s.title}</div><span className="small muted">${s.speaker}</span>
          <p className="small" style=${{ color: 'var(--ink-2)', marginTop: 8 }}>${s.occasion}</p>
          ${read.has(s.id) ? html`<span className="chip chip-sm chip-good" style=${{ marginTop: 10 }}><${Icon} name="check" size=${13} />${t('Studied')}</span>` : html`<span className="chip chip-sm" style=${{ marginTop: 10 }}>${t('+30 XP')}</span>`}
        </div>
        <${MiniTriangle} scores=${mixToScores(s.mix)} size=${56} />
      </button>`)}
    </div>
    <section className="card stack" style=${{ gap: 12 }}>
      <div><div className="eyebrow">${t('Modern masters')}</div><h2>${t('Watch list')}</h2><p className="small muted">${t('Talks worth studying, with what to listen for. They open on the publisher’s site.')}</p></div>
      ${MODERN.map((m) => html`<a key=${m.url} className="link-row" href=${m.url} target="_blank" rel="noopener noreferrer">
        <span style=${{ minWidth: 0 }}><span className="row" style=${{ gap: 8 }}><b>${m.title}</b><${PoleChip} pole=${m.pole} /></span><span className="small muted" style=${{ display: 'block' }}>${m.speaker}, ${m.year}</span><span className="small" style=${{ color: 'var(--ink-2)' }}>${m.watch}</span></span>
        <${Icon} name="external" size=${18} />
      </a>`)}
    </section>
  <//>`;
}
const LIB_STUDY_SECS = 20;
function SpeechPage({ id }) {
  const { profile: p } = useStore();
  const [canMark, setCanMark] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCanMark(true), LIB_STUDY_SECS * 1000); return () => clearTimeout(t); }, []);
  const s = LIBRARY.find((x) => x.id === id);
  if (!s) return html`<div className="card empty"><h2>${t('Speech not found')}</h2><button className="btn" onClick=${() => go('library')}>${t('Library')}</button></div>`;
  const studied = (p.stats.read || []).includes(s.id);
  const items = s.notes.map((n) => ({ ...n }));
  const mark = () => {
    if (studied || !canMark) return;
    Store.act((pp, ctx) => { pp.stats.read = [...(pp.stats.read || []), s.id]; ctx.xp(30, t('Studied a great speech')); ctx.quest('read'); });
  };
  return html`<${Fragment}>
    <${PageHead} label=${`${s.year} · ${s.speaker}`} greek="λόγος" title=${s.title}><p className="lead">${s.intro}</p><//>
    <div className="lib-detail">
      <section className="card stack" style=${{ gap: 14 }}>
        <${Annotated} text=${s.text} items=${items} verse=${!!s.verse} emptyHint=${t('Tap a highlight to see the move and why it works.')} />
      </section>
      <div className="stack">
        <div className="card stack" style=${{ gap: 12 }}>
          <div className="eyebrow">${t('Their triangle')}</div>
          <${Triangle} scores=${mixToScores(s.mix)} mode="now" />
          <p className="tiny muted">${t`An editorial read of the speech’s emphasis: ethos ${s.mix.ethos}%, pathos ${s.mix.pathos}%, logos ${s.mix.logos}%.`}</p>
        </div>
        <div className="card stack" style=${{ gap: 10 }}>
          <div className="eyebrow">${t('Moves to steal')}</div>
          <ul className="list-check">${s.steal.map((x, i) => html`<li key=${i}><${Icon} name="sparkles" size=${18} style=${{ color: 'var(--gold)' }} /><span>${x}</span></li>`)}</ul>
          <button className=${studied ? 'btn' : 'btn-cta'} disabled=${studied || !canMark} onClick=${mark}>${studied ? html`<${Icon} name="check" size=${16} />${t('Studied')}` : html`<${Icon} name="book" size=${18} />${t('Mark as studied · +30 XP')}`}</button>
          ${!studied && !canMark ? html`<span className="hint">${t`Read the speech and open a few highlights first. This button unlocks after ${LIB_STUDY_SECS} seconds.`}</span>` : null}
        </div>
      </div>
    </div>
  <//>`;
}

/* ---------- Trophies ---------- */
const badgeBest = (speeches, k) => Math.max(0, ...(speeches || []).map((x) => (x.scores && x.scores[k]) || 0));
const BADGE_PROGRESS = {
  first_words: (p) => [p.stats.speeches || 0, 1], kindling: (p) => [p.streak.best || 0, 3], eternal_flame: (p) => [p.streak.best || 0, 7], fortnight: (p) => [p.streak.best || 0, 14], perennial: (p) => [p.streak.best || 0, 30],
  scholar: (p) => [p.stats.lessons || 0, 5], historian: (p) => [(p.stats.read || []).length, 5], fallacy_hunter: (p) => [p.stats.fallacies || 0, 25], wordsmith: (p) => [p.stats.devices || 0, 25], unbroken: (p) => [p.stats.bestCombo || 0, 10],
  speechwright: (p) => [p.stats.preps || 0, 1], viva_first: (p) => [p.stats.vivas || 0, 1], distinction: (p) => [p.stats.vivaBest || 0, 85], improviser: (p) => [p.stats.impromptus || 0, 5], zen: (p) => [p.stats.breaths || 0, 10],
  pillar: (p, s) => [badgeBest(s, 'ethos'), 80], silver_tongue: (p, s) => [badgeBest(s, 'pathos'), 80], iron_logic: (p, s) => [badgeBest(s, 'logos'), 80],
};
const BADGE_GO = {
  first_words: ['analyze'], kindling: ['home'], eternal_flame: ['home'], fortnight: ['home'], perennial: ['home'], scholar: ['learn'], historian: ['library'], clean_air: ['analyze'],
  pillar: ['learn', 'ethos'], silver_tongue: ['learn', 'pathos'], iron_logic: ['learn', 'logos'], pause_master: ['analyze'], fallacy_hunter: ['game', 'fallacy'], wordsmith: ['game', 'device'], speechwright: ['prepare'],
  triple: ['analyze'], comeback: ['analyze'], unbroken: ['game', 'fallacy'], viva_first: ['viva'], distinction: ['viva'], zen: ['gym', 'breath'], improviser: ['gym', 'impromptu'],
};
const BADGE_NEEDS_AI = ['iron_logic', 'distinction'];
function badgeProgress(id, p, speeches) {
  const fn = BADGE_PROGRESS[id];
  if (!fn) return null;
  const [v, max] = fn(p, speeches);
  return max > 1 ? { value: Math.min(v, max), max } : null;
}
function TrophiesPage() {
  const { profile: p, speeches, backend, ai } = useStore();
  const li = levelInfo(p.xp);
  const [name, setName] = useState(p.name || '');
  const [confirm, setConfirm] = useState(false);
  const [poster, setPoster] = useState(false);
  const earned = BADGES.filter((b) => p.badges[b.id]).length;
  const stats = [
    [t('Speeches analyzed'), p.stats.speeches], [t('Minutes analyzed'), Math.round(p.stats.minutes)], [t('Lessons completed'), p.stats.lessons], [t('Drills done'), p.stats.drills],
    [t('Fallacies spotted'), p.stats.fallacies], [t('Devices named'), p.stats.devices], [t('Best combo'), p.stats.bestCombo], [t('Speeches prepared'), p.stats.preps],
    [t('Current streak'), liveStreak(p)], [t('Best streak'), p.streak.best || 0], [t('Great speeches studied'), (p.stats.read || []).length], [t('Total XP'), p.xp.toLocaleString()],
    [t('Oral exams'), p.stats.vivas || 0], [t('Best viva'), p.stats.vivaBest ? p.stats.vivaBest + '%' : '–'], [t('Impromptus spoken'), p.stats.impromptus || 0], [t('Breathing rounds'), p.stats.breaths || 0],
  ];
  const hasTrail = p.trail.length > 0;
  return html`<${Fragment}>
    <section className="card level-hero">
      <${LaurelLevel} level=${li.level} />
      <div className="stack" style=${{ gap: 10 }}>
        <div className="eyebrow">${t`Level ${li.level}`} <span className="greek" lang="grc">${li.greek}</span></div><h1>${li.title}</h1>
        <${MeanderBar} value=${li.progress * 100} height=${18} label=${t('Progress to the next level')} />
        <div className="row-between small muted num"><span>${t`${li.into.toLocaleString()} / ${li.need.toLocaleString()} XP to ${levelInfo(li.next).title}`}</span><span>${t`${earned} of ${BADGES.length} badges`}</span></div>
        <${Scholion} fig="metonymy" mark=${[t('laurel')]} className="page-line">${t('Every laurel here has a speech behind it.')}<//>
        <p className="small muted">${t('Titles follow the path of classical oratory, from Listener to Aristotle.')}</p>
        <div className="row"><button className="btn-cta gold" onClick=${() => setPoster(true)}><${Icon} name="image" size=${18} />${t('Make my poster')}</button></div>
      </div>
    </section>
    ${poster ? html`<${PosterModal} onClose=${() => setPoster(false)} />` : null}
    <section className="stack">
      <div><div className="eyebrow">${t('Laurels')} <span className="greek" lang="grc">δάφναι</span></div><h2>${t('Badges')}</h2></div>
      <div className="badge-grid">${BADGES.map((b) => {
        const has = !!p.badges[b.id];
        const prog = has ? null : badgeProgress(b.id, p, speeches);
        const dest = BADGE_GO[b.id] || ['learn'];
        return html`<button type="button" key=${b.id} className=${'badge-cell' + (has ? '' : ' locked')} onClick=${() => go(dest[0], dest[1])}>
          <${BadgeMedal} badge=${b} earned=${has} size=${78} /><span className="badge-name">${b.name}</span><span className="tiny muted">${b.desc}</span>
          ${has ? html`<span className="tiny" style=${{ color: 'var(--good)', fontWeight: 700 }}>${t`Earned ${fmtDate(p.badges[b.id])}`}</span>` : null}
          ${prog ? html`<span className="badge-cell-progress"><${MeanderBar} value=${(prog.value / prog.max) * 100} height=${10} label=${t`${b.name} progress`} /><span className="tiny muted num">${prog.value} / ${prog.max}</span></span>` : null}
          ${!has && ai === 'off' && BADGE_NEEDS_AI.includes(b.id) ? html`<span className="tiny" style=${{ fontWeight: 700 }}>${t('Needs the AI coach')}</span>` : null}
        </button>`;
      })}</div>
    </section>
    <section className="grid-2">
      <div className="card stack" style=${{ gap: 12 }}>
        <div><div className="eyebrow">${t('Journey')}</div><h2>${t('Your path across the triangle')}</h2></div>
        ${hasTrail ? html`<${Triangle} scores=${p.skills} trail=${p.trail} mode="journey" />` : html`<div className="empty"><${MiniTriangle} scores=${{ ethos: 30, pathos: 30, logos: 30 }} size=${80} /><p>${t('Each speech you analyze adds a point to your journey.')}</p><button className="btn" onClick=${() => go('analyze')}>${t('Analyze a speech')}</button></div>`}
      </div>
      <div className="card stack" style=${{ gap: 12 }}>
        <div><div className="eyebrow">${t('By the numbers')}</div><h2>${t('Stats')}</h2></div>
        <div className="stat-grid">${stats.map(([k, v]) => html`<div key=${k} className="stat"><b>${v}</b><span className="tiny muted">${k}</span></div>`)}</div>
      </div>
    </section>
    <section className="card stack" style=${{ gap: 16 }}>
      <div><div className="eyebrow">${t('Settings')}</div><h2>${t('You')}</h2></div>
      <div className="grid-2">
        <div className="field"><label htmlFor="set-name">${t('Name your coach uses')}</label><div className="row" style=${{ flexWrap: 'nowrap' }}><input id="set-name" className="input" value=${name} onInput=${(e) => setName(e.target.value)} /><button className="btn" onClick=${() => { Store.act((pp) => { pp.name = name.trim().slice(0, 40); }); toast(t('Saved')); }}>${t('Save')}</button></div></div>
        <div className="field"><span className="label">${t('You usually speak for')}</span><div className="row" style=${{ gap: 6 }}>${OCCASIONS.map((o) => html`<button key=${o.id} className="chip chip-sm" aria-pressed=${p.goal === o.id} onClick=${() => Store.act((pp) => { pp.goal = o.id; })}>${o.label}</button>`)}</div></div>
        <div className="field"><span className="label">${t('Sound effects')}</span><div className="row" style=${{ gap: 6 }}>${[[true, t('On')], [false, t('Off')]].map(([v, lab]) => html`<button key=${lab} className="chip chip-sm" aria-pressed=${(p.settings.sound !== false) === v} onClick=${() => { Sound.enabled = v; Store.act((pp) => { pp.settings.sound = v; }); if (v) Sound.play('tap'); }}>${lab}</button>`)}</div></div>
      </div>
      <div className="row-between"><span className="row"><${Icon} name=${backend === 'db' ? 'cloud' : 'laptop'} size=${18} /><span className="small">${backend === 'db' ? t('Progress syncs privately to your Claude account. Only you can see it.') : t('Progress is saved in this browser.')}</span></span>
        ${confirm ? html`<span className="row"><span className="small">${t('Erase all speeches, drafts and progress?')}</span><button className="btn btn-sm" style=${{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick=${async () => { await Store.resetAll(); setConfirm(false); toast(t('Everything was reset')); go('home'); }}>${t('Erase everything')}</button><button className="btn btn-sm btn-ghost" onClick=${() => setConfirm(false)}>${t('Cancel')}</button></span>`
          : html`<button className="btn btn-ghost btn-sm" onClick=${() => setConfirm(true)}><${Icon} name="trash" size=${15} />${t('Reset progress')}</button>`}</div>
    </section>
  <//>`;
}

/* ---------- Coach drawer ---------- */
const COACH_STARTERS = [t('How do I calm my nerves before I speak?'), t('Give me three ways to open a pitch.'), t('How should I handle a hostile question?'), t('What should I work on first, based on my triangle?')];
const COACH_POLE_TIPS = {
  ethos: t('Give people a reason to trust you. Name the experience behind your view, and admit one limit.'),
  pathos: t('Help people feel what is at stake. Add one specific story or image about one real person.'),
  logos: t('Make the case easy to follow. Back each main claim with one piece of evidence, and say why it matters.'),
};
const COACH_OFFLINE = {
  [COACH_STARTERS[0]]: t('Try these in the ten minutes before you speak.\n\n- **Breathe out longer than you breathe in.** In for 4, out for 6, five times. The Gym has a guided version.\n- **Learn your first two sentences by heart.** A sure start settles the rest of the talk.\n- **Warm up out loud.** A few minutes of hums and tongue twisters wakes your voice.\n- **Pick one friendly face** and say your opening line to that person.'),
  [COACH_STARTERS[1]]: t('- **Start with a moment.** Describe one customer on one bad day, in two sentences.\n- **Start with a surprising number.** Say it, pause, then say what it costs the people in the room.\n- **Start with a question they already care about.** Ask it, wait, then promise the answer.\n\nPick the one you can say without notes, and put it before any thanks or introductions.'),
  [COACH_STARTERS[2]]: t('- **Pause first.** Two seconds gives you time to think and shows you are not rattled.\n- **Restate the real question** without the heat: “You’re asking whether the cost is justified.”\n- **Answer in one or two sentences**, with one piece of evidence.\n- **Link back to your main point**, then take the next question.\n\nIf you don’t know the answer, say so and say when you’ll find out.'),
  [COACH_STARTERS[3]]: (p) => {
    const k = p && p.skills ? weakestPole(p.skills) : null;
    if (!k) return t('Analyze a speech first. You’ll get scores for ethos, pathos and logos, and this answer will name your weakest appeal.');
    return t`Start with **${POLES[k].name}**, your lowest score at ${Math.round(p.skills[k])}.\n\n${COACH_POLE_TIPS[k]}\n\nThe Academy has a short lesson track for it, and the next speech you analyze will show whether it moved.`;
  },
};
function coachOfflineAnswer(q, p) { const a = COACH_OFFLINE[q]; return typeof a === 'function' ? a(p) : a || ''; }
function MiniMd({ text }) {
  const blocks = text.split(/\n{2,}/);
  const inline = (s, key) => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (/^\*\*[^*]+\*\*$/.test(part) ? html`<b key=${key + '_' + i}>${part.slice(2, -2)}</b>` : part));
  return blocks.map((b, i) => {
    const lines = b.split('\n');
    if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) return html`<ul key=${i}>${lines.map((l, j) => html`<li key=${j}>${inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ''), i + '_' + j)}</li>`)}</ul>`;
    return html`<p key=${i}>${lines.map((l, j) => html`<${Fragment} key=${j}>${j ? html`<br />` : null}${inline(l, i + '_' + j)}<//>`)}</p>`;
  });
}
function CoachDrawer({ onClose, seed }) {
  const { profile, speeches, ai } = useStore();
  const [msgs, setMsgs] = useState(() => { try { const v = sessionStorage.getItem('rostra.chat'); return v ? JSON.parse(v) : []; } catch (e) { return []; } });
  const [input, setInput] = useState(ai === 'off' ? '' : seed || '');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState('');
  const ctl = useRef(null);
  const end = useRef(null);
  useEffect(() => { try { sessionStorage.setItem('rostra.chat', JSON.stringify(msgs.slice(-20))); } catch (e) { /* optional */ } }, [msgs]);
  useEffect(() => { end.current && end.current.scrollIntoView({ block: 'end' }); }, [msgs, live]);
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => { window.removeEventListener('keydown', k); ctl.current && ctl.current.abort(); }; }, []);
  async function send(text) {
    const t = (text || input).trim();
    if (!t || busy) return;
    const turns = [...msgs, { role: 'user', content: t }];
    setMsgs(turns); setInput(''); setBusy(true); setLive('');
    const c = new AbortController(); ctl.current = c;
    try {
      const { text: out } = await AI.text([{ role: 'user', content: coachRules(profile, speeches) }, ...turns.slice(-12)], { cache: false, signal: c.signal, modelTier: 'default', onText: ({ text: tx }) => setLive(tx) });
      setMsgs((m) => [...m, { role: 'assistant', content: out }]);
    } catch (e) {
      if (e && e.code !== 'cancelled') setMsgs((m) => [...m, { role: 'assistant', content: (e && e.text ? e.text + '\n\n' : '') + '(' + aiErrorText(e) + ')' }]);
      else if (e && e.text) setMsgs((m) => [...m, { role: 'assistant', content: e.text }]);
    }
    setLive(''); setBusy(false);
  }
  const off = ai === 'off';
  const askOffline = (q) => setMsgs((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: coachOfflineAnswer(q, profile) }]);
  return html`<${Fragment}>
    <div className="drawer-scrim" onClick=${onClose}></div>
    <aside className="drawer" role="dialog" aria-modal="true" aria-label=${t('Ask the coach')}>
      <div className="drawer-head"><span className="coach-avatar" style=${{ width: 34, height: 34 }}><${LogoMark} size=${20} /></span><div style=${{ flex: 1 }}><b>${t('Your coach')}</b><div className="tiny muted">${off ? t('Answers to common questions.') : t('Knows your triangle. Won’t write your speech for you.')}</div></div>${msgs.length ? html`<button className="btn btn-ghost btn-sm" onClick=${() => setMsgs([])}>${t('Clear')}</button>` : null}<button className="btn btn-ghost btn-icon" onClick=${onClose} aria-label=${t('Close coach')}><${Icon} name="x" /></button></div>
      <div className="chat">
        ${off ? html`<div className="notice notice-warn"><${Icon} name="alert" size=${18} /><span>${t('Live coaching needs Claude allowed for this artifact. These answers work without it.')}</span></div>` : null}
        ${!msgs.length || off ? html`<div className="stack" style=${{ gap: 8 }}><p className="small muted">${off ? t('Pick a question.') : t('Ask anything about speaking, or paste a paragraph for quick feedback.')}</p>${COACH_STARTERS.map((s) => html`<button key=${s} className="chip" style=${{ justifySelf: 'start', whiteSpace: 'normal', textAlign: 'left', height: 'auto', padding: '8px 12px' }} onClick=${() => (off ? askOffline(s) : send(s))}>${s}</button>`)}</div>` : null}
        ${msgs.map((m, i) => html`<div key=${i} className=${'msg ' + (m.role === 'user' ? 'me' : 'bot')}>${m.role === 'user' ? m.content : html`<${MiniMd} text=${m.content} />`}</div>`)}
        ${busy ? html`<div className="msg bot">${live ? html`<${MiniMd} text=${live} />` : html`<span className="row small muted"><span className="spin"></span>${t('Thinking…')}</span>`}</div>` : null}
        <div ref=${end}></div>
      </div>
      ${off ? null : html`<form className="chat-form" onSubmit=${(e) => { e.preventDefault(); send(); }}>
        <textarea className="textarea" rows="1" value=${input} onInput=${(e) => setInput(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder=${t('Ask your coach…')} aria-label=${t('Message')}></textarea>
        ${busy ? html`<button type="button" className="btn btn-icon" onClick=${() => ctl.current && ctl.current.abort()} aria-label=${t('Stop')}><${Icon} name="stop" size=${18} /></button>` : html`<button type="submit" className="btn btn-ink btn-icon" disabled=${!input.trim()} aria-label=${t('Send')}><${Icon} name="send" size=${18} /></button>`}
      </form>`}
    </aside>
  <//>`;
}
