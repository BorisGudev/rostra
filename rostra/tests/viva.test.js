// Oral exam: pure logic with garbage input, then every screen deep-rendered through the html stub.
// Run through tests/harness.js after core.test.js. Names are prefixed so they don't collide with other test files.

function vtAssert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function vtEq(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', wanted ' + JSON.stringify(b)); }
function vtState(patch, fn) {
  var saved = Store.state;
  Store.state = Object.assign({}, saved, patch);
  try { return fn(); } finally { Store.state = saved; }
}
// Walks an html`` stub. `<${Comp} a=${1} b=${2} />` shows up as strings ['<', ' a=', ' b=', ' />'] with vals
// [Comp, 1, 2], so components can be found, given their interpolated props and called, depth first.
// This evaluates the whole tree under a page the way React would, and collects its text and class names.
function vtWalk(node, out) {
  out = out || { text: [], calls: 0, seen: {} };
  if (node == null || node === false || node === true) return out;
  if (typeof node === 'string' || typeof node === 'number') { out.text.push(String(node)); return out; }
  if (Array.isArray(node)) { node.forEach(function (n) { vtWalk(n, out); }); return out; }
  if (!node.strings) return out;
  var strings = node.strings, vals = node.vals;
  for (var i = 0; i < strings.length; i++) {
    out.text.push(strings[i]);
    if (i >= vals.length) break;
    var v = vals[i], before = strings[i];
    if (typeof v === 'function' && /<$/.test(before)) {
      var props = {}, j = i + 1, m;
      while (j < vals.length && strings[j].indexOf('>') < 0 && (m = /\s([A-Za-z-]+)=$/.exec(strings[j]))) { props[m[1]] = vals[j]; j++; }
      for (var k = i + 1; k <= j; k++) {
        var chunk = strings[k], stop = chunk.indexOf('>'), re = /\s([A-Za-z-]+)="([^"]*)"/g, s;
        if (stop >= 0) chunk = chunk.slice(0, stop);
        while ((s = re.exec(chunk))) props[s[1]] = s[2];
      }
      out.seen[v.name] = true;
      out.calls++;
      vtWalk(v(props), out);
      i = j - 1;
    } else if (typeof v !== 'function') {
      if (/\s(aria-label|title|placeholder)=$/.test(before)) out.text.push(String(v));
      else if (!/=$/.test(before) || /\sclassName=$/.test(before)) vtWalk(v, out);
    }
  }
  return out;
}
function vtRender(node) { var r = vtWalk(node); r.all = r.text.join(''); return r; }
function vtHas(r, s) { vtAssert(r.all.indexOf(s) >= 0, 'missing text: ' + s); }

var VT_DOC = { format: 'standard', persona: 'socratic', subject: 'Thermodynamics', topic: 'Entropy; the second law', level: 'undergrad' };

/* ---------- Grade bands ---------- */
check('viva: grade bands at each boundary', function () {
  [[100, 'Distinction'], [85, 'Distinction'], [84.9, 'Merit'], [70, 'Merit'], [69.9, 'Pass'], [55, 'Pass'], [54.9, 'Not yet'], [0, 'Not yet']].forEach(function (c) { vtEq(vivaGrade(c[0]).id, c[1], 'grade of ' + c[0]); });
});
check('viva: grade survives garbage', function () {
  [NaN, undefined, null, 'abc', {}, [], -5, Infinity, -Infinity].forEach(function (x) { vtEq(vivaGrade(x).id, 'Not yet', 'grade of ' + String(x)); });
  vtEq(vivaGrade('90').id, 'Distinction');
});

/* ---------- Plan normalization ---------- */
function vtQ(i, extra) { return Object.assign({ q: 'Explain idea number ' + i + ' and why it holds true.', concept: 'Idea ' + i, difficulty: 2, key_points: ['one', 'two', 'three'], examiner: 'elenchos' }, extra || {}); }
check('viva: plan normalizes a good reply', function () {
  var raw = { title: 'Heat', opening: 'Welcome.', questions: [vtQ(1), vtQ(2), vtQ(3), vtQ(4), vtQ(5), vtQ(6)] };
  var p = vivaNormPlan(raw, VT_DOC);
  vtEq(p.questions.length, 5, 'capped at the format size');
  vtEq(p.title, 'Heat'); vtEq(p.opening, 'Welcome.');
  p.questions.forEach(function (q, i) { vtEq(q.id, 'q' + (i + 1)); vtEq(q.examiner, 'elenchos'); vtAssert(q.keyPoints.length === 3); });
});
check('viva: plan rejects garbage', function () {
  [null, undefined, 7, 'text', [], {}, { questions: 'no' }, { questions: [] }, { questions: [null, 3, 'x', {}, { q: 'short' }] }].forEach(function (raw) {
    vtEq(vivaNormPlan(raw, VT_DOC), null, 'expected null for ' + JSON.stringify(raw));
  });
});
check('viva: plan cleans bad fields, dedupes and tops up from the bank', function () {
  var raw = { title: 42, opening: { a: 1 }, questions: [
    { question: 'What is entropy, and why does it never fall?', concept: { no: 1 }, difficulty: 'hard', key_points: 'none', examiner: 'nobody' },
    { q: 'What is entropy, and why does it never fall?' },
    { q: 'Derive the Carnot limit out loud, step by step.', difficulty: 99, keyPoints: [1, null, {}, 'A real point'], examiner: 3 },
    { q: 'x'.repeat(900) },
  ] };
  var p = vivaNormPlan(raw, VT_DOC);
  vtEq(p.questions.length, 5, 'topped up to format size');
  var byQ = function (s) { return p.questions.filter(function (q) { return q.q.indexOf(s) === 0; })[0]; };
  for (var o = 1; o < p.questions.length; o++) vtAssert(p.questions[o].difficulty >= p.questions[o - 1].difficulty, 'sorted easiest first');
  var eq1 = byQ('What is entropy'), eq2 = byQ('Derive the Carnot');
  vtEq(eq1.examiner, 'elenchos', 'unknown examiner replaced');
  vtEq(eq1.difficulty, 2, 'bad difficulty defaults');
  vtEq(eq1.concept, 'Entropy; the second law', 'bad concept falls back to topic');
  vtAssert(eq1.keyPoints.length >= 3, 'default key points');
  vtEq(eq2.difficulty, 3, 'difficulty clamped');
  vtEq(eq2.keyPoints[0], '1', 'numbers kept as text');
  vtAssert(byQ('xxx').q.length <= 400, 'long question clipped');
  vtEq(p.title, '42'); vtAssert(p.opening.length > 10, 'opening falls back to the examiner');
  var ids = {}; p.questions.forEach(function (q) { vtAssert(!ids[q.q], 'duplicate question'); ids[q.q] = 1; });
  ids = {}; p.questions.forEach(function (q) { vtAssert(!ids[q.id], 'duplicate id'); ids[q.id] = 1; });
});
check('viva: panel plan keeps valid examiners and rotates the rest', function () {
  var doc = { format: 'qualifying', persona: 'panel', subject: 'Law' };
  var p = vivaNormPlan({ questions: [vtQ(1, { examiner: 'skepsis' }), vtQ(2, { examiner: 'elenchos' })] }, doc);
  vtEq(p.questions.length, 7);
  vtAssert(p.questions.some(function (q) { return q.q === vtQ(1).q && q.examiner === 'skepsis'; }), 'a valid examiner is kept');
  p.questions.forEach(function (q) { vtAssert(['theoria', 'praxis', 'skepsis'].indexOf(q.examiner) >= 0, 'examiner off the panel: ' + q.examiner); });
});

/* ---------- Evaluation normalization ---------- */
check('viva: eval normalizes a good reply', function () {
  var e = vivaNormEval({ scores: { accuracy: 82, depth: '70', reasoning: 66.6, communication: 900 }, covered: ['a', 3, null], misconception: '', notes: 'n', reaction: 'r', next: { action: 'followup', type: 'challenge', question: 'Why would that fail at the limit?', examiner: 'elenchos' } }, { follows: 0, examinerIds: ['elenchos'], defaultExaminer: 'elenchos' });
  vtEq(e.scores.accuracy, 82); vtEq(e.scores.depth, 70); vtEq(e.scores.reasoning, 67); vtEq(e.scores.communication, 100, 'clamped');
  vtEq(e.covered.length, 2); vtEq(e.next.action, 'followup'); vtEq(e.next.type, 'challenge'); vtEq(e.self, false);
});
check('viva: eval rejects garbage', function () {
  [null, undefined, 3, 'bad', [], {}, { scores: {} }, { scores: 'x' }, { scores: { accuracy: 'high', depth: null } }].forEach(function (raw) {
    vtEq(vivaNormEval(raw, {}), null, 'expected null for ' + JSON.stringify(raw));
  });
});
check('viva: eval fills missing marks and cleans the next move', function () {
  var e = vivaNormEval({ accuracy: 40, next: { action: 'followup', type: 'sing', question: 'ok?', examiner: 'ghost' } }, { follows: 0, examinerIds: ['elenchos'], defaultExaminer: 'elenchos' });
  vtEq(e.scores.accuracy, 40); vtEq(e.scores.depth, 50, 'missing mark is neutral');
  vtEq(e.next.action, 'move_on', 'too-short follow-up is dropped'); vtEq(e.next.question, '');
  vtEq(e.next.type, 'probe'); vtEq(e.next.examiner, 'elenchos');
  var capped = vivaNormEval({ scores: { accuracy: 80 }, next: { action: 'followup', question: 'A perfectly fine third follow-up?' } }, { follows: 2, examinerIds: ['elenchos'] });
  vtEq(capped.next.action, 'move_on', 'two follow-ups is the cap');
  var odd = vivaNormEval({ scores: { accuracy: 50 }, next: 'followup', covered: 'all', notes: {}, reaction: [], misconception: 9 }, {});
  vtEq(odd.next.action, 'move_on'); vtEq(odd.covered.length, 0); vtEq(odd.notes, ''); vtEq(odd.reaction, ''); vtEq(odd.next.examiner, 'elenchos');
});
check('viva: low whole marks stay low, only fractions or a declared scale read as out of ten', function () {
  var low = vivaNormEval({ scores: { accuracy: 5, depth: 8, reasoning: 3, communication: 10 } }, {});
  vtEq(low.scores.accuracy, 5, 'an empty answer must not become 50'); vtEq(low.scores.communication, 10);
  var tenths = vivaNormEval({ scores: { accuracy: 7.5, depth: 8, reasoning: 6, communication: 9 } }, {});
  vtEq(tenths.scores.accuracy, 75); vtEq(tenths.scores.depth, 80);
  var declared = vivaNormEval({ scale: 10, scores: { accuracy: 7, depth: 8, reasoning: 6, communication: 9 } }, {});
  vtEq(declared.scores.reasoning, 60);
  var zero = vivaNormEval({ scores: { accuracy: 0, depth: 0, reasoning: 0, communication: 0 } }, {});
  vtEq(zero.scores.accuracy, 0);
});

