// Visual pass: shell, home, report, triangle, medals. Run through tests/harness.js after core.test.js.

function withState(patch, fn) {
  var saved = Store.state;
  Store.state = Object.assign({}, saved, patch);
  try { return fn(); } finally { Store.state = saved; }
}
function flat(node, out) {
  // Collect every string and number reachable from an html`` stub tree (strings + interpolated values).
  out = out || [];
  if (node == null || node === false) return out;
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out; }
  if (Array.isArray(node)) { node.forEach(function (n) { flat(n, out); }); return out; }
  if (node.strings) { node.strings.forEach(function (s) { out.push(s); }); flat(node.vals, out); return out; }
  return out;
}
function textOf(node) { return flat(node).join(' '); }
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

var VIVAS = [
  { id: 'v_done', type: 'viva', subject: 'Organic chemistry', topic: 'Reaction mechanisms', status: 'done', report: { percent: 87.4, grade: 'Distinction' }, updated: Date.now() - 3600e3 },
  { id: 'v_live', type: 'viva', subject: 'Thermodynamics', topic: 'Entropy', status: 'live', updated: Date.now() - 600e3 },
  { id: 'v_setup', type: 'viva', subject: '', status: 'setup', updated: Date.now() },
  { id: 'v_odd', type: 'viva', subject: 42, topic: null, status: 'weird', report: { percent: 'abc', grade: 7 } },
];

/* ---------- pure logic ---------- */
check('uiLightColor: balanced bright lights mix to near white', function () {
  var c = uiLightColor({ ethos: 90, pathos: 90, logos: 90 });
  var m = /rgb\((\d+) (\d+) (\d+)\)/.exec(c);
  assert(m, 'bad format ' + c);
  var ch = [+m[1], +m[2], +m[3]];
  ch.forEach(function (v) { assert(v >= 200 && v <= 255, 'channel out of range ' + c); });
  return c;
});
check('uiLightColor: a dominant light tints the mix', function () {
  var red = uiLightColor({ ethos: 20, pathos: 95, logos: 20 });
  var m = /rgb\((\d+) (\d+) (\d+)\)/.exec(red);
  assert(+m[1] > +m[2] && +m[1] > +m[3], 'pathos should lead red: ' + red);
  var blue = uiLightColor({ ethos: 95, pathos: 10, logos: 10 });
  var b = /rgb\((\d+) (\d+) (\d+)\)/.exec(blue);
  assert(+b[3] > +b[1], 'ethos should lead blue: ' + blue);
  return red + ' / ' + blue;
});
check('uiLightColor: empty and garbage input', function () {
  var outs = [uiLightColor(null), uiLightColor({}), uiLightColor({ ethos: null, pathos: NaN, logos: 'x' }), uiLightColor({ ethos: 400, pathos: -20, logos: 50 })];
  outs.forEach(function (c) { assert(/^rgb\(\d+ \d+ \d+\)$/.test(c), 'bad ' + c); });
  return outs.join(', ');
});
check('triLight falls back when limelightColor is missing or throws', function () {
  var c = triLight({ ethos: 60, pathos: 70, logos: 50 });
  assert(typeof c === 'string' && c.length > 3, 'no color');
  var had = typeof limelightColor === 'function' ? limelightColor : undefined;
  window.limelightColor = function () { throw new Error('boom'); };
  var d = triLight({ ethos: 60, pathos: 70, logos: 50 });
  if (had) window.limelightColor = had; else delete window.limelightColor;
  assert(/^rgb/.test(d), 'fallback not used: ' + d);
  return c;
});
check('triTicks draws three ticks per axis', function () {
  return POLE_KEYS.map(function (k) { var d = triTicks(k); assert((d.match(/M/g) || []).length === 3, 'ticks ' + k); return d.length; }).join(',');
});
check('splitThe', function () {
  var a = splitThe('The Storyteller'), b = splitThe('Your triangle'), c = splitThe(undefined);
  assert(a[0] === 'The' && a[1] === 'Storyteller'); assert(b[0] === null && b[1] === 'Your triangle'); assert(c[1] === '');
  return a.join('|') + ' ' + b.join('|');
});
check('examPercent validates', function () {
  var r = VIVAS.map(examPercent);
  assert(r[0] === 87 && r[1] === null && r[3] === null, JSON.stringify(r));
  assert(examPercent({ report: { percent: 140 } }) === 100);
  return JSON.stringify(r);
});
check('templeGeometry spaces columns evenly', function () {
  var g = templeGeometry(6);
  assert(g.cx(5) - g.cx(0) === 5 * g.pitch); assert(g.W > g.cx(5) + g.colW / 2);
  return g.W;
});
check('MEDAL_RAYS and GLINT_D are valid path strings', function () {
  assert(/^M36 36L/.test(MEDAL_RAYS) && (MEDAL_RAYS.match(/Z/g) || []).length === 16);
  var g = GLINT_D(10, 10, 4); assert(/^M10 6l/.test(g) && /z$/.test(g), g);
  return MEDAL_RAYS.length;
});

