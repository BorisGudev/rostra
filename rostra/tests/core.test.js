// Core logic and render checks. Run through tests/harness.js.

check('sample report', function () { var s = getSample(); return { words: s.words, wpm: s.delivery.wpm, scores: s.scores, arch: s.archetype }; });
check('sample quotes all found', function () {
  var marks = placeMarks(SAMPLE_TRANSCRIPT, SAMPLE_AI.highlights);
  var placed = marks.map(function (m) { return m.idx; });
  var missing = SAMPLE_AI.highlights.filter(function (h, i) { return placed.indexOf(i) < 0; }).map(function (h) { return h.quote; });
  if (missing.length) throw new Error('missing: ' + missing.join(' | '));
  return marks.length + '/' + SAMPLE_AI.highlights.length;
});
check('library quotes all found', function () {
  var out = [];
  LIBRARY.forEach(function (s) {
    var placed = placeMarks(s.text, s.notes).map(function (m) { return m.idx; });
    s.notes.forEach(function (n, i) { if (placed.indexOf(i) < 0) out.push(s.id + ': ' + n.quote); });
  });
  if (out.length) throw new Error('missing:\n  ' + out.join('\n  '));
  return LIBRARY.length + ' speeches, ' + LIBRARY.reduce(function (a, s) { return a + s.notes.length; }, 0) + ' notes';
});
check('lesson + arcade data shape', function () {
  allCoreLessons().forEach(function (l) {
    if (!l.id || !POLES[l.pole] || !l.title || !l.drill) throw new Error('bad lesson ' + l.id);
    (l.quiz || []).forEach(function (q) { if (!(q.answer >= 0 && q.answer < q.options.length)) throw new Error('bad quiz answer in ' + l.id); });
  });
  var labels = {}; FALLACIES.concat(DEVICES).forEach(function (f) { if (!f.text || !f.answer || !f.why) throw new Error('bad arcade item'); });
  return allCoreLessons().length + ' lessons, ' + FALLACIES.length + ' fallacies, ' + DEVICES.length + ' devices';
});
check('heuristics', function () { var h = heuristicContent(SAMPLE_TRANSCRIPT); return { scores: h.scores, marks: h.marks.length }; });
check('vtt parse + caption metrics', function () {
  var vtt = 'WEBVTT\n\n1\n00:00:00.500 --> 00:00:03.200\nJane Doe: Good morning everyone, thank you for coming.\n\n2\n00:00:04.400 --> 00:00:07.900\nToday I want to talk about why we should ship every week.\n\n3\n00:00:08.000 --> 00:00:11.000\nUm, first, the data shows faster feedback.\n\n4\n00:00:12.500 --> 00:00:15.000\nSecond, smaller releases mean fewer bugs.\n';
  var r = readTranscriptFile('talk.vtt', vtt);
  var m = metricsFromCues(r.cues);
  var d = scoreDelivery(m, wordsOf(r.text).length, 'presentation', findFillers(r.text).length);
  return { cues: r.cues.length, wpm: d.wpm };
});
check('fillers', function () { return findFillers('So, like, I mean, um, you know what? You know, it was basically fine. Uh I like cats.').map(function (f) { return f.word; }).join(','); });
check('levels', function () { return [0, 100, 260, 1000, 4000, 6000].map(function (x) { var l = levelInfo(x); return l.level + ':' + l.title; }).join(' '); });
check('archetypes', function () { return [{ ethos: 70, pathos: 55, logos: 60 }, { ethos: 60, pathos: 61, logos: 59 }, { ethos: 50, pathos: 75, logos: 72 }].map(function (s) { return archetypeOf(s).name; }).join(', '); });
check('quests pick 3 distinct', function () { var q = pickQuests(dayKey()); if (q.length !== 3 || new Set(q).size !== 3) throw new Error(q.join()); q.forEach(function (k) { if (!QUESTS[k]) throw new Error('unknown quest ' + k); }); return q.join(','); });
check('badge rules exist for every badge', function () { BADGES.forEach(function (b) { if (!BADGE_RULES[b.id]) throw new Error('no rule for ' + b.id); if (!ICONS[b.icon]) throw new Error('no icon ' + b.icon); }); return BADGES.length; });
var events = [];
FX.on(function (t) { events.push(t); });
check('store act + addSpeech + badges', function () {
  Store.act(function (p, ctx) { p.onboarded = true; ctx.xp(20, 'x'); });
  var sp = JSON.parse(JSON.stringify(getSample())); sp.id = 's_test'; sp.sample = false;
  Store.addSpeech(sp);
  var p = Store.state.profile;
  return { xp: p.xp, badges: Object.keys(p.badges), lessons: p.lessons.length, events: events.join(',') };
});
check('saveViva / deleteViva', function () { var v = Store.saveViva({ id: 'v_test', subject: 'x' }); if (Store.state.vivas[0].id !== 'v_test') throw new Error('not saved'); Store.deleteViva('v_test'); return Store.state.vivas.length; });
check('normalizeAnalysis garbage', function () { return normalizeAnalysis({ scores: { ethos: '72', pathos: null }, highlights: [{ quote: 'x y z', kind: 'nope' }], lessons: [{ drill: 'do it' }] }).scores; });
check('prompts build', function () { var p = Store.state.profile; return [analysisPrompt({ transcript: 'hi', occasion: 'pitch', focus: ['Clarity'], profile: p, metrics: getSample().metrics, delivery: getSample().delivery }).length, coachRules(p, Store.state.speeches).length].join(','); });
check('markdown', function () { return reportMarkdown(getSample()).length; });
check('kit: klepsydra, meander, countdown, voice', function () { Klepsydra({ total: 60, remaining: 12, running: true }); Klepsydra({ total: 60, remaining: -5 }); MeanderBar({ value: 40 }); Meander({}); useCountdown({ seconds: 30, running: false, resetKey: 1 }); Voice.speak('hi'); return 'voice ' + Voice.ok; });