/* ---------- Offline exam ---------- */
check('viva: offline exam fits every format and persona', function () {
  Object.keys(VIVA_FORMATS).forEach(function (fid) {
    Object.keys(VIVA_PERSONAS).forEach(function (pid) {
      var doc = { format: fid, persona: pid, subject: 'Optics', topic: 'refraction; lenses' };
      var plan = vivaFallbackPlan(doc);
      vtEq(plan.questions.length, VIVA_FORMATS[fid].n, fid + ' size');
      plan.questions.forEach(function (q) {
        vtAssert(typeof q.q === 'string' && q.q.length > 20, 'question text');
        vtAssert(q.keyPoints.length >= 3, 'key points');
        vtAssert(VIVA_PERSONAS[pid].examiners.indexOf(q.examiner) >= 0, pid + ' examiner ' + q.examiner);
        vtAssert(VIVA_EXAMINERS[q.examiner], 'examiner exists');
        vtAssert(q.q.indexOf('undefined') < 0 && q.q.indexOf('null') < 0, 'bad interpolation: ' + q.q);
      });
    });
  });
});
check('viva: offline exam survives empty and odd documents', function () {
  [{}, { subject: '' }, { subject: 42, topic: null, material: 7, focus: 'x', format: 'nope', persona: 'nope' }].forEach(function (doc) {
    var plan = vivaFallbackPlan(doc);
    vtEq(plan.questions.length, 5);
    vtAssert(plan.opening.length > 10, 'has an opening');
    plan.questions.forEach(function (q) { vtAssert(q.q.indexOf('undefined') < 0, q.q); });
  });
});
check('viva: offline exam is grounded in pasted material and retake gaps', function () {
  var material = new Array(4).join('The Krebs cycle feeds oxidative phosphorylation. Mitochondria run oxidative phosphorylation across membranes. The Krebs cycle needs oxygen indirectly. ');
  var doc = { format: 'quick', persona: 'socratic', subject: 'Biochemistry', material: material, focus: ['Enzyme kinetics'] };
  var qs = vivaFallbackPlan(doc).questions;
  vtAssert(qs[0].q.indexOf('Enzyme kinetics') >= 0, 'first question targets the retake gap');
  vtAssert(qs.some(function (q) { return /krebs cycle|oxidative phosphorylation/i.test(q.q); }), 'uses key terms from material');
});

/* ---------- Offline marking and flow ---------- */
function vtTurn(over) { return vivaMakeTurn(Object.assign({ qi: 0, kind: 'main', q: 'What is entropy, exactly?', examiner: 'elenchos' }, over || {})); }
check('viva: self marks map to the rubric, and missed key points cap accuracy', function () {
  var turn = vtTurn(), plan = { keyPoints: ['a', 'b', 'c', 'd'], concept: 'Entropy' };
  var top = vivaSelfEval({ marks: { accuracy: 5, depth: 5, reasoning: 5, communication: 5 }, covered: [0, 1, 2], turn: turn, plan: plan, follows: 0, ids: ['elenchos'], rnd: function () { return 0; } });
  vtEq(top.scores.accuracy, 95); vtEq(top.self, true); vtEq(top.covered.length, 3);
  var bluff = vivaSelfEval({ marks: { accuracy: 5, depth: 5, reasoning: 5, communication: 5 }, covered: [0], turn: turn, plan: plan, follows: 0, ids: ['elenchos'] });
  vtEq(bluff.scores.accuracy, 62, 'capped when under half the key points'); vtEq(bluff.scores.communication, 95);
  var junk = vivaSelfEval({ marks: { accuracy: 'x', depth: 99, reasoning: -4 }, covered: ['a', 7, -1, 1.5], turn: turn, plan: null, follows: 0, ids: [] });
  vtEq(junk.scores.accuracy, VIVA_SELF_SCORES[2], 'unreadable mark counts as a 3'); vtEq(junk.scores.depth, VIVA_SELF_SCORES[4], 'clamped high'); vtEq(junk.scores.reasoning, VIVA_SELF_SCORES[0], 'clamped low');
  vtEq(junk.covered.length, 0, 'no key points to cover');
});
check('viva: offline follow-ups pick a type and stop after one', function () {
  var t = vtTurn();
  vtEq(vivaOfflineFollow({ accuracy: 90, depth: 90, reasoning: 90, communication: 90 }, 0, t, { concept: 'x' }, ['elenchos']).type, 'extend');
  vtEq(vivaOfflineFollow({ accuracy: 30, depth: 70, reasoning: 70, communication: 70 }, 0, t, { concept: 'x' }, ['elenchos']).type, 'challenge');
  vtEq(vivaOfflineFollow({ accuracy: 70, depth: 40, reasoning: 70, communication: 70 }, 0, t, { concept: 'x' }, ['elenchos']).type, 'probe');
  vtEq(vivaOfflineFollow({ accuracy: 70, depth: 70, reasoning: 70, communication: 70 }, 1, t, {}, ['elenchos']).action, 'move_on');
  vtEq(vivaOfflineFollow({ accuracy: 70, depth: 70, reasoning: 70, communication: 70 }, 0, vtTurn({ kind: 'follow' }), {}, ['elenchos']).action, 'move_on');
  var q = vivaOfflineFollow({ accuracy: 44, depth: 80, reasoning: 80, communication: 80 }, 0, t, { concept: 'x' }, ['theoria', 'praxis', 'skepsis']);
  vtEq(q.examiner, 'skepsis', 'a challenge goes to the skeptic on a panel');
  vtAssert(q.question.indexOf('{c}') < 0, 'placeholder filled');
});
check('viva: advance queues follow-up, next question, then verdict', function () {
  var plan = vivaFallbackPlan({ format: 'quick', persona: 'socratic', subject: 'Optics' }).questions;
  var doc = { plan: plan, turns: [Object.assign(vtTurn({ q: plan[0].q }), { answered: true })] };
  var move = { reaction: 'Noted.', next: { action: 'move_on' } };
  var a = vivaAdvance(doc, { next: { action: 'followup', type: 'probe', question: 'Why is that so?', examiner: 'elenchos' }, reaction: 'Hm.' });
  vtEq(a.next, 'followup'); vtEq(a.turns.length, 2); vtEq(a.turns[1].kind, 'follow'); vtEq(a.turns[1].lead, 'Hm.');
  var b = vivaAdvance(doc, move);
  vtEq(b.next, 'followup', 'a main question never closes without one follow-up'); vtEq(b.turns[1].qi, 0); vtAssert(b.turns[1].q.length > 8);
  var doc2 = { plan: plan, turns: doc.turns.concat([Object.assign(vtTurn({ kind: 'follow' }), { answered: true })]) };
  var b2 = vivaAdvance(doc2, move);
  vtEq(b2.next, 'main'); vtEq(b2.turns[2].qi, 1); vtEq(b2.turns[2].q, plan[1].q);
  var lastDoc = { plan: plan, turns: [Object.assign(vtTurn({ qi: 2, q: plan[2].q }), { answered: true }), Object.assign(vtTurn({ qi: 2, kind: 'follow' }), { answered: true })] };
  var closing = vivaAdvance(lastDoc, move);
  vtEq(closing.next, 'close', 'the room offers a chance to correct yourself'); vtEq(closing.turns[2].kind, 'close');
  vtEq(vivaAdvance({ plan: plan, turns: closing.turns }, vivaNoMarkEval()).next, 'verdict');
  var two = { plan: plan, turns: [vtTurn(), vtTurn({ kind: 'follow' }), vtTurn({ kind: 'follow' })] };
  vtEq(vivaAdvance(two, { next: { action: 'followup', question: 'A third one, surely?' } }).next, 'main', 'third follow-up refused');
  vtEq(vivaAdvance({}, move).next, 'verdict', 'empty doc');
  vtEq(vivaAdvance(doc, null).next, 'main', 'missing evaluation');
});
check('viva: resume phase covers every state', function () {
  var t = vtTurn(), answered = Object.assign(vtTurn(), { answered: true }), marked = Object.assign(vtTurn(), { answered: true, eval: { scores: {} } });
  vtEq(vivaResumePhase(null), 'setup'); vtEq(vivaResumePhase({ status: 'setup' }), 'setup'); vtEq(vivaResumePhase({ status: 'done' }), 'done');
  vtEq(vivaResumePhase({ status: 'live', turns: [t] }), 'intro');
  vtEq(vivaResumePhase({ status: 'live', turns: [answered] }), 'pending');
  vtEq(vivaResumePhase({ status: 'live', turns: [marked] }), 'verdict');
  vtEq(vivaResumePhase({ status: 'live' }), 'verdict');
});