/* ---------- Triangle ---------- */
check('render Triangle variants', function () {
  Triangle({ scores: SAMPLE_PROFILE.scores, ghost: SAMPLE_PROFILE.first, mode: 'now', selected: null });
  Triangle({ scores: SAMPLE_PROFILE.scores, trail: SAMPLE_PROFILE.trail, mode: 'journey', selected: 'logos', onSelect: function () {} });
  Triangle({ scores: { ethos: null, pathos: null, logos: null } });
  Triangle({ scores: { ethos: 100, pathos: 0, logos: 104 }, size: 'sm' });
  Triangle({ scores: null });
  var t = textOf(Triangle({ scores: SAMPLE_PROFILE.scores }));
  assert(t.indexOf('tri-glow') >= 0 && t.indexOf('tri-sweep') >= 0 && t.indexOf('tri-lens') >= 0, 'missing showpiece layers');
  return 'ok';
});
check('render MiniTriangle', function () { MiniTriangle({ scores: null }); MiniTriangle({ scores: SAMPLE_PROFILE.scores, size: 60 }); });

/* ---------- Medals ---------- */
check('render BadgeMedal every badge, earned and locked', function () {
  BADGES.forEach(function (b) { BadgeMedal({ badge: b, earned: true, size: 80 }); BadgeMedal({ badge: b, earned: false }); });
  BadgeMedal({ badge: { id: 'x', icon: 'nope', tier: 'platinum' } });
  BadgeMedal({ badge: null });
  var gold = textOf(BadgeMedal({ badge: BADGES.find(function (b) { return b.tier === 'gold'; }), earned: true }));
  assert(gold.indexOf('medal-rays') >= 0 && gold.indexOf('medal-glint') >= 0, 'gold medal missing rays or glint');
  var locked = textOf(BadgeMedal({ badge: BADGES[0], earned: false }));
  assert(locked.indexOf('medal-glint') < 0, 'locked medal should not glint');
  return BADGES.length;
});
check('render LaurelLevel and LevelBadge', function () {
  [1, 9, 10, 42, 120].forEach(function (l) { LaurelLevel({ level: l }); LevelBadge({ level: l, size: 58 }); });
});
check('render LogoMark with custom ink', function () { LogoMark({ size: 24, ink: 'var(--stage-ink)' }); LogoMark({}); });