var prep = Store.savePrep(newPrep(Store.state.profile));
var fullPrep = Object.assign({}, prep, { brief: Object.assign({}, prep.brief, { title: 'Ship weekly', goal: 'Approve a pilot', material: 'Faster feedback' }), angles: clone(FALLBACK_ANGLES), questions: [{ q: 'Why?', a: 'Because' }], angleIdx: 1, angle: FALLBACK_ANGLES[1], sections: fallbackSections(FALLBACK_ANGLES[1], 5), core: 'Weekly releases cut risk', slides: [{ title: 'T', visual: 'v', text: 't', notes: 'n', pole: 'ethos' }] });
fullPrep.sections[0].text = 'Right now our customers wait six weeks for every fix, and it costs us churn every month.';
fullPrep.sections[0].feedback = { scores: { ethos: 60, pathos: 50, logos: 70 }, verdict: 'Good', keep: 'six weeks', improve: 'add source', question: 'Who?', flags: [{ quote: 'x', issue: 'vague', note: 'n' }] };
fullPrep.sections[0].nudge = { questions: ['q1'], starters: ['Last week…'] };
Store.savePrep(fullPrep);
var comps = {
  HomePage: [{}], AnalyzePage: [{}], 'AnalyzePage(prefill)': [{ param: { text: 'abc def', title: 't', occasion: 'pitch' } }], 'ReportPage(sample)': [{ id: 'sample' }], 'ReportPage(real)': [{ id: 's_test' }], 'ReportPage(missing)': [{ id: 'nope' }],
  PreparePage: [{}], LearnPage: [{}], 'LearnPage(pole)': [{ param: 'ethos' }], 'LessonPage(core)': [{ id: 'e1' }], 'LessonPage(sample)': [{ id: 'sample_l0' }], 'LessonPage(mine)': [{ id: 's_test_l0' }],
  GamePage: [{ param: 'fallacy' }], 'GamePage(device)': [{ param: 'device' }], LibraryPage: [{}], SpeechPage: [{ id: 'antony' }], TrophiesPage: [{}], CoachDrawer: [{ seed: 'hi', onClose: function () {} }],
  VivaPage: [{}], GymPage: [{}],
  Onboarding: [{}], QuestsCard: [{}], StreakCard: [{}], LevelCard: [{}], FxLayer: [{}], Rail: [{ tab: 'home' }], TopBar: [{ route: { page: 'report', param: 'x' } }], TabBar: [{ tab: 'home' }], App: [{ initial: {} }],
  'PolePanel(none)': [{ sel: null, setSel: function () {}, scores: SAMPLE_PROFILE.scores, profile: Store.state.profile, example: true }],
  'PolePanel(sel)': [{ sel: 'pathos', setSel: function () {}, scores: SAMPLE_PROFILE.scores, profile: Store.state.profile, example: false }],
  Triangle: [{ scores: SAMPLE_PROFILE.scores, ghost: SAMPLE_PROFILE.first, trail: SAMPLE_PROFILE.trail, mode: 'journey', selected: 'ethos' }],
  'Triangle(null)': [{ scores: { ethos: null, pathos: null, logos: null } }],
  MiniTriangle: [{ scores: { ethos: 50, pathos: null, logos: 70 } }], Waveform: [{ wave: getSample().metrics.wave, duration: 112, pauses: getSample().metrics.pauses.list }],
  ArcChart: [{ timeline: getSample().metrics.timeline, duration: 112 }], DeliverySection: [{ sp: getSample() }], Annotated: [{ text: SAMPLE_TRANSCRIPT, items: SAMPLE_AI.highlights }],
  NoteCard: [{ item: SAMPLE_AI.highlights[3], onClose: function () {} }], BadgeMedal: [{ badge: BADGES[0], earned: false }], LaurelLevel: [{ level: 4 }], LevelBadge: [{ level: 2 }],
  RunTheater: [{ run: { stage: 'pitch', p: 0.4, chars: 0 }, plan: [{ id: 'decode', label: 'a', icon: 'wave' }, { id: 'pitch', label: 'b', icon: 'trend' }, { id: 'ai', label: 'c', icon: 'sparkles' }], onStop: function () {} }],
  Prompter: [{ text: 'Hello // world', onClose: function () {} }], Sparkline: [{ values: [1, 5, 3], color: 'red' }], Ring: [{ value: 50 }], Gauge: [{ value: 3, min: 0, max: 8, band: [2, 5] }],
  MiniMd: [{ text: 'Hi **there**\n\n- one\n- two' }], SpeechRow: [{ s: getSample(), example: true }], MetricTile: [{ label: 'x', value: 1, score: 80 }],
};
Object.keys(comps).forEach(function (k) { var fn = window[k.split('(')[0]]; check('render ' + k, function () { if (typeof fn !== 'function') throw new Error('not a function'); fn.apply(null, comps[k]); }); });
['brief', 'angles', 'build', 'finish'].forEach(function (stage) {
  check('render PrepEditor:' + stage, function () { var x = Object.assign({}, Store.state.preps.find(function (p) { return p.id === fullPrep.id; }), { stage: stage }); Store.savePrep(x); PrepEditor({ id: fullPrep.id }); });
});
check('render PrepList', function () { PrepList(); });