/* ---------- Report ---------- */
function vtScores(a, d, r, c) { return { accuracy: a, depth: d, reasoning: r, communication: c }; }
function vtMarked(qi, kind, sc, over) {
  return Object.assign(vivaMakeTurn({ qi: qi, kind: kind, q: 'Question ' + qi + ' asked as ' + kind + ', spelled out?', examiner: 'elenchos' }), { answered: true, answer: 'Entropy measures the number of microstates. First, count them. Because each is equally likely, the log follows. For example, a gas in a box.', thinkSec: 12, answerSec: 70, eval: { scores: sc, covered: [], misconception: '', notes: 'Solid on the what, thin on the why.', reaction: 'Noted.', next: { action: 'move_on' }, self: false } }, over || {});
}
function vtExam(over) {
  var plan = vivaFallbackPlan({ format: 'quick', persona: 'socratic', subject: 'Thermodynamics', topic: 'Entropy; Carnot cycle; heat engines' }).questions;
  return vivaNewDoc(Object.assign({ subject: 'Thermodynamics', topic: 'Entropy', format: 'quick', persona: 'socratic', status: 'live', source: 'ai', mode: 'write', title: 'Heat', opening: 'Welcome. Think out loud.', plan: plan, think: 15, answer: 90, turns: [
    vtMarked(0, 'main', vtScores(90, 90, 90, 90)),
    vtMarked(0, 'follow', vtScores(60, 60, 60, 60), { fType: 'probe', lead: 'Hm. And why?' }),
    vtMarked(1, 'main', vtScores(60, 50, 70, 80), { help: ['Start smaller.'], clarify: [{ ask: 'Which kind?', reply: 'Any kind you know well.' }], overtime: 12 }),
    vtMarked(2, 'main', vtScores(40, 30, 50, 60), { eval: { scores: vtScores(40, 30, 50, 60), covered: [], misconception: 'Confuses heat and temperature.', notes: 'Missed the assumption.', reaction: 'Noted.', next: { action: 'move_on' }, self: false } }),
  ] }, over || {}));
}
check('viva: question scores weight main answers double and charge for help', function () {
  var qs = vivaQuestionScores(vtExam());
  vtEq(qs[0].rubric.accuracy, 80, '(90*2 + 60) / 3');
  vtEq(qs[0].score, 80); vtEq(qs[0].follows, 1);
  vtEq(qs[1].penalty, 5); vtEq(qs[1].helps, 1);
  vtEq(qs[1].score, Math.round(vivaWeighted(qs[1].rubric) - 5));
});
check('viva: running mark ignores unmarked turns', function () {
  vtEq(vivaRunning({}).percent, null); vtEq(vivaRunning({ plan: [{}], turns: [vtTurn()] }).n, 0);
  var run = vivaRunning(vtExam());
  vtEq(run.n, 3); vtAssert(run.percent > 0 && run.percent < 100);
});
check('viva: computed report is complete and consistent', function () {
  var doc = vtExam(), r = vivaComputeReport(doc);
  vtEq(r.grade, vivaGrade(r.percent).id); vtEq(r.total, 3); vtEq(r.answered, 3); vtEq(r.partial, false); vtEq(r.source, 'computed');
  VIVA_KEYS.forEach(function (k) { vtAssert(r.rubric[k] >= 0 && r.rubric[k] <= 100, k); });
  vtEq(r.perQuestion.length, 3); vtEq(r.panel.length, 1); vtEq(r.panel[0].examiner, 'elenchos');
  vtAssert(r.gaps.length >= 1, 'has gaps'); vtAssert(r.cards.length >= 3, 'has cards');
  r.cards.forEach(function (c) { vtAssert(c.q && c.a && c.known === null, 'card'); });
  r.gaps.forEach(function (g) { vtAssert(g.concept && Array.isArray(g.outline), 'gap'); });
  vtAssert(r.summary.indexOf('undefined') < 0, r.summary);
  vtAssert(r.next.length >= 2 && r.next.every(Boolean), 'next steps');
});
check('viva: report handles an empty sitting and a partial one', function () {
  var empty = vivaComputeReport({});
  vtEq(empty.percent, 0); vtEq(empty.grade, 'Not yet'); vtEq(empty.gaps.length, 0); vtAssert(empty.summary.length > 5);
  var none = vivaComputeReport(vtExam({ turns: [vtTurn()] }));
  vtEq(none.percent, 0); vtEq(none.answered, 0); vtEq(none.partial, true);
  var d = vtExam(); d.turns = d.turns.slice(0, 2);
  var part = vivaComputeReport(d);
  vtEq(part.partial, true); vtEq(part.answered, 1); vtEq(part.total, 3);
});
check('viva: self-marked exams say so', function () {
  var d = vtExam();
  d.turns = d.turns.map(function (t) { return Object.assign({}, t, { eval: Object.assign({}, t.eval, { self: true }) }); });
  vtEq(vivaComputeReport(d).source, 'self');
});
check('viva: hedges reach the next steps', function () {
  var d = vtExam({ mode: 'dictate' });
  d.turns = d.turns.map(function (t) { return Object.assign({}, t, { answer: 'I think it might be entropy, maybe. Perhaps not.' }); });
  var m = vivaCommMetrics(d);
  vtAssert(m.hedgesPer >= 1.2, 'hedgesPer is exposed');
  vtAssert(vivaComputeReport(d).next.some(function (s) { return /hedge/i.test(s); }), 'a hedge tip appears');
});
check('viva: comm metrics count delivery habits', function () {
  vtEq(vivaAnswerFirst('Yes, because the lattice is open.'), true);
  vtEq(vivaAnswerFirst('So, um, there are a lot of factors.'), false);
  vtEq(vivaAnswerFirst(''), false);
  vtEq(vivaCommMetrics({}).n, 0); vtEq(vivaCommMetrics({}).score, 0);
  var m = vivaCommMetrics(vtExam());
  vtEq(m.n, 4); vtEq(m.overtimeCount, 1); vtEq(m.helps, 1); vtEq(m.clarifies, 1);
  vtAssert(m.notes.length > 0);
});
check('viva: AI report cannot move the computed mark, with garbage falling back', function () {
  var doc = vtExam(), base = vivaComputeReport(doc);
  var high = vivaNormReport({ percent: 100, summary: 'Great.' }, doc);
  vtEq(high.percent, base.percent, 'the mark is computed');
  vtEq(high.grade, vivaGrade(high.percent).id); vtEq(high.summary, 'Great.'); vtEq(high.source, 'ai');
  [null, undefined, 4, 'nope'].forEach(function (raw) { vtEq(vivaNormReport(raw, doc).percent, base.percent); });
  var junk = vivaNormReport({ percent: 'lots', summary: {}, strengths: 'x', gaps: [null, 3, { concept: '' }, { concept: 'C', model_answer_outline: 7 }], panel: [null, { examiner: 'ghost', comment: 'hi' }], next_steps: {}, flashcards: [null, { q: 'only q' }], communication: 5 }, doc);
  vtEq(junk.percent, base.percent);
  vtAssert(junk.summary.length > 5 && junk.strengths.length > 0, 'falls back');
  vtEq(junk.panel.length, 1); vtEq(junk.panel[0].examiner, 'elenchos');
  vtEq(junk.cards.length, base.cards.length, 'too few AI cards keeps the computed deck');
  var ok = vivaNormReport({ gaps: [{ concept: 'Carnot', what_was_missing: 'The limit.', model_answer_outline: '1. State it\n2. Derive it' }], panel: [{ examiner: 'Elenchos', comment: 'Why?' }], flashcards: [{ q: 'a', a: 'b' }, { question: 'c', answer: 'd' }, { q: 'e', a: 'f' }], next_steps: ['Go on.'], strengths: ['Calm.'] }, doc);
  vtEq(ok.gaps[0].outline.length, 2); vtEq(ok.gaps[0].outline[0], 'State it', 'numbering stripped');
  vtEq(ok.panel[0].comment, 'Why?'); vtEq(ok.cards.length, 3); vtEq(ok.next[0], 'Go on.'); vtEq(ok.strengths[0], 'Calm.');
});
check('viva: markdown export includes the whole sitting', function () {
  var doc = vtExam(); doc.report = vivaComputeReport(doc); doc.status = 'done';
  var md = vivaMarkdown(doc);
  ['# Viva voce: Thermodynamics', '## Rubric', '## Transcript', '## Flashcards', 'Rehearsed in Rostra'].forEach(function (s) { vtAssert(md.indexOf(s) >= 0, 'missing ' + s); });
  vtAssert(md.indexOf('undefined') < 0, 'undefined leaked');
  var bare = vivaMarkdown(vivaNewDoc({ subject: 'X' }));
  vtAssert(bare.indexOf('# Viva voce: X') === 0, 'report-less export');
});
check('viva: retake carries the gaps and settings into a draft', function () {
  var doc = vtExam({ id: 'v_retake_src' }); doc.report = vivaComputeReport(doc);
  var n = vivaRetake(doc);
  try {
    vtEq(n.status, 'setup'); vtEq(n.retakeOf, 'v_retake_src'); vtEq(n.subject, 'Thermodynamics'); vtEq(n.format, 'quick');
    vtAssert(n.focus.length > 0, 'focus seeded'); vtAssert(n.id !== doc.id, 'new id');
    vtAssert(vivaConcepts(n)[0] === n.focus[0], 'concepts lead with the gap');
  } finally { Store.deleteViva(n.id); }
});

/* ---------- Art ---------- */
check('viva: bench renders in every lighting state', function () {
  ['elenchos', 'akribeia', 'eunoia', 'theoria', 'praxis', 'skepsis'].forEach(function (id) { vtRender(VivaBust({ id: id, rid: 't', state: 'speaking' })); });
  [{ ids: ['elenchos'], active: 'elenchos', speaking: 'elenchos' }, { ids: VIVA_PERSONAS.panel.examiners, active: 'praxis' }, { ids: VIVA_PERSONAS.panel.examiners, thinking: true }, { ids: ['eunoia'], entering: true }, { ids: VIVA_PERSONAS.panel.examiners, idle: true }, { ids: ['akribeia', 'eunoia'] }].forEach(function (p) {
    var r = vtRender(VivaBench(p));
    vtHas(r, 'viva-cone is-');
  });
  var r = vtRender(VivaBust({ id: 'nobody', rid: 't', state: 'lit' }));
  vtHas(r, 'ELENCHOS');
  vtRender(VivaNiche({ ids: ['elenchos'] })); vtRender(VivaNiche({ ids: VIVA_PERSONAS.panel.examiners, size: 58, lit: false }));
});
check('viva: seal and radar accept every grade and garbage', function () {
  VIVA_GRADES.forEach(function (g) { vtRender(VivaSeal({ percent: g.min, grade: g.id, stamp: true })); });
  ['abc', null, undefined, -20, 400].forEach(function (p) { vtRender(VivaSeal({ percent: p, grade: 'Nope' })); });
  vtRender(VivaRadar({ rubric: vtScores(90, 50, 20, 0) })); vtRender(VivaRadar({})); vtRender(VivaRadar({ rubric: { accuracy: 'x' } }));
  vtRender(VivaVerdictLights({ percent: 80 })); vtRender(VivaVerdictLights({ percent: 'x' }));
  vtRender(VivaMeter({ doc: vtExam() })); vtRender(VivaMeter({ doc: {} }));
  vtRender(VivaTyped({ text: 'Hello', play: true, playKey: 1 })); vtRender(VivaTyped({ text: null }));
});
check('viva: seal path is deterministic', function () {
  vtEq(vivaSealPath(5), vivaSealPath(5)); vtAssert(vivaSealPath(5) !== vivaSealPath(6)); vtAssert(/^M.*Z$/.test(vivaSealPath(5)));
});