/* ---------- Home ---------- */
var freshProfile = defaultProfile(); ensureQuests(freshProfile);
check('render HomePage new user (not onboarded, no data)', function () {
  return withState({ profile: freshProfile, speeches: [], preps: [], vivas: [] }, function () {
    HomePage({});
    var t = textOf(HomeStage({ scores: SAMPLE_PROFILE.scores, example: true, trail: SAMPLE_PROFILE.trail, ghost: SAMPLE_PROFILE.first, triLine: 'x', onPoster: function () {} }));
    assert(t.indexOf('Example data') >= 0, 'example marker missing');
    return 'ok';
  });
});
check('render HomeStage new user', function () {
  return withState({ profile: freshProfile, speeches: [], preps: [], vivas: [] }, function () {
    var t = textOf(HomeStage({ scores: SAMPLE_PROFILE.scores, example: true, onPoster: function () {} }));
    assert(t.indexOf('Welcome to the Rostra.') >= 0, 'welcome greeting missing');
    assert(t.indexOf('Find your three lights.') >= 0, 'first-run headline missing');
    var tree = HomeStage({ scores: SAMPLE_PROFILE.scores, example: true, onPoster: function () {} });
    var acts = homeActions(freshProfile, [], [], true);
    assert(acts.length === 2 && acts[0].label === 'Analyze my first speech' && acts[1].to[1] === 'sample', 'first run offers one action and the sample');
    assert(t.indexOf('Make my poster') < 0, 'no poster until there is data');
    assert(t.indexOf('The Storyteller') < 0, 'no sample identity on first run');
    return tree ? 'ok' : 'no tree';
  });
});
check('first run: an exam student gets the exam first', function () {
  var p = Object.assign({}, freshProfile, { goal: 'exam' });
  var acts = homeActions(p, [], [], true);
  assert(acts[0].label === 'Take an oral exam' && acts[0].to[0] === 'viva', 'exam first');
  var later = homeActions(p, [], [{ id: 'd', status: 'done' }], true);
  assert(later[0].label === 'Take an oral exam' && later.filter(function (a) { return a.id === 'viva'; }).length === 1, 'exam stays primary, listed once');
  return 'ok';
});
check('homePrimary follows state', function () {
  var p = Object.assign({}, freshProfile);
  var live = homePrimary(p, [{ id: 'pr', brief: { title: 'Toast' } }], [{ id: 'x', subject: 'Optics', status: 'live' }]);
  assert(live.label === 'Resume your exam: Optics' && live.to[1] === 'x', 'live exam wins');
  var draft = homePrimary(p, [{ id: 'pr', brief: { title: 'Toast' } }], []);
  assert(draft.label === 'Continue: Toast' && draft.to[1] === 'pr', 'draft next');
  var odd = homePrimary(p, [{ id: 'pr' }], [{ id: 'x', subject: 42, status: 'live' }]);
  assert(odd.label === 'Resume your exam: oral exam', 'bad subject');
  var quest = homePrimary(p, [], []);
  assert(QUESTS[todayQuests(p).picks[0]].label === quest.label.split(' · ')[0], 'first unclaimed quest');
  return 'ok';
});
check('questGo lands on the thing itself', function () {
  var p = JSON.parse(JSON.stringify(freshProfile));
  assert(questGo('lesson', p, {})[0] === 'lesson', 'lesson opens a lesson');
  assert(questGo('drill', p, {})[1] === nextLesson(p).id, 'drill opens the next lesson');
  assert(questGo('viva', p, { vivas: [{ id: 'a', status: 'done' }, { id: 'b', status: 'live' }] })[1] === 'b', 'open exam');
  assert(questGo('viva', p, { vivas: [] }).length === 1, 'no exam goes to the setup list');
  assert(questGo('forge', p, { preps: [{ id: 'f', done: true }, { id: 'g' }] })[1] === 'g', 'open draft');
  p.stats.read = [LIBRARY[0].id];
  assert(questGo('read', p, {})[1] === LIBRARY[1].id, 'first unread speech');
  p.stats.read = LIBRARY.map(function (s) { return s.id; });
  assert(questGo('read', p, {})[0] === 'library', 'all read falls back');
  assert(questGo('revise', p, { vivas: [{ id: 'c', status: 'done', report: { cards: [1] } }] })[1] === 'c:revise', 'revise opens the cards');
  assert(questGo('analyze', p, {})[0] === 'analyze', 'default');
  return 'ok';
});
check('a drill alone does not finish a lesson', function () {
  var p = JSON.parse(JSON.stringify(freshProfile));
  var first = nextLesson(p);
  p.done[first.id] = { drill: 80 };
  assert(nextLesson(p).id === first.id, 'drill-only stays next');
  p.done[first.id] = { drill: 80, at: 1 };
  assert(nextLesson(p).id !== first.id, 'complete moves on');
  return 'ok';
});
check('closestBadge picks the highest ratio and skips earned', function () {
  var p = JSON.parse(JSON.stringify(freshProfile));
  assert(closestBadge(p) === null, 'nothing started');
  p.stats.fallacies = 20; p.stats.lessons = 2;
  assert(closestBadge(p).badge.id === 'fallacy_hunter', 'highest ratio');
  p.badges.fallacy_hunter = 1;
  assert(closestBadge(p).badge.id === 'scholar', 'skips earned');
  assert(closestBadge(p).value === 2 && closestBadge(p).max === 5, 'counts');
  return 'ok';
});
check('StreakCard copy', function () {
  var p = JSON.parse(JSON.stringify(freshProfile));
  p.streak = { count: 12, best: 12, last: addDays(dayKey(), -5), days: [] };
  var t = withState({ profile: p }, function () { return textOf(StreakCard({})); });
  assert(t.indexOf('Your 12-day streak ended') >= 0, 'lost streak');
  p.streak = { count: 1, best: 1, last: dayKey(), days: [dayKey()] };
  t = withState({ profile: p }, function () { return textOf(StreakCard({})); });
  assert(t.indexOf('Tomorrow’s first quest: ' + QUESTS[pickQuests(addDays(dayKey(), 1), p)[0]].label) >= 0, 'tomorrow');
  return 'ok';
});
check('TabBar and More sheet', function () {
  var t = textOf(TabBar({ tab: 'gym' }));
  assert(t.indexOf('More') >= 0, 'More tab');
  assert(NAV.find(function (n) { return n.id === 'viva'; }).label === 'Oral exam', 'nav label');
  var s = textOf(MoreSheet({ tab: 'gym', onClose: function () {} }));
  ['Learn', 'Gym', 'Library', 'Trophies', 'Sound'].forEach(function (w) { assert(s.indexOf(w) >= 0, w + ' missing'); });
  return 'ok';
});
check('Onboarding routes by goal', function () {
  var run = function (goal) {
    var went = null, saved = Router.go;
    Router.go = function (page) { went = page; };
    try {
      withState({ profile: Object.assign(defaultProfile(), { goal: goal }) }, function () {
        var tree = Onboarding({});
        var submit = tree.vals.filter(function (v) { return typeof v === 'function'; })[0];
        submit({ preventDefault: function () {} });
      });
    } finally { Router.go = saved; }
    return went;
  };
  assert(run('exam') === 'viva', 'exam goes to the exam room');
  assert(run('toast') === 'analyze', 'others go to analyze');
  return 'ok';
});
check('Rail admits when it cannot save', function () {
  var t = withState({ storageOk: false }, function () { return textOf(Rail({ tab: 'home' })); });
  assert(t.indexOf('Not saving') >= 0 && t.indexOf('Saved in this browser') < 0, 'not saving');
  t = textOf(Rail({ tab: 'home' }));
  assert(t.indexOf('Not saving') < 0, 'saving normally');
  return 'ok';
});
check('groupFlags merges identical word-pattern flags and keeps every quote', function () {
  var note = 'Sweeping claims invite one counterexample.';
  var g = groupFlags([
    { label: 'Sweeping claim', note: note, kind: 'weak', quote: 'always' },
    { label: 'Sweeping claim', note: note, kind: 'weak', quote: 'Always' },
    { label: 'Sweeping claim', note: note, kind: 'weak', start: 6, end: 11 },
    { label: 'Hedge', note: 'n', kind: 'weak', quote: 'maybe' },
  ], 'Hello never ever');
  assert(g.length === 2 && g[0].count === 3 && g[0].quotes.length === 2 && g[0].quotes[1] === 'never', JSON.stringify(g));
  var ai = groupFlags([{ label: 'Hasty', note: 'a', kind: 'fallacy', quote: 'x' }, { label: 'Hasty', note: 'b', kind: 'fallacy', quote: 'y' }], '');
  assert(ai.length === 2, 'different notes stay separate');
  assert(groupFlags(null, '').length === 0, 'empty');
  return 'ok';
});
check('reportNextSteps always offers a next step', function () {
  var p = JSON.parse(JSON.stringify(freshProfile));
  var sp = { id: 's1', transcript: 'words', title: 'T', occasion: 'toast' };
  var here = reportNextSteps(sp, [{ id: 's1_l0', title: 'Own the room' }], p);
  assert(here[0].label === 'Start lesson: Own the room · +40 XP', 'lesson from this speech');
  assert(here[1].label === 'Edit and analyze again' && here[1].to[1].text === 'words', 'edit keeps the text');
  var none = reportNextSteps(sp, [], p);
  assert(/^Train /.test(none[0].label), 'core lesson when AI is off');
  var audio = reportNextSteps({ id: 's2' }, [], p);
  assert(audio.every(function (s) { return s.label !== 'Edit and analyze again'; }), 'no edit without a transcript');
  assert(reportNextSteps({ sample: true }, [], p)[0].label === 'Analyze my first speech', 'sample');
  return 'ok';
});
check('AI-off report hides the coach, on-device report offers the upgrade', function () {
  var heur = { summary: 's', strengths: ['You finished a draft.'], growth: ['a', 'b', 'c'], marks: [
    { kind: 'weak', label: 'Hedge', note: 'n', quote: 'maybe' }, { kind: 'weak', label: 'Hedge', note: 'n', quote: 'perhaps' }] };
  var sp = Object.assign({}, getSample(), { id: 's_h', sample: false, ai: null, heur: heur, aiError: null, xp: 50 });
  var state = function (ai) { return { ai: ai, speeches: [sp], profile: freshProfile }; };
  var off = withState(state('off'), function () { return textOf(ReportPage({ id: 's_h' })); });
  assert(off.indexOf('Ask the coach about it') < 0, 'coach hidden');
  assert(off.indexOf('Get the full coach read') < 0, 'no upgrade while AI is off');
  assert(off.indexOf('Your next ') >= 0 && off.indexOf('Make my poster') >= 0, 'moves and poster');
  assert(off.indexOf('Rehearse it in the Gym') >= 0, 'next-step row');
  var on = withState(state('ready'), function () { return textOf(ReportPage({ id: 's_h' })); });
  assert(on.indexOf('Ask the coach about it') >= 0, 'coach shown');
  assert(on.indexOf('Get the full coach read') >= 0, 'upgrade offered for an on-device report');
  return 'ok';
});
check('analyzeXpHint matches the XP rule', function () {
  assert(analyzeXpHint(75, false, false, false).indexOf('+50 XP at this length, +100 from 150 words') === 0, analyzeXpHint(75, false, false, false));
  assert(analyzeXpHint(30, false, false, false).indexOf('+25 XP') === 0, 'floor');
  assert(analyzeXpHint(300, false, true, false).indexOf('+100 XP, more if') === 0, 'full');
  assert(analyzeXpHint(0, true, false, true).indexOf('+100 XP.') === 0, 'recording without text has no coach bonus');
  assert(analyzeXpHint(300, false, false, true).indexOf('+120 XP.') === 0, 'coach bonus');
  assert(analyzeXpHint(300, false, false, false).indexOf('earns 0') > 0, 'repeat');
  return 'ok';
});
check('No speech handy only shows on an empty first form', function () {
  var t = withState({ speeches: [] }, function () { return textOf(AnalyzePage({})); });
  assert(t.indexOf('No speech handy?') >= 0, 'shown');
  t = withState({ speeches: [] }, function () { return textOf(AnalyzePage({ param: { text: 'some words here' } })); });
  assert(t.indexOf('No speech handy?') < 0, 'hidden with text');
  assert(typeof gymPickPrompt(GYM_CATS[0].id) === 'string' && gymPickPrompt(GYM_CATS[0].id).length > 0, 'prompts available');
  return 'ok';
});
check('render HomePage with data and vivas', function () {
  return withState({ vivas: VIVAS }, function () {
    var t = textOf(HomePage({}));
    assert(t.indexOf('Recent oral exams') >= 0, 'exam list missing');
    assert(t.indexOf('Continue: ') >= 0, 'continue tile missing');
    return Store.state.speeches.length + ' speeches';
  });
});
check('render HomePage with data, no vivas', function () { return withState({ vivas: [] }, function () { HomePage({}); return 'ok'; }); });
check('render HomeStage with data (onboarded, named)', function () {
  var p = clone(Store.state.profile); p.name = 'Ada'; p.onboarded = true;
  return withState({ profile: p }, function () {
    var t = textOf(HomeStage({ scores: p.skills, example: false, onPoster: function () {} }));
    assert(t.indexOf(', Ada.') >= 0, 'name greeting missing');
    assert(t.indexOf('Example data') < 0, 'should not be example');
    return 'ok';
  });
});
check('render HomeStage partial scores', function () { HomeStage({ scores: { ethos: 60, pathos: null, logos: null }, example: false, onPoster: function () {} }); HomeStage({ scores: null }); });
check('Greek numerals', function () {
  assert(greekNumeral(1) === 'αʹ' && greekNumeral(6) === 'ϛʹ' && greekNumeral(11) === 'ιαʹ' && greekNumeral(99) === 'ϟθʹ' && greekNumeral(120) === 'ρκʹ', 'numerals');
  assert(greekNumeral(0) === '0' && greekNumeral(1000) === '1000', 'out of range stays digits');
});
check('every word has its Greek', function () {
  assert(LEVEL_GREEK.length === LEVEL_TITLES.length, 'ranks');
  assert(levelInfo(1180).greek === 'δήμαρχος', 'rank in levelInfo');
  assert(levelInfo(999999).greek, 'rank past the last title');
  NAV.forEach(function (n) { assert(n.greek, 'nav ' + n.id); });
  POLE_KEYS.forEach(function (k) { Object.keys(POLES[k].subs).forEach(function (s) { assert(POLES[k].subsGreek[s], 'sub ' + s); }); });
  Object.keys(ARCHETYPES).forEach(function (k) { assert(ARCHETYPES[k].greek, 'archetype ' + k); if (ARCHETYPES[k].fig) assert(FIGURES[ARCHETYPES[k].fig], 'figure ' + k); });
  Object.keys(FIGURES).forEach(function (k) { var F = FIGURES[k]; assert(F.greek && F.name && F.def, 'figure ' + k); });
});
check('render Scholion and PageHead', function () {
  var plain = textOf(Scholion({ children: 'A plain line.' }));
  assert(plain.indexOf('scho-note') < 0, 'no note without a figure');
  var fig = textOf(Scholion({ fig: 'metaphor', children: 'A line.' }));
  assert(fig.indexOf('μεταφορά') >= 0 && fig.indexOf('Metaphor') >= 0, 'figure names');
  var src = textOf(Scholion({ note: 'Πλούταρχος', sub: 'Plutarch', def: 'Life of Demosthenes', children: 'A line.' }));
  assert(src.indexOf('Πλούταρχος') >= 0, 'source note');
  var head = textOf(PageHead({ label: 'Analyze', greek: 'ἀνάλυσις', title: 'T', fig: 'anaphora', line: 'L', end: null }));
  assert(head.indexOf('ἀνάλυσις') >= 0 && head.indexOf('Analyze') >= 0, 'whisper');
  PageHead({ greek: 'λόγος', title: 'T' });
});
check('render ExamRow all statuses', function () { VIVAS.forEach(function (v) { ExamRow({ v: v }); }); });
check('ExamRow shows percent and grade when graded', function () {
  var t = textOf(ExamRow({ v: VIVAS[0] }));
  assert(t.indexOf('87') >= 0 && t.indexOf('Distinction') >= 0, t);
  var live = textOf(ExamRow({ v: VIVAS[1] }));
  assert(live.indexOf('Resume') >= 0, 'resume missing');
  return 'ok';
});
check('render ExamEmpty', function () { ExamEmpty({}); });
check('render home cards', function () { QuestsCard({}); StreakCard({}); LevelCard({}); Onboarding({}); });
check('render QuestsCard on a stale day', function () {
  var p = clone(Store.state.profile); p.quests = { day: '1999-01-01', picks: [], progress: {}, claimed: {}, chest: false };
  return withState({ profile: p }, function () { QuestsCard({}); return 'ok'; });
});