/* ---------- Pages ---------- */
function vtWithExam(doc, fn) {
  var saved = Store.saveViva(doc, 0);
  try { return fn(saved); } finally { Store.deleteViva(saved.id); }
}
check('viva: page with no exams', function () {
  return vtState({ vivas: [] }, function () {
    var r = vtRender(VivaPage({}));
    ['VivaHome', 'VivaHero', 'VivaSetup', 'VivaHistory', 'VivaTechnique', 'VivaBench', 'VivaNiche'].forEach(function (n) { vtAssert(r.seen[n], n + ' not rendered'); });
    vtHas(r, 'Rehearse the oral exam'); vtHas(r, 'No exams yet'); vtHas(r, 'Enter the exam room');
    return r.calls + ' components';
  });
});
check('viva: page with a missing exam id', function () {
  return vtState({ vivas: [] }, function () { var r = vtRender(VivaPage({ param: 'v_gone' })); vtHas(r, 'That exam isn’t here'); });
});
check('viva: setup offline, as a retake, and with an odd remembered form', function () {
  return vtState({ ai: 'off', vivas: [] }, function () {
    vtHas(vtRender(VivaSetup({})), 'Offline exam.');
    var draft = vivaNewDoc({ subject: 'Law', format: 'qualifying', persona: 'panel', retakeOf: 'v_x', focus: ['Tort'], topic: 'Tort' });
    vtWithExam(draft, function (d) {
      var r = vtRender(VivaPage({ param: d.id }));
      vtAssert(r.seen.VivaSetup, 'routes a draft to setup'); vtHas(r, 'Back in the room');
    });
    lsSet('viva.last', { level: 'nope', format: 12, persona: {}, mode: 'x', think: 'y', answer: null, voice: 'z' });
    try { vtEq(vivaInitialForm().format, 'standard'); vtEq(vivaInitialForm().think, 20); vtEq(vivaInitialForm().mode, 'speak'); vtRender(VivaSetup({})); }
    finally { localStorage.removeItem(LS + 'viva.last'); }
  });
});
check('viva: every format think and answer time has a chip', function () {
  Object.keys(VIVA_FORMATS).forEach(function (k) {
    vtAssert(VIVA_THINK_OPTS.indexOf(VIVA_FORMATS[k].think) >= 0, k + ' think');
    vtAssert(VIVA_ANSWER_OPTS.indexOf(VIVA_FORMATS[k].answer) >= 0, k + ' answer');
  });
});
check('viva: history lists live, draft, done and odd exams', function () {
  var done = vtExam({ id: 'v_h1', status: 'done' }); done.report = vivaComputeReport(done);
  var r = vtRender(VivaHistory({ vivas: [done, vtExam({ id: 'v_h2' }), vivaNewDoc({ id: 'v_h3' }), { id: 'v_h4', status: 'weird', report: { percent: 'abc', grade: 7 } }, { id: 'v_h5', status: 'done', report: { percent: 'abc', grade: 7 } }] }));
  vtHas(r, 'Resume'); vtHas(r, 'Report'); vtHas(r, 'Set up'); vtHas(r, 'Untitled exam');
  vtState({ vivas: [{ id: 'v_h5', status: 'done', report: { percent: 'abc', grade: 7 } }] }, function () { var h = vtRender(VivaHome()); vtAssert(h.all.indexOf('NaN') < 0, 'NaN in hero'); });
});
check('viva: live exam, mid-question on a follow-up', function () {
  var doc = vtExam();
  doc.turns = doc.turns.slice(0, 1).concat([vivaMakeTurn({ qi: 0, kind: 'follow', fType: 'challenge', q: 'Suppose I told you that is wrong. How would you defend it?', examiner: 'elenchos', lead: 'Let us test that.' })]);
  vtEq(vivaResumePhase(doc), 'intro');
  return vtWithExam(doc, function (d) {
    var routed = vtRender(VivaPage({ param: d.id }));
    vtAssert(routed.seen.VivaRoom && routed.seen.VivaBench && routed.seen.Klepsydra && routed.seen.MeanderBar && !routed.seen.VivaMeter && routed.seen.VivaLog, 'room tree, with no live marks');
    vtHas(routed, 'Welcome back. We were on question 1 of 3.');
    var asking = vtRender(VivaRoom({ doc: d, startPhase: 'asking' }));
    vtHas(asking, 'Follow-up'); vtAssert(asking.all.indexOf('Challenge') < 0, 'the chip gives no verdict'); vtHas(asking, 'Suppose I told you');
    var prac = vtRender(VivaRoom({ doc: Object.assign({}, d, { practice: true }), startPhase: 'asking' }));
    vtHas(prac, 'Challenge'); vtAssert(prac.seen.VivaMeter, 'practice mode shows the meter'); vtHas(asking, 'Let us test that.'); vtHas(asking, 'Skip to think time');
    var answer = vtRender(VivaRoom({ doc: d, startPhase: 'answer' }));
    vtHas(answer, 'Submit answer'); vtHas(answer, 'Repeat the question'); vtHas(answer, 'I don’t know, help me reason');
    return 'ok';
  });
});
check('viva: live exam renders in every phase, both modes, panel too', function () {
  var phases = ['intro', 'asking', 'think', 'answer', 'check', 'jot', 'said', 'evaluating', 'self', 'pending', 'verdict', 'deliberating'];
  [{ mode: 'write' }, { mode: 'aloud' }, { mode: 'dictate', discipline: 'quantitative' }, { mode: 'write', persona: 'panel', format: 'qualifying', source: 'offline' }].forEach(function (over) {
    var d = vtExam(over);
    d.plan = vivaFallbackPlan(d).questions;
    d.turns = [vivaMakeTurn({ qi: 0, kind: 'main', q: d.plan[0].q, examiner: d.plan[0].examiner })];
    phases.forEach(function (ph) { vtRender(VivaRoom({ doc: d, startPhase: ph })); });
  });
  ['ready', 'off'].forEach(function (ai) { vtState({ ai: ai }, function () { vtRender(VivaRoom({ doc: vtExam(), startPhase: 'pending' })); vtRender(VivaRoom({ doc: vtExam(), startPhase: 'verdict' })); }); });
  var fresh = vtExam({ turns: [] });
  vtRender(VivaRoom({ doc: fresh })); vtRender(VivaLog({ doc: fresh }));
  vtHas(vtRender(VivaRoom({ doc: vtExam({ mode: 'speak' }), startPhase: 'answer' })), 'viva-mic');
});
check('viva: self-marking in both reasons, with and without marks', function () {
  var plan = { keyPoints: ['First point', 'Second point'] };
  var empty = vtRender(VivaSelfMark({ turn: vtMarked(0, 'main', vtScores(1, 1, 1, 1)), plan: plan, marks: {}, setMarks: function () {}, covered: [], setCovered: function () {}, reason: 'offline', onSubmit: function () {} }));
  vtHas(empty, 'Choose a mark for all four.'); vtHas(empty, 'First point');
  var full = vtRender(VivaSelfMark({ turn: vtTurn(), plan: null, marks: { accuracy: 5, depth: 4, reasoning: 3, communication: 2 }, setMarks: function () {}, covered: [0], setCovered: function () {}, reason: 'error', onSubmit: function () {} }));
  vtHas(full, 'Your marks come to about');
  vtHas(full, 'couldn’t be reached');
});
check('viva: finished report', function () {
  var doc = vtExam({ status: 'done', revealed: false }); doc.report = vivaComputeReport(doc);
  return vtWithExam(doc, function (d) {
    var r = vtRender(VivaPage({ param: d.id }));
    ['VivaReport', 'VivaVerdictLights', 'VivaSeal', 'VivaRadar', 'CountUp', 'VivaNiche'].forEach(function (n) { vtAssert(r.seen[n], n + ' not rendered'); });
    vtHas(r, 'viva-verdict-greek'); vtHas(r, 'How the marks break down'); vtHas(r, 'Question by question'); vtHas(r, 'Retake on my gaps'); vtHas(r, 'Download transcript');
    vtHas(r, 'Examiner’s note.'); vtHas(r, 'Misconception.'); vtHas(r, 'You asked for help reasoning.');
    return d.report.grade + ' ' + d.report.percent;
  });
});
check('viva: report for every grade, a panel, a partial run and the AI path', function () {
  VIVA_GRADES.forEach(function (g) {
    var d = vtExam({ status: 'done', persona: 'panel' });
    var rep = vivaComputeReport(d); rep.percent = g.min; rep.grade = g.id;
    d.report = rep;
    vtHas(vtRender(VivaReport({ doc: d })), g.id);
  });
  var part = vtExam({ status: 'done' }); part.turns = part.turns.slice(0, 2); part.report = vivaComputeReport(part);
  vtHas(vtRender(VivaReport({ doc: part })), 'Ended early');
  vtHas(vtRender(VivaReport({ doc: part })), 'The exam ended before this question.');
  var ai = vtExam({ status: 'done', mode: 'aloud' });
  ai.report = vivaNormReport({ percent: 70, summary: 'Fine.', gaps: [{ concept: 'Carnot', what_was_missing: 'The limit.', model_answer_outline: ['State it'] }] }, ai);
  vtRender(VivaReport({ doc: ai }));
  var bare = vivaNewDoc({ status: 'done', subject: 'Empty' }); bare.report = vivaComputeReport(bare);
  vtRender(VivaReport({ doc: bare }));
});
check('viva: revise mode routes, flips and finishes', function () {
  var doc = vtExam({ status: 'done' }); doc.report = vivaComputeReport(doc);
  var cards = doc.report.cards;
  return vtWithExam(doc, function (d) {
    var r = vtRender(VivaPage({ param: d.id + ':revise' }));
    vtAssert(r.seen.VivaRevise && r.seen.MeanderBar, 'revise tree');
    vtHas(r, 'Card 1 of ' + cards.length); vtHas(r, cards[0].q); vtHas(r, 'Flip the card');
    vtHas(r, 'Question: ' + cards[0].q);
    var flipped = vtRender(VivaRevise({ doc: d, initial: { flip: true } }));
    vtHas(flipped, 'I knew it'); vtHas(flipped, 'is-flipped'); vtHas(flipped, 'Answer: ' + cards[0].a);
    var done = vtRender(VivaRevise({ doc: d, initial: { pos: cards.length, res: { 0: true, 1: false } } }));
    vtHas(done, 'Round complete'); vtHas(done, 'Go again with 1');
    var perfect = {}; cards.forEach(function (c, i) { perfect[i] = true; });
    vtHas(vtRender(VivaRevise({ doc: d, initial: { pos: cards.length, res: perfect } })), 'You knew every card.');
    return cards.length + ' cards';
  });
});
check('viva: revise with no cards', function () {
  var doc = vtExam({ status: 'done' }); doc.report = Object.assign(vivaComputeReport(doc), { cards: [] });
  vtHas(vtRender(VivaRevise({ doc: doc })), 'No flashcards for this exam');
  vtRender(VivaRevise({ doc: { id: 'x', subject: 'y' } }));
});
check('viva: a done exam without a report falls back to setup', function () {
  return vtState({ vivas: [{ id: 'v_nr', status: 'done', subject: 'x' }] }, function () { vtAssert(vtRender(VivaPage({ param: 'v_nr' })).seen.VivaSetup, 'setup'); });
});

/* ---------- Lessons and tables ---------- */
check('viva: lesson shape', function () {
  vtEq(VIVA_LESSONS.length, 4);
  var ids = {};
  VIVA_LESSONS.forEach(function (l) {
    vtAssert(l.id && !ids[l.id], 'unique id ' + l.id); ids[l.id] = 1;
    vtAssert(POLES[l.pole] && POLE_KEYS.indexOf(l.pole) >= 0, 'valid pole in ' + l.id);
    vtAssert(l.title && l.minutes > 0 && l.drill, 'fields in ' + l.id);
    vtAssert(Array.isArray(l.concept) && l.concept.length > 0 && l.concept.every(function (p) { return typeof p === 'string' && p.length > 20; }), 'concept in ' + l.id);
    vtAssert(Array.isArray(l.terms) && l.terms.length > 0 && l.terms.every(function (t) { return t.term && t.def; }), 'terms in ' + l.id);
    vtAssert(l.example && l.example.quote && l.example.who && l.example.note, 'example in ' + l.id);
    vtAssert(Array.isArray(l.quiz) && l.quiz.length > 0, 'quiz in ' + l.id);
    l.quiz.forEach(function (q) {
      vtAssert(q.q && q.why && Array.isArray(q.options) && q.options.length >= 2, 'question in ' + l.id);
      vtAssert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, 'answer index in ' + l.id + ': ' + q.answer);
    });
    vtAssert(allCoreLessons().indexOf(l) >= 0, l.id + ' reachable from the lesson page');
  });
  LESSONS.forEach(function (l) { vtAssert(!ids[l.id], 'id collides with a core lesson: ' + l.id); });
});
check('viva: rubric, cast and grades are consistent', function () {
  var w = VIVA_RUBRIC.reduce(function (s, r) { return s + r.w; }, 0);
  vtAssert(Math.abs(w - 1) < 1e-9, 'weights sum to 1');
  VIVA_RUBRIC.forEach(function (r) { vtEq(r.levels.length, 5, r.key + ' levels'); });
  vtEq(VIVA_SELF_SCORES.length, 5);
  Object.keys(VIVA_PERSONAS).forEach(function (k) { VIVA_PERSONAS[k].examiners.forEach(function (id) { vtAssert(VIVA_EXAMINERS[id], 'examiner ' + id); vtAssert(VIVA_PANEL_LINES[id], 'panel line ' + id); }); });
  Object.keys(VIVA_EXAMINERS).forEach(function (k) { var e = VIVA_EXAMINERS[k]; vtAssert(VIVA_HAIR[e.hair], 'hair ' + e.hair); vtAssert(e.reactions.length && e.moment.length && e.opening && e.voice, 'lines for ' + k); });
  for (var i = 1; i < VIVA_GRADES.length; i++) vtAssert(VIVA_GRADES[i].min < VIVA_GRADES[i - 1].min, 'grades descend');
  vtEq(VIVA_GRADES[VIVA_GRADES.length - 1].id, 'Incomplete');
  vtEq(VIVA_GRADES[VIVA_GRADES.length - 2].min, 0);
  Object.keys(VIVA_TEMPLATE_ORDER).forEach(function (k) {
    vtEq(VIVA_TEMPLATE_ORDER[k].length, VIVA_FORMATS[k].n, k + ' template count');
    VIVA_TEMPLATE_ORDER[k].forEach(function (kind) { vtAssert(VIVA_TEMPLATES.some(function (t) { return t.kind === kind; }), 'template ' + kind); });
  });
  ['vivaCards', 'vivaDoor', 'vivaSeal'].forEach(function (n) { vtAssert(ICONS[n], 'icon ' + n); });
});
check('viva: prompts stay well formed', function () {
  var d = vtExam({ material: 'Notes on entropy.', focus: ['Entropy'] });
  vtAssert(vivaPlanPrompt(d).indexOf('Write exactly 6 questions') >= 0, 'plan prompt size');
  var e = vivaEvalPrompt(d, 3);
  vtAssert(e.indexOf('Follow-ups already asked') >= 0 && e.indexOf('undefined') < 0, 'eval prompt');
  vtAssert(vivaClarifyPrompt(d, d.turns[0], '').indexOf('Could you rephrase') >= 0, 'clarify prompt');
  vtAssert(vivaHelpPrompt(d, d.turns[2]).indexOf('Scaffolds you already gave') >= 0, 'help prompt');
  vtAssert(vivaReportPrompt(d).indexOf('undefined') < 0, 'report prompt');
  vtAssert(vivaOfflineClarify(d, d.turns[0]).length > 10 && vivaOfflineHelp(d, d.turns[0]).length > 10, 'offline replies');
  vtEq(vivaSlug('Not yet!'), 'not-yet'); vtEq(vivaSlug(''), 'exam'); vtEq(vivaStr({ a: 1 }), ''); vtEq(vivaStr(' a  b ', 2), 'a ');
});

/* ---------- A real rehearsal: modes, marking rules, fairness, reports ---------- */
function vtMainPair(qi, a, b) { return [vtMarked(qi, 'main', a), vtMarked(qi, 'follow', b || a, { fType: 'probe' })]; }
check('rehearsal: modes default to speaking, in the agreed order', function () {
  vtEq(Object.keys(VIVA_MODES).join(), 'speak,write');
  vtEq(vivaNewDoc().mode, 'speak'); vtEq(vivaNewDoc().practice, false); vtEq(vivaModeId('write'), 'write'); vtEq(vivaModeId('junk'), 'speak');
  vtEq(vivaModeId('aloud'), 'speak'); vtEq(vivaModeId('dictate'), 'speak'); // old exams still open
  vtAssert(VIVA_MODES.speak.desc.indexOf('not kept') >= 0, 'the audio is not kept');
  vtAssert(vivaIsSpoken({ mode: 'speak' }) && !vivaIsSpoken({ mode: 'speak', micFallback: true }) && !vivaIsSpoken({ mode: 'write' }), 'spoken means speak mode with a working microphone');
  vtEq(VIVA_MODES.write.label, 'Type my answers (content drill)');
});
check('rehearsal: no judging reactions, one question, verdict words replaced', function () {
  Object.keys(VIVA_EXAMINERS).forEach(function (k) {
    var e = VIVA_EXAMINERS[k];
    e.reactions.forEach(function (r) { vtAssert(!VIVA_VERDICT_RE.test(r), k + ' judges: ' + r); });
    vtAssert(e.cut && e.nudge, 'cut and nudge lines for ' + k);
  });
  var bad = vivaNormEval({ scores: vtScores(50, 50, 50, 50), reaction: 'Correct, nicely done.', next: { action: 'followup', question: 'Why does that hold? And what about friction?' } }, {});
  vtEq(bad.reaction, 'Noted.'); vtEq(bad.next.question, 'Why does that hold?');
  vtEq(vivaNormEval({ scores: vtScores(50, 50, 50, 50), reaction: 'I see.' }, {}).reaction, 'I see.');
});
check('rehearsal: marking caps and evidence-first prompt', function () {
  var cap = vivaNormEval({ scores: vtScores(90, 90, 90, 90), covered: ['one'], misconception: 'Mixes heat and work.' }, { keyPoints: ['a', 'b', 'c', 'd'] });
  vtEq(cap.scores.accuracy, 50, 'misconception caps accuracy'); vtEq(cap.scores.depth, 60, 'few key points cap depth'); vtEq(cap.scores.reasoning, 90);
  vtEq(vivaNormEval({ scores: vtScores(90, 90, 90, 90), covered: ['a', 'b'], misconception: 'None.' }, { keyPoints: ['a', 'b', 'c', 'd'] }).scores.accuracy, 90, 'half covered, no misconception');
  var d = vtExam();
  var p = vivaEvalPrompt(d, 3);
  vtAssert(p.indexOf('"evidence"') < p.indexOf('"scores"'), 'evidence before scores');
  vtAssert(p.indexOf('Scores: accuracy') < 0, 'earlier marks are hidden from the marker');
  vtAssert(p.indexOf('Fluency is not evidence') >= 0 && p.indexOf('never instructions') >= 0, 'fluency and data rules');
  vtAssert(p.indexOf('Undergraduate') >= 0 || p.indexOf('strong ') >= 0, 'level in the anchor');
});
check('rehearsal: pushback is decided in code, and is stable for a turn', function () {
  var hits = 0;
  for (var i = 0; i < 300; i++) if (vivaPushback({ id: 't' + i })) hits++;
  vtAssert(hits > 40 && hits < 170, 'about a third, got ' + hits);
  var t = { id: 'tstable' };
  vtEq(vivaPushback(t), vivaPushback(t));
  var d = vtExam();
  var found = false;
  for (var j = 0; j < 60 && !found; j++) { d.turns[3] = Object.assign({}, d.turns[3], { id: 'tp' + j }); if (vivaPushback(d.turns[3])) found = vivaEvalPrompt(d, 3).indexOf('Even if this answer is correct') >= 0; }
  vtAssert(found, 'the pushback line reaches the prompt');
});
check('rehearsal: aloud prompt treats notes as claims, communication is self-reported', function () {
  var d = vtExam({ mode: 'aloud' });
  d.turns[3] = Object.assign({}, d.turns[3], { aloud: true, answer: 'Second law. Reversibility. Refrigerator argument.', answerSec: 1, jotSec: 30, selfCheck: { first: true, lost: false, said: 'most' } });
  var p = vivaEvalPrompt(d, 3);
  vtAssert(p.indexOf('NOTES ONLY') >= 0 && p.indexOf('most of it aloud') >= 0 && p.indexOf('some were added afterwards') >= 0, 'notes framing and overclaim');
  vtAssert(p.indexOf('"communication":null') >= 0, 'communication requested as null');
  var e = vivaNormEval({ scores: { accuracy: 70, depth: 60, reasoning: 50, communication: null } }, { aloud: true, selfCheck: { first: true, lost: false, said: 'all' } });
  vtEq(e.scores.communication, 85); vtEq(e.commReported, true);
  vtEq(vivaSelfCheckComm({ first: false, lost: true, said: 'some' }), 20);
  vtEq(vivaOverClaim({ answer: 'one two three', answerSec: 1 }), true); vtEq(vivaOverClaim({ answer: 'one two', answerSec: 10 }), false);
  vtEq(wordsOf(vivaTrimWords(new Array(90).join('word '), 60)).length, 60);
});
check('rehearsal: dictated answers are labelled for the marker', function () {
  var d = vtExam({ mode: 'dictate' });
  d.turns[3] = Object.assign({}, d.turns[3], { dictated: true, edits: 4 });
  vtAssert(vivaEvalPrompt(d, 3).indexOf('verbatim dictated speech with 4 manual edits') >= 0);
});
check('rehearsal: fairness caps, difficulty weights, extensions cannot lower a mark', function () {
  var plan = [{ q: 'a', concept: 'A', difficulty: 1, keyPoints: [] }, { q: 'b', concept: 'B', difficulty: 3, keyPoints: [] }];
  var words = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen';
  var doc = function (turns) { return vivaNewDoc({ source: 'ai', mode: 'write', plan: plan, turns: turns.map(function (t) { return Object.assign(t, { answer: words }); }) }); };
  var r1 = vivaComputeReport(doc([vtMarked(0, 'main', vtScores(35, 80, 80, 80)), vtMarked(1, 'main', vtScores(35, 80, 80, 80))]));
  vtEq(r1.percent, 54, 'fluent but wrong cannot pass'); vtEq(r1.grade, 'Not yet'); vtAssert(r1.capNotes.length === 1, 'cap explained');
  var r2 = vivaComputeReport(doc([vtMarked(0, 'main', vtScores(95, 50, 95, 95)), vtMarked(1, 'main', vtScores(95, 50, 95, 95))]));
  vtEq(r2.percent <= 84, true, 'shallow cannot reach Distinction');
  var hard = vivaComputeReport(doc([vtMarked(0, 'main', vtScores(50, 50, 50, 50)), vtMarked(1, 'main', vtScores(90, 90, 90, 90))]));
  vtEq(hard.percent, 77, 'difficulty 3 counts double');
  var q = vivaQuestionScores({ plan: plan, turns: [vtMarked(0, 'main', vtScores(92, 92, 92, 92)), vtMarked(0, 'follow', vtScores(50, 50, 50, 50), { fType: 'extend' })] })[0];
  vtEq(q.rubric.accuracy, 92, 'a failed extension does not cost marks');
  var up = vivaQuestionScores({ plan: plan, turns: [vtMarked(0, 'main', vtScores(60, 60, 60, 60)), vtMarked(0, 'follow', vtScores(90, 90, 90, 90), { fType: 'extend' })] })[0];
  vtEq(up.rubric.accuracy, 70, 'a strong extension raises the mark');
  var shortAns = vivaComputeReport(vivaNewDoc({ source: 'ai', mode: 'write', plan: plan, turns: [Object.assign(vtMarked(0, 'main', vtScores(95, 95, 95, 95)), { answer: 'Dunno' }), Object.assign(vtMarked(1, 'main', vtScores(95, 95, 95, 95)), { answer: 'Dunno' })] }));
  vtEq(shortAns.percent, 54, 'answers under 15 words cannot pass');
});
check('rehearsal: stopping early is Incomplete, with no seal and no judgment', function () {
  var plan = vivaFallbackPlan({ format: 'standard', persona: 'socratic', subject: 'Optics' }).questions;
  var words = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen';
  var d = vivaNewDoc({ subject: 'Optics', status: 'done', source: 'ai', mode: 'write', format: 'standard', plan: plan, turns: [Object.assign(vtMarked(0, 'main', vtScores(95, 95, 95, 95)), { answer: words })] });
  var r = vivaComputeReport(d);
  vtEq(r.grade, 'Incomplete'); vtEq(r.partial, true); vtEq(vivaIsSealed(r), false);
  vtAssert(r.summary.indexOf('1 of 5') >= 0, 'summary says so'); vtEq(r.conclusion.outcome, 'no verdict');
  vtAssert(vivaReportPrompt(d).indexOf('The candidate stopped after 1 of 5 questions') >= 0, 'prompt told');
  vtEq(vivaNormReport({ summary: 'x', examiner_conclusion: { outcome: 'would pass', why: 'y' } }, d).grade, 'Incomplete');
  d.report = r;
  var view = vtRender(VivaReport({ doc: d }));
  vtAssert(!view.seen.VivaSeal, 'no seal'); vtHas(view, 'on the 1 question you reached'); vtHas(view, 'Incomplete');
  var three = vivaNewDoc({ source: 'ai', mode: 'write', format: 'standard', plan: plan, turns: [0, 1, 2].map(function (i) { return Object.assign(vtMarked(i, 'main', vtScores(80, 80, 80, 80)), { answer: words }); }) });
  vtAssert(vivaComputeReport(three).grade !== 'Incomplete', '60 percent answered gets a verdict');
});
check('rehearsal: clocks are shorter on follow-ups and the warm-up', function () {
  var d = { think: 20, answer: 120 };
  vtEq(vivaClockSecs(d, { kind: 'main' }, 'think'), 20); vtEq(vivaClockSecs(d, { kind: 'main' }, 'answer'), 120);
  vtEq(vivaClockSecs(d, { kind: 'follow' }, 'think'), 8); vtEq(vivaClockSecs(d, { kind: 'follow' }, 'answer'), 60);
  vtEq(vivaClockSecs({ think: 5, answer: 45 }, { kind: 'follow' }, 'think'), 5); vtEq(vivaClockSecs({ think: 5, answer: 45 }, { kind: 'follow' }, 'answer'), 45);
  vtEq(vivaClockSecs(d, { kind: 'close' }, 'answer'), 60); vtEq(vivaClockSecs({}, null, 'think'), 20);
});
check('rehearsal: own-work defense, online and offline', function () {
  var d = vivaNewDoc({ subject: 'Bridge design', basis: 'work', material: 'MARKER-WORK My truss has a Warren layout.', format: 'quick', turns: [], plan: [] });
  var plan = vivaPlanPrompt(d);
  vtAssert(plan.indexOf('must defend it') >= 0 && plan.indexOf('MARKER-WORK') >= 0, 'defense block');
  var fb = vivaFallbackPlan(d);
  vtEq(fb.questions.length, 3); vtAssert(fb.questions[0].q.indexOf('your work') >= 0, 'offline defense question');
  vtEq(VIVA_DEFENSE_TEMPLATES.length, 7);
  Object.keys(VIVA_FORMATS).forEach(function (k) { vtEq(VIVA_DEFENSE_ORDER[k].length, VIVA_FORMATS[k].n, k + ' defense count'); });
  d.plan = fb.questions; d.turns = [vtMarked(0, 'main', vtScores(70, 70, 70, 70))];
  d.turns[0].q = fb.questions[0].q;
  vtAssert(vivaEvalPrompt(d, 0).indexOf('MARKER-WORK') >= 0, 'all of the work reaches the marker');
  vtAssert(vivaReportPrompt(d).indexOf('"defense"') >= 0, 'report asks for a defense verdict');
  var rep = vivaNormReport({ summary: 'x', defense: { would_examiner_believe: 'Partly', why: 'You said X.' } }, d);
  vtEq(rep.defense.believe, 'partly');
  vtEq(vivaNormReport({ defense: { would_examiner_believe: 'maybe' } }, d).defense, null);
  d.status = 'done'; d.report = rep;
  vtHas(vtRender(VivaReport({ doc: d })), 'Would an examiner believe this is your work?');
});
check('rehearsal: examiner conclusion and honesty line by mode', function () {
  var d = vtExam({ status: 'done' });
  var fall = vivaComputeReport(d);
  vtAssert(fall.conclusion && fall.conclusion.outcome && fall.conclusion.why, 'computed fallback');
  var ai = vivaNormReport({ summary: 'x', examiner_conclusion: { outcome: 'Would Fail', why: 'You said “it never falls”.', first_doubt: 'Entropy', ceiling: 'Carnot' } }, d);
  vtEq(ai.conclusion.outcome, 'would fail'); vtEq(ai.conclusion.ceiling, 'Carnot');
  vtEq(vivaNormReport({ examiner_conclusion: { outcome: 'great', why: 'y' } }, d).conclusion.outcome, fall.conclusion.outcome);
  d.report = ai;
  var v = vtRender(VivaReport({ doc: d }));
  vtHas(v, 'What a real examiner would conclude'); vtHas(v, 'You would fail'); vtHas(v, 'Typed, not spoken'); vtHas(v, 'How your answers read');
  ['aloud', 'dictate', 'write', 'speak'].forEach(function (m) { vtAssert(vivaHonestyLine(Object.assign({}, d, { mode: m })).length > 20, m); });
  vtAssert(vivaHonestyLine({ mode: 'aloud', report: {} }).indexOf('Nobody heard you speak') >= 0);
  vtAssert(vivaHonestyLine({ mode: 'speak', report: {} }).indexOf('audio was not kept') >= 0, 'spoken honesty line');
  vtHas(vtRender(VivaReport({ doc: Object.assign({}, d, { mode: 'aloud' }) })), 'What you reported');
  vtHas(vtRender(VivaReport({ doc: Object.assign({}, d, { mode: 'speak' }) })), 'How you sounded');
  vtHas(vtRender(VivaReport({ doc: Object.assign({}, d, { mode: 'speak' }) })), 'Spoken and transcribed');
  vtAssert(v.all.indexOf('Filler words') < 0, 'typed answers show no filler count');
});
check('rehearsal: material reaches every prompt, across the whole text', function () {
  var long = []; for (var i = 0; i < 400; i++) long.push('Paragraph ' + i + ' about filler topics and lectures with several words in it for padding.');
  long[399] = 'TAILMARK Carnot efficiency depends only on reservoir temperatures.';
  long[0] = 'HEADMARK The course opens here.';
  long[200] = 'MIDMARK Middle section here.';
  var text = long.join('\n');
  var win = vivaMaterialWindows(text);
  vtAssert(win.indexOf('HEADMARK') >= 0 && win.indexOf('TAILMARK') >= 0 && win.indexOf('MIDMARK') >= 0, 'head, middle and tail');
  vtAssert(win.length < 12100, 'windows stay small'); vtEq(vivaMaterialWindows('short'), 'short');
  var ex = vivaExcerpt(text, 'Carnot efficiency');
  vtAssert(ex.indexOf('TAILMARK') >= 0, 'finds the paragraph'); vtAssert(ex.length <= 2500);
  vtEq(vivaExcerpt('', 'x'), ''); vtEq(vivaExcerpt('tiny', 'x'), 'tiny');
  vtAssert(vivaExcerpt(text, 'zzzz').length <= 2500, 'no hits falls back to the head');
  var d = vtExam({ material: text });
  d.plan = d.plan.map(function (p) { return Object.assign({}, p, { concept: 'Carnot efficiency' }); });
  vtAssert(vivaEvalPrompt(d, 3).indexOf('TAILMARK') >= 0, 'eval'); vtAssert(vivaHelpPrompt(d, d.turns[3]).indexOf('TAILMARK') >= 0, 'help');
  vtAssert(vivaReportPrompt(Object.assign({}, d, { material: 'REPORTMARK notes' })).indexOf('REPORTMARK') >= 0, 'report');
  vtAssert(vivaPlanPrompt(d).indexOf('TAILMARK') >= 0, 'plan');
});
check('rehearsal: discipline block and setup field', function () {
  vtAssert(vivaContext({ subject: 'x', discipline: 'quantitative' }).indexOf('Field: quantitative') >= 0);
  vtAssert(vivaContext({ subject: 'x', discipline: 'interpretive' }).indexOf('Field: interpretive') >= 0);
  vtAssert(vivaContext({ subject: 'x', discipline: 'applied' }).indexOf('Field: applied') >= 0);
  vtAssert(vivaContext({ subject: 'x' }).indexOf('Field:') < 0, 'old docs get no block');
  var view = vtRender(VivaRoom({ doc: vtExam({ discipline: 'quantitative', turns: [vivaMakeTurn({ qi: -1, kind: 'warm', q: 'Before we begin?', examiner: 'elenchos' })] }), startPhase: 'intro' }));
  vtHas(view, 'Keep a blank sheet handy');
});
check('rehearsal: adaptive plan moves up after strength and down after a stumble', function () {
  var q = function (id, dif) { return { id: id, q: id + ' question text', concept: id, difficulty: dif, keyPoints: [], examiner: 'elenchos' }; };
  var base = { plan: [q('a', 1), q('b', 1), q('c', 2)], reserve: [q('r1', 2), q('r2', 3), q('r3', 3)] };
  var strong = vivaAdaptPlan(Object.assign({ turns: [vtMarked(0, 'main', vtScores(90, 90, 90, 90))] }, base), 1);
  vtEq(strong.plan[1].id, 'r2'); vtEq(strong.reserve[1].id, 'b'); vtEq(strong.plan.length, 3); vtEq(strong.reserve.length, 3);
  var weak = vivaAdaptPlan(Object.assign({ turns: [vtMarked(0, 'main', vtScores(30, 30, 30, 30))] }, base), 1);
  vtEq(weak.plan[1].id, 'b', 'already the easiest');
  var plain = vivaAdaptPlan({ plan: [q('a', 1), q('b', 1)], turns: [vtMarked(0, 'main', vtScores(90, 90, 90, 90))] }, 1);
  vtEq(plain.plan[1].id, 'b', 'old docs have no reserve');
  var adv = vivaAdvance(Object.assign({ turns: [vtMarked(0, 'main', vtScores(90, 90, 90, 90)), vtMarked(0, 'follow', vtScores(90, 90, 90, 90))] }, base), { next: { action: 'move_on' } });
  vtEq(adv.next, 'main'); vtEq(adv.turns[2].q, 'r2 question text'); vtEq(adv.plan[1].id, 'r2');
  var n = vivaNormPlan({ questions: [3, 1, 2, 3, 1, 2, 3, 1].map(function (dif, i) { return vtQ(i + 1, { difficulty: dif }); }) }, { format: 'standard', persona: 'socratic', subject: 'x' });
  vtEq(n.questions.length, 5); vtEq(n.reserve.length, 3); vtEq(n.questions[0].difficulty, 1); vtEq(n.reserve[2].difficulty, 3);
  var r = vivaComputeReport(Object.assign({ mode: 'write' }, base, { turns: [vtMarked(0, 'main', vtScores(60, 60, 60, 60))] }));
  vtEq(r.maxDifficulty, 1);
});
check('rehearsal: help prompt uses the draft, hides the concept and key points stay private', function () {
  var d = vtExam();
  d.plan = d.plan.map(function (p) { return Object.assign({}, p, { concept: 'SECRETCONCEPT' }); });
  var h = vivaHelpPrompt(d, d.turns[0], 'I started with the first law');
  vtAssert(h.indexOf('I started with the first law') >= 0 && h.indexOf('Private, do not mention') >= 0, 'draft and private line');
  vtAssert(h.indexOf('concept: SECRETCONCEPT') < 0, 'no concept in help');
  vtAssert(vivaClarifyPrompt(d, d.turns[0], '').indexOf('SECRETCONCEPT') < 0, 'no concept in clarify');
  vtAssert(vivaHelpPrompt(d, d.turns[0]).indexOf('They have said nothing yet.') >= 0);
});
check('rehearsal: answer-first and hedge heuristics match the lessons', function () {
  vtEq(vivaAnswerFirst('No. Every real engine has irreversibilities.'), true);
  vtEq(vivaAnswerFirst('Yes.'), true);
  vtEq(vivaCount(VIVA_HEDGE_RE, 'It might probably possibly hold, it seems.'), 0, 'calibrated language is not a hedge');
  vtEq(vivaCount(VIVA_HEDGE_RE, 'I think it is kind of true, maybe.'), 3);
  var d = vtExam();
  d.turns = d.turns.map(function (t) { return Object.assign({}, t, { eval: Object.assign({}, t.eval, { answer_first: true }) }); });
  var m = vivaCommMetrics(d);
  vtEq(m.answerFirst, m.n); vtEq(m.answerFirstEstimated, false);
  vtEq(vivaCommMetrics(vtExam()).answerFirstEstimated, true);
  var one = vivaNewDoc({ plan: [], mode: 'write', turns: [Object.assign(vtMarked(0, 'main', vtScores(60, 60, 60, 60)), { answer: 'Word' })] });
  vtAssert(vivaCommMetrics(one).notes.some(function (s) { return s.indexOf('averaged 1 word.') >= 0; }), 'one word, singular');
});
check('rehearsal: XP and quest progress are paid once at completion', function () {
  var d = vtExam({ id: 'v_xp', format: 'standard' });
  var rep = vivaComputeReport(d);
  var pay = vivaRewardOf(d, rep);
  vtEq(pay.mains, 3); vtEq(pay.follows, 1); vtEq(pay.answers, 100);
  vtEq(vivaRewardOf({ format: 'quick', turns: [] }, { percent: 60, partial: false, source: 'ai', grade: 'Pass' }).finish, 60);
  vtEq(vivaRewardOf({ format: 'qualifying', turns: [] }, { percent: 60, partial: false, source: 'ai', grade: 'Pass' }).finish, 200);
  vtEq(vivaRewardOf({ format: 'standard', turns: [] }, { percent: 60, partial: true, source: 'ai', grade: 'Pass' }).finish, 0, 'no completion pay on an early end');
  var dist = vivaRewardOf({ format: 'standard', turns: [] }, { percent: 90, partial: false, source: 'ai', grade: 'Distinction' });
  vtEq(dist.bonus, 80);
  vtEq(vivaRewardOf({ format: 'standard', turns: [] }, { percent: 90, partial: false, source: 'self', grade: 'Distinction' }).bonus, 0, 'self-marked earns no bonus');
  var before = Store.state.profile.xp, bestBefore = Store.state.profile.stats.vivaBest || 0, qBefore = Store.state.profile.stats.vivaQuestions || 0;
  var saved = vivaComplete(d, Object.assign({}, rep, { partial: false, source: 'self', percent: 99, grade: 'Distinction' }));
  vtEq(saved.report.xpEarned, vivaRewardOf(d, Object.assign({}, rep, { partial: false, source: 'self', percent: 99, grade: 'Distinction' })).total); vtAssert(Store.state.profile.xp - before >= saved.report.xpEarned, 'xpEarned is paid');
  vtEq(Store.state.profile.stats.vivaBest || 0, bestBefore, 'self-marked exams do not touch vivaBest');
  vtEq((Store.state.profile.stats.vivaQuestions || 0) - qBefore, 3);
  var after = Store.state.profile.xp;
  vivaComplete(saved, saved.report);
  vtEq(Store.state.profile.xp, after, 'never paid twice');
  Store.deleteViva('v_xp');
});
check('rehearsal: self-marked exams are practice, offline content is honest', function () {
  var d = vtExam({ status: 'done', source: 'offline' });
  d.turns = d.turns.map(function (t) { return Object.assign({}, t, { eval: Object.assign({}, t.eval, { self: true }) }); });
  var r = vivaComputeReport(d);
  vtEq(r.source, 'self'); vtEq(r.cards.length, 0, 'no generic flashcards'); vtEq(vivaIsSealed(r), false);
  vtAssert(r.next.every(function (s) { return s.indexOf('flashcards') < 0; }), 'no promise of flashcards');
  d.report = r;
  var v = vtRender(VivaReport({ doc: d }));
  vtAssert(!v.seen.VivaSeal, 'no seal'); vtHas(v, 'Self-assessed:'); vtHas(v, 'Self-marked: practice only');
  if (r.gaps.length) vtHas(v, 'Checklist for any answer of this kind');
  vtEq(vivaSyllabusTopics('Week 1: Entropy and disorder\nLecture 2 - Carnot cycle\nHomework due Friday\nunit 3. Heat pumps').join('|'), 'Entropy and disorder|Carnot cycle|Heat pumps');
  ['homework', 'grading', 'attendance', 'quiz'].forEach(function (w) { vtAssert(VIVA_STOP.has(w), w); });
  vtEq(vivaConcepts({ subject: 'Heat', material: 'Week 1: Entropy\nWeek 2: Enthalpy' })[0], 'Entropy');
  vtHas(vtRender(VivaSelfMark({ turn: vtTurn(), answers: ['First', 'Second'], offline: true, plan: { keyPoints: ['k'] }, marks: {}, setMarks: function () {}, covered: [], setCovered: function () {}, reason: 'offline', onSubmit: function () {} })), 'Checklist for any answer of this kind');
  /* The self route asks a follow-up with no marks to go on. */
  var f = vivaOfflineFollow(null, 0, vtTurn(), { concept: 'x' }, ['elenchos'], function () { return 0; });
  vtEq(f.action, 'followup'); vtAssert(f.question.length > 8);
});
check('rehearsal: warm-up and closing stay out of the marks', function () {
  var plan = vivaFallbackPlan({ format: 'quick', persona: 'socratic', subject: 'Optics' }).questions;
  var warm = Object.assign(vivaMakeTurn({ qi: -1, kind: 'warm', q: 'Before we begin?', examiner: 'elenchos' }), { answered: true, answer: 'Lenses were hardest for me personally, and here is why that was.', eval: vivaNoMarkEval('Thank you.') });
  var adv = vivaAdvance({ plan: plan, turns: [warm] }, warm.eval);
  vtEq(adv.next, 'main'); vtEq(adv.turns[1].q, plan[0].q); vtEq(adv.turns[1].lead, 'Thank you.');
  vtEq(vivaResumePhase({ status: 'live', turns: [warm] }), 'verdict', 'a marked last turn is not owed');
  var close = Object.assign(vivaMakeTurn({ qi: -1, kind: 'close', q: VIVA_CLOSE_Q, examiner: 'elenchos' }), { answered: true, answer: 'I would correct my definition of focus.', eval: vivaNoMarkEval() });
  var d = vivaNewDoc({ subject: 'Optics', source: 'ai', mode: 'write', status: 'done', plan: plan, turns: [warm, vtMarked(0, 'main', vtScores(60, 60, 60, 60)), close] });
  vtEq(vivaCommMetrics(d).n, 1, 'metrics count question turns only');
  vtEq(vivaQuestionScores(d)[0].rubric.accuracy, 60); vtEq(vivaComputeReport(d).answered, 1);
  var p = vivaReportPrompt(d);
  vtAssert(p.indexOf('correction_credit') >= 0 && p.indexOf('I would correct my definition') >= 0, 'closing reaches the report prompt only');
  vtAssert(vivaEvalPrompt(d, 1).indexOf('Lenses were hardest') >= 0, 'later questions may use the warm-up');
  var base = vivaComputeReport(d);
  vtEq(vivaNormReport({ correction_credit: 99 }, d).correctionCredit, Math.min(4, base.capMax - base.percent > 0 ? 4 : 0));
  vtEq(vivaNormReport({ correction_credit: 4 }, vivaNewDoc({ source: 'ai', mode: 'write', plan: plan, turns: [vtMarked(0, 'main', vtScores(60, 60, 60, 60))] })).correctionCredit, 0, 'no closing, no credit');
  d.report = vivaNormReport({}, d);
  var v = vtRender(VivaReport({ doc: d }));
  vtHas(v, 'Warm-up'); vtHas(v, 'Closing question');
  vtAssert(vivaMarkdown(d).indexOf('**Warm-up:**') >= 0 && vivaMarkdown(d).indexOf('**Closing:**') >= 0, 'markdown');
  ['intro', 'asking', 'think', 'answer'].forEach(function (ph) {
    ['aloud', 'dictate', 'write'].forEach(function (m) {
      vtRender(VivaRoom({ doc: vtExam({ mode: m, turns: [vivaMakeTurn({ qi: -1, kind: 'warm', q: 'Before we begin?', examiner: 'elenchos' })] }), startPhase: ph }));
      vtRender(VivaRoom({ doc: vtExam({ mode: m, turns: [vivaMakeTurn({ qi: -1, kind: 'close', q: VIVA_CLOSE_Q, examiner: 'elenchos' })] }), startPhase: ph }));
    });
  });
  vtHas(vtRender(VivaRoom({ doc: vtExam({ mode: 'aloud', turns: [vivaMakeTurn({ qi: -1, kind: 'close', q: VIVA_CLOSE_Q, examiner: 'elenchos' })] }), startPhase: 'answer' })), 'Nothing to add');
  vtHas(vtRender(VivaRoom({ doc: vtExam({ mode: 'write', turns: [vivaMakeTurn({ qi: -1, kind: 'warm', q: 'Before we begin?', examiner: 'elenchos' })] }), startPhase: 'answer' })), 'Skip the warm-up');
});
check('rehearsal: leaving, pasting and switching away are noted neutrally', function () {
  var d = vtExam();
  d.turns[1] = Object.assign({}, d.turns[1], { left: 1, pasted: 120, hiddenSec: 30 });
  var notes = vivaConductNotes(d);
  vtEq(notes[0], 'You left the room once during question 1.'); vtEq(notes[1], 'You pasted 120 words during question 1.'); vtAssert(notes[2].indexOf('switched away') >= 0);
  vtAssert(vivaTranscriptText(d, null, false).indexOf('left the room once') >= 0, 'facts reach the examiners');
  vtEq(vivaConductNotes({}).length, 0, 'old docs have nothing to report');
  d.status = 'done'; d.report = vivaComputeReport(d);
  vtHas(vtRender(VivaReport({ doc: d })), 'What the room noted');
});
check('rehearsal: Why ladder format', function () {
  vtEq(vivaMaxFollows({ format: 'ladder' }), 6); vtEq(vivaMaxFollows({ format: 'standard' }), 2); vtEq(vivaOfflineFollowLimit({ format: 'ladder' }), 3); vtEq(vivaOfflineFollowLimit({}), 1);
  vtEq(vivaNormEval({ scores: vtScores(50, 50, 50, 50), next: { action: 'followup', question: 'Why does that hold?' } }, { follows: 5, maxFollows: 6 }).next.action, 'followup');
  vtEq(vivaNormEval({ scores: vtScores(50, 50, 50, 50), next: { action: 'followup', question: 'Why does that hold?' } }, { follows: 6, maxFollows: 6 }).next.action, 'move_on');
  var plan = vivaFallbackPlan({ format: 'ladder', persona: 'socratic', subject: 'Optics', topic: 'Lenses' }).questions;
  vtEq(plan.length, 1);
  var doc = vivaNewDoc({ format: 'ladder', subject: 'Optics', source: 'ai', mode: 'write', status: 'done', plan: plan, turns: [vtMarked(0, 'main', vtScores(80, 80, 80, 80)), vtMarked(0, 'follow', vtScores(70, 60, 70, 70)), Object.assign(vtMarked(0, 'follow', vtScores(40, 40, 60, 60)), { q: 'Where does it break?' })] });
  vtEq(vivaLadderHeld(doc).held, 2); vtEq(vivaLadderHeld(doc).brokeAt, 'Where does it break?');
  vtAssert(vivaPlanPrompt(doc).indexOf('Write exactly 1 question') >= 0, 'plan prompt');
  vtAssert(vivaEvalPrompt(doc, 1).indexOf('Each follow-up goes one level deeper') >= 0, 'eval prompt');
  vtEq(vivaAdvance({ format: 'ladder', plan: plan, turns: doc.turns.slice(0, 2) }, { next: { action: 'followup', question: 'And then why?' } }).next, 'followup');
  vtEq(vivaAdvance({ format: 'ladder', plan: plan, turns: doc.turns.slice(0, 2) }, { next: { action: 'move_on' } }).next, 'verdict', 'the drill has no closing turn');
  doc.report = vivaComputeReport(doc);
  vtHas(vtRender(VivaReport({ doc: doc })), 'You held 2 levels.');
});
check('rehearsal: retakes keep what went wrong and show whether gaps closed', function () {
  var was = vtExam({ id: 'v_was', status: 'done', topic: 'Heat' });
  was.report = vivaComputeReport(was);
  was.report.gaps = [{ concept: 'Entropy', missing: 'The why.', outline: [] }, { concept: 'Entropy', missing: 'Again.', outline: [] }, { concept: 'Carnot cycle', missing: 'The limit.', outline: [] }];
  var n = vivaRetake(was);
  vtEq(n.focus.join('|'), 'Entropy|Carnot cycle', 'deduped'); vtEq(n.topic, 'Heat', 'topic survives'); vtEq(n.retakeQs.length, 3); vtEq(n.retakeGaps[0].missing, 'The why.');
  var p = vivaPlanPrompt(n);
  vtAssert(p.indexOf('Do not reuse these') >= 0 && p.indexOf('Entropy: The why.') >= 0, 'plan prompt');
  Store.deleteViva(n.id);
  var cur = vtExam({ id: 'v_now', status: 'done', retakeOf: 'v_was', retakeGaps: [{ concept: 'Entropy' }, { concept: 'Carnot cycle' }, { concept: 'Gone' }] });
  cur.report = { percent: 80, grade: 'Merit', rubric: { accuracy: 80, depth: 70, reasoning: 70, communication: 70 }, perQuestion: [{ qi: 0, concept: 'Entropy', score: 80 }, { qi: 1, concept: 'The Carnot cycle', score: 55 }] };
  var cmp = vivaRetakeCompare(cur, was);
  vtEq(cmp.gaps[0].status, 'Closed'); vtEq(cmp.gaps[1].status, 'Still open'); vtEq(cmp.gaps[2].status, 'Not retested'); vtEq(cmp.delta, 80 - was.report.percent);
  vtEq(vivaRetakeCompare(cur, null), null);
  return vtState({ vivas: [was, cur] }, function () {
    cur.report = Object.assign(vivaComputeReport(cur), { percent: 80, grade: 'Merit' });
    var v = vtRender(VivaReport({ doc: cur }));
    vtHas(v, 'Since your last attempt'); vtHas(v, 'since your last attempt'); vtAssert(v.seen.Delta, 'delta rendered');
  });
});
check('rehearsal: earlier questions are not repeated, weak concepts surface', function () {
  var old = { id: 'v_old', status: 'done', subject: 'Optics', finished: 10, level: 'grad', plan: [{ q: 'OLD QUESTION ONE' }], report: { percent: 50, grade: 'Not yet', perQuestion: [{ qi: 0, concept: 'Focus', score: 40 }, { qi: 1, concept: 'Lenses', score: 30 }] } };
  var newer = { id: 'v_new', status: 'done', subject: 'optics', finished: 20, plan: [], report: { percent: 80, grade: 'Merit', perQuestion: [{ qi: 0, concept: 'Lenses', score: 85 }] } };
  return vtState({ vivas: [old, newer, { id: 'x', subject: 7 }, null] }, function () {
    vtAssert(vivaPlanPrompt({ id: 'v_z', subject: 'Optics', format: 'quick', persona: 'socratic' }).indexOf('OLD QUESTION ONE') >= 0, 'prior questions');
    var weak = vivaWeakConcepts(Store.state.vivas);
    vtEq(weak.length, 1, 'a later strong attempt clears a concept'); vtEq(weak[0].concept, 'Focus');
    vtHas(vtRender(VivaWeak({ vivas: Store.state.vivas })), 'Examine me on this');
    vtEq(VivaWeak({ vivas: [] }), null);
  });
});
check('rehearsal: stated durations cover the allowed time, setup defaults stay short', function () {
  Object.keys(VIVA_FORMATS).forEach(function (k) {
    var f = VIVA_FORMATS[k], doc = { think: f.think, answer: f.answer, format: k };
    var perMain = vivaClockSecs(doc, { kind: 'main' }, 'think') + vivaClockSecs(doc, { kind: 'main' }, 'answer');
    var perFollow = vivaClockSecs(doc, { kind: 'follow' }, 'think') + vivaClockSecs(doc, { kind: 'follow' }, 'answer');
    var maxSec = f.n * (perMain + vivaMaxFollows(doc) * perFollow) + (f.drill ? 0 : 130);
    var top = Number(f.range.split(' to ')[1]);
    vtAssert(top >= Math.floor(maxSec / 60), k + ' range ' + f.range + ' under ' + maxSec + 's');
    vtAssert(top <= Math.ceil(maxSec / 60) + 2, k + ' range overstated');
  });
  lsDel('viva.last');
  vtState({ vivas: [] }, function () { vtEq(vivaInitialForm().format, 'quick'); vtEq(vivaInitialForm().mode, 'speak'); vtEq(vivaInitialForm().think, 15); });
  vtState({ vivas: [{ id: 'a' }] }, function () { vtEq(vivaInitialForm().format, 'standard'); });
  var form = vtRender(VivaSetup({}));
  ['What are you being examined on?', 'My own work', 'More options', 'Speak my answers', 'Type my answers (content drill)', 'Show my marks as I go', 'Kind of subject'].forEach(function (s) { vtHas(form, s); });
  vtAssert(form.all.indexOf('Offline') < 0 || Store.state.ai === 'off', 'online copy');
  vtRender(VivaSetup({ draft: vivaNewDoc({ basis: 'work', material: 'x', format: 'ladder', mode: 'dictate', discipline: 'applied' }) }));
  vtState({ ai: 'off' }, function () { vtHas(vtRender(VivaSetup({})), 'earns no seal'); });
});
check('rehearsal: old exam docs still open', function () {
  var plan = vivaFallbackPlan({ format: 'standard', persona: 'socratic', subject: 'Optics' }).questions;
  var oldLive = { id: 'v_old1', type: 'viva', subject: 'Optics', status: 'live', mode: 'write', format: 'standard', persona: 'socratic', plan: plan, turns: [{ id: 't1', qi: 0, kind: 'main', q: 'Old question here?', examiner: 'elenchos', answered: false }] };
  ['intro', 'asking', 'answer', 'self', 'verdict'].forEach(function (ph) { vtRender(VivaRoom({ doc: oldLive, startPhase: ph })); });
  var oldReport = { percent: 74, grade: 'Merit', rubric: { accuracy: 70, depth: 70, reasoning: 70, communication: 70 }, answered: 5, total: 5, partial: false, source: 'ai', summary: 'Fine.', strengths: [], gaps: [], panel: [], next: [], cards: [], commNotes: [], comm: { n: 5, answerFirst: 3 }, perQuestion: [] };
  var oldDone = { id: 'v_old2', type: 'viva', subject: 'Optics', status: 'done', mode: 'write', format: 'standard', persona: 'socratic', plan: plan, turns: [], report: oldReport };
  var v = vtRender(VivaReport({ doc: oldDone }));
  vtAssert(v.seen.VivaSeal, 'an old graded report keeps its seal'); vtHas(v, 'Merit');
  vtRender(VivaHistory({ vivas: [oldDone, oldLive] }));
  vtAssert(vivaMarkdown(oldDone).indexOf('Merit') >= 0, 'markdown');
  vtRender(VivaRevise({ doc: oldDone }));
});