/* ---------- Report ---------- */
check('render ReportPage sample', function () { ReportPage({ id: 'sample' }); });
check('render ReportPage real + missing', function () { ReportPage({ id: 's_test' }); ReportPage({ id: 'nope' }); });
check('render ReportPage with curtain pending', function () {
  Celebrate.pending = 's_test';
  var t = textOf(ReportPage({ id: 's_test' }));
  Celebrate.pending = null;
  return t.length;
});
check('render ReportStage sample and delivery-only', function () {
  var s = getSample();
  ReportStage({ sp: s, prev: null });
  var d = clone(s); d.ai = null; d.heur = null; d.transcript = ''; d.scores = { ethos: 66, pathos: 58, logos: null, overall: 61 }; d.sample = false; d.source = {};
  ReportStage({ sp: d, prev: s });
  var t = textOf(ReportStage({ sp: s, prev: null }));
  assert(t.indexOf('overall') >= 0, 'overall missing');
  return 'ok';
});
check('render SpotlitScore variants', function () {
  var s = getSample();
  POLE_KEYS.forEach(function (k, i) { SpotlitScore({ k: k, sp: s, prev: s, index: i }); });
  var d = clone(s); d.ai = null; d.heur = null; d.scores = { ethos: null, pathos: null, logos: null };
  SpotlitScore({ k: 'logos', sp: d, prev: null });
});
check('render StructureTemple', function () {
  StructureTemple({ parts: getSample().ai.structure });
  StructureTemple({ parts: [{ part: 'Only', verdict: 'missing' }] });
  StructureTemple({ parts: [{ part: 'A', verdict: 'weak' }, { part: 'B', verdict: 'unknown' }, null, { verdict: 'strong' }] });
  assert(StructureTemple({ parts: [] }) === null && StructureTemple({}) === null, 'empty should render nothing');
  var t = textOf(StructureTemple({ parts: getSample().ai.structure }));
  assert(t.indexOf('temple-crack') >= 0, 'weak part should crack');
  return 'ok';
});
check('render RunTheater on stage', function () {
  RunTheater({ run: { stage: 'ai', p: 0, chars: 1200 }, plan: [{ id: 'ai', label: 'Reading', icon: 'sparkles' }], onStop: function () {} });
});
check('new icons exist', function () { ['eye', 'lamp', 'laurel', 'scroll', 'dumbbell', 'image'].forEach(function (n) { if (!ICONS[n]) throw new Error('missing icon ' + n); }); });