check('spoken: measured delivery reaches the metrics, the prompt and the report', function () {
  var d = vtExam({ mode: 'speak' });
  d.turns = [vtMarked(0, 'main', vtScores(70, 60, 65, 70), { answer: 'Photosynthesis turns light into sugar. It matters because, um, it makes oxygen. For example a tree.' }), vtMarked(1, 'main', vtScores(60, 55, 60, 65), { answer: 'Chlorophyll absorbs light. Because of that electrons move.' })];
  d.turns.forEach(function (t, i) { t.spoken = true; t.answerSec = 40; t.delivery = { durationSec: 40, words: 18, wpm: i ? 190 : 140, pausesLong: i ? 3 : 0, pausesDeliberate: 2, fillers: i ? 0 : 1, pitchStd: 3.1 }; });
  var m = vivaCommMetrics(d);
  vtAssert(m.spoken && m.wpm === 165 && m.pausesLong === 3, 'aggregates: ' + JSON.stringify([m.wpm, m.pausesLong]));
  vtAssert(m.notes.some(function (n) { return n.indexOf('silence') >= 0; }), 'a note about silences');
  var prompt = vivaEvalPrompt(d, 0);
  vtAssert(prompt.indexOf('verbatim speech-to-text transcript') >= 0 && prompt.indexOf('140 words per minute') >= 0, 'the examiner sees the transcript and the measured pace');
  vtAssert(vivaReportPrompt(d).indexOf('spoken and transcribed') >= 0, 'the report prompt says the answers were spoken');
  d.report = vivaComputeReport(d);
  var v = vtRender(VivaReport({ doc: d }));
  vtHas(v, 'Pace'); vtHas(v, 'Silences over 2 s'); vtHas(v, 'audio was not kept');
  vtAssert(speechDeliveryLine({ wpm: 150, pausesLong: 1, fillers: 2, durationSec: 61 }).indexOf('150 words per minute; 1 silence over 2 seconds; 2 filler words; spoke for 1:01') >= 0, 'delivery line');
  vtAssert(speechDeliveryLine(null) === '', 'no delivery, no line');
  vtRender(VivaRoom({ doc: Object.assign({}, d, { status: 'live', turns: [vivaMakeTurn({ qi: 0, kind: 'main', q: 'Q?', examiner: 'elenchos' })] }), startPhase: 'answer' }));
  vtRender(VivaRoom({ doc: Object.assign({}, d, { status: 'live', turns: [vivaMakeTurn({ qi: 0, kind: 'main', q: 'Q?', examiner: 'elenchos' })] }), startPhase: 'transcribing' }));
  vtRender(VivaRoom({ doc: Object.assign({}, d, { status: 'live', turns: [vivaMakeTurn({ qi: 0, kind: 'main', q: 'Q?', examiner: 'elenchos' })] }), startPhase: 'retype' }));
  vtRender(VivaRoom({ doc: Object.assign({}, d, { status: 'live', micFallback: true, turns: [vivaMakeTurn({ qi: 0, kind: 'main', q: 'Q?', examiner: 'elenchos' })] }), startPhase: 'answer' }));
});
