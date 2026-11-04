// The Gym: pure logic, banks, every station in every state, and the stylesheet that dresses them.
// Run through tests/harness.js after core.test.js. All helpers are prefixed gt to keep the shared scope clean.

function gtAssert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function gtEq(a, b, msg) { if (a !== b) throw new Error((msg || 'expected equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }
function gtNear(a, b, msg) { if (Math.abs(a - b) > 1e-6) throw new Error((msg || 'expected near') + ': got ' + a + ', want ' + b); }
function gtThrows(fn, code) { var threw = null; try { fn(); } catch (e) { threw = e; } gtAssert(threw, 'expected a throw'); if (code) gtEq(threw.code, code, 'error code'); }
function gtProfile(patch) { return Object.assign(defaultProfile(), { name: 'Ana', onboarded: true }, patch || {}); }
function gtWith(patch, fn) {
  var saved = Store.state;
  Store.state = Object.assign({}, saved, { profile: gtProfile(), ai: 'ready' }, patch || {});
  try { return fn(); } finally { Store.state = saved; }
}

/* Walk an html`` stub tree. Nested <${Comp} a=${x} b="y" /> are called for real (the stub leaves them as
   interpolated functions), so a single render exercises the whole subtree. Collects text and classNames. */
function gtWalk(node, out, depth) {
  out = out || { text: [], classes: {}, comps: {} };
  depth = depth || 0;
  if (depth > 40) throw new Error('render too deep');
  if (node == null || node === false || node === true) return out;
  if (typeof node === 'string' || typeof node === 'number') { out.text.push(String(node)); return out; }
  if (Array.isArray(node)) { node.forEach(function (n) { gtWalk(n, out, depth + 1); }); return out; }
  if (!node.strings) return out;
  var S = node.strings, V = node.vals;
  S.forEach(function (s, i) {
    var re = /className="([^"]*)"/g, m;
    while ((m = re.exec(s))) m[1].split(/\s+/).filter(Boolean).forEach(function (c) { out.classes[c] = true; });
    // Text keeps its order: a string, then the value that follows it.
    out.text.push(s.replace(/<[^>]*>?/g, ' '));
    if (i >= V.length) return;
    var v = V[i], before = s;
    if (/className=$/.test(before)) { String(v || '').split(/\s+/).filter(Boolean).forEach(function (c) { out.classes[c] = true; }); return; }
    if (typeof v === 'function' && /<$/.test(before)) {
      var props = {}, j = i + 1;
      for (; j <= V.length; j++) {
        var seg = S[j], close = seg.indexOf('>');
        var head = close >= 0 ? seg.slice(0, close) : seg;
        var st = /([A-Za-z]+)="([^"]*)"/g, sm;
        while ((sm = st.exec(head))) props[sm[1]] = sm[2];
        if (close >= 0) break;
        var dyn = head.match(/([A-Za-z]+)=$/);
        if (dyn) props[dyn[1]] = V[j];
      }
      out.comps[v.name] = true;
      gtWalk(v(props), out, depth + 1);
      return;
    }
    if (typeof v !== 'function' && !(v && typeof v === 'object' && !v.strings && !Array.isArray(v))) gtWalk(v, out, depth + 1);
  });
  return out;
}
function gtRender(fn, props) { var o = gtWalk(fn(props || {})); o.str = o.text.join('').replace(/\s+/g, ' '); return o; }
function gtHas(o, needle) { gtAssert(o.str.indexOf(needle) >= 0, 'missing text "' + needle + '" in: ' + o.str.slice(0, 200)); }
var gtSeen = {};
function gtRun(fn, props) { var o = gtRender(fn, props); Object.keys(o.classes).forEach(function (c) { gtSeen[c] = true; }); return o; }

/* ---------- Breathing ---------- */
check('gym breath: every preset walks in, hold, out and rounds', function () {
  gtEq(GYM_BREATH_PRESETS.length, 3);
  GYM_BREATH_PRESETS.forEach(function (P) {
    var a = P.phases[0], h = P.phases[1], x = P.phases[2], cyc = a + h + x, R = 3;
    gtEq(P.phases.length, 3); gtAssert(a > 0 && h > 0 && x > 0, P.id);
    var t0 = gymBreathPhase(0, P.phases, R);
    gtEq(t0.idx, 0); gtEq(t0.frac, 0); gtEq(t0.round, 0); gtEq(t0.left, a); gtEq(t0.done, false); gtEq(t0.cycle, cyc); gtEq(t0.total, cyc * R);
    var mid = gymBreathPhase(a / 2, P.phases, R);
    gtEq(mid.idx, 0); gtNear(mid.frac, 0.5); gtNear(mid.left, a / 2);
    var hold = gymBreathPhase(a, P.phases, R);
    gtEq(hold.idx, 1); gtEq(hold.frac, 0);
    var out = gymBreathPhase(a + h, P.phases, R);
    gtEq(out.idx, 2); gtEq(out.frac, 0); gtEq(out.left, x);
    var next = gymBreathPhase(cyc, P.phases, R);
    gtEq(next.round, 1); gtEq(next.idx, 0);
    var last = gymBreathPhase(cyc * R - 0.01, P.phases, R);
    gtEq(last.round, R - 1); gtEq(last.idx, 2); gtEq(last.done, false);
    var done = gymBreathPhase(cyc * R, P.phases, R);
    gtEq(done.done, true); gtEq(done.progress, 1); gtEq(done.left, 0); gtEq(done.round, R - 1);
  });
  return GYM_BREATH_PRESETS.map(function (p) { return p.id + ':' + p.phases.join('-'); }).join(' ');
});
check('gym breath: bad input stays safe', function () {
  gtEq(gymBreathPhase(-5, [4, 4, 4], 5).idx, 0);
  gtEq(gymBreathPhase(-5, [4, 4, 4], 5).frac, 0);
  gtEq(gymBreathPhase('nope', [4, 4, 4], 5).frac, 0);
  gtEq(gymBreathPhase(1, null, 5).cycle, 12);
  gtEq(gymBreathPhase(1, [4, 4, 4], 0).total, 12, 'at least one round');
  gtEq(gymBreathPhase(5, [4, 0, 4], 1).idx, 2, 'a zero hold is skipped');
  gtEq(gymBreathPhase(0, [0, 0, 0], 1).cycle, 1, 'all-zero phases do not divide by zero');
});
check('gym breath: level and orb follow the triangle', function () {
  var P = [4, 2, 6];
  gtNear(gymBreathLevel(gymBreathPhase(0, P, 1)), 0, 'empty at the start');
  gtNear(gymBreathLevel(gymBreathPhase(2, P, 1)), 0.5, 'half way up');
  gtEq(gymBreathLevel(gymBreathPhase(5, P, 1)), 1, 'full on the hold');
  gtNear(gymBreathLevel(gymBreathPhase(9, P, 1)), 0.5, 'half way down');
  gtEq(gymBreathLevel(gymBreathPhase(99, P, 1)), 1, 'rests full when done');
  gtEq(gymBreathLevel(null), 1);
  var start = gymOrbAt(gymBreathPhase(0, P, 1));
  gtEq(start[0], GYM_TRI[0][0]); gtEq(start[1], GYM_TRI[0][1]);
  var top = gymOrbAt(gymBreathPhase(4, P, 1));
  gtEq(top[0], GYM_TRI[1][0]); gtEq(top[1], GYM_TRI[1][1]);
  var right = gymOrbAt(gymBreathPhase(6, P, 1));
  gtEq(right[0], GYM_TRI[2][0]); gtEq(right[1], GYM_TRI[2][1]);
  gtEq(gymOrbAt(null), GYM_TRI[0]);
  gtEq(gymOrbAt(gymBreathPhase(99, P, 1)), GYM_TRI[0]);
  var seen = gymOrbAt(gymBreathPhase(2, P, 1));
  gtAssert(seen[0] < GYM_TRI[0][0] && seen[0] > GYM_TRI[1][0], 'rises up the left side');
});

/* ---------- Wheel ---------- */
check('gym wheel: angle to segment under a pointer at the top', function () {
  var n = 10;
  gtEq(gymWheelIndex(0, n), 0);
  gtEq(gymWheelIndex(-18, n), 0, 'the wheel rests centered on segment 0');
  gtEq(gymWheelIndex(-36, n), 1, 'turning the wheel back shows the next segment');
  gtEq(gymWheelIndex(-359, n), 9);
  gtEq(gymWheelIndex(1, n), 9, 'clockwise one degree brings the last segment under the pointer');
  gtEq(gymWheelIndex(36, n), 9);
  gtEq(gymWheelIndex(37, n), 8);
  gtEq(gymWheelIndex(360, n), 0);
  gtEq(gymWheelIndex(3600 - 18, n), 0);
  gtEq(gymWheelIndex('x', n), 0);
  for (var i = 0; i < n; i++) gtEq(gymWheelIndex(-(i * 36 + 18), n), i, 'center of ' + i);
});
check('gym wheel: landing hits the chosen segment after the full turns', function () {
  var n = GYM_CATS.length, seg = 360 / n, rs = [0, 0.25, 0.5, 0.999], froms = [-18, 0, 77.3, 1800.5, -400];
  for (var i = 0; i < n; i++) rs.forEach(function (r) { froms.forEach(function (from) {
    [5, 6].forEach(function (turns) {
      var a = gymWheelLanding(from, i, n, function () { return r; }, turns);
      gtEq(gymWheelIndex(a, n), i, 'lands on ' + i + ' from ' + from);
      gtAssert(a >= from + 360 * turns, 'spins at least ' + turns + ' turns');
      gtAssert(a < from + 360 * (turns + 1) + 1, 'and not much more');
      gtEq(gymWheelIndex(a + seg * 0.17, n), i, 'clear of the leading peg');
      gtEq(gymWheelIndex(a - seg * 0.17, n), i, 'clear of the trailing peg');
    });
  }); });
});
check('gym wheel: wedges are valid arcs', function () {
  var d = gymArcPath(0, 36, 186);
  gtAssert(/^M0 0L0\.00 -186\.00A186 186 0 0 1 /.test(d), d);
  gtAssert(/Z$/.test(d));
  gtAssert(gymArcPath(0, 200, 50).indexOf(' 0 1 1 ') > 0, 'large arc flag past 180 degrees');
});

/* ---------- Twisters ---------- */
check('gym twisters: syllable counts', function () {
  var cases = { red: 1, 'lorry,': 2, 'yellow': 2, 'lorry.': 2, a: 1, peter: 2, piper: 2, picked: 1, pickled: 2, woodchuck: 2, 'which': 1, menagerie: 4, 'thirty-three': 3, 'seventy-seven': 5, 'sheikh’s': 1, benevolent: 4, elephants: 3, '': 1, '123': 1 };
  Object.keys(cases).forEach(function (w) { gtEq(gymSyllables(w), cases[w], w); });
  gtEq(gymSyllables(null), 1); gtEq(gymSyllables(undefined), 1);
  GYM_TWISTERS.forEach(function (t) { t.text.split(/\s+/).forEach(function (w) { var s = gymSyllables(w); gtAssert(s >= 1 && s <= 7, w + ' ' + s); }); });
});
check('gym twisters: timing is ordered, paced and repeated', function () {
  var text = 'Red lorry, yellow lorry.';
  var slow = gymTwisterTiming(text, 2.5, 3), fast = gymTwisterTiming(text, 6.5, 3);
  gtEq(slow.items.length, 12); gtEq(slow.words, 4); gtEq(slow.reps, 3);
  gtAssert(fast.total < slow.total, 'faster pace, shorter round');
  gtEq(slow.items[0].start, 0); gtEq(slow.items[0].w, 'Red'); gtEq(slow.items[0].rep, 0); gtEq(slow.items[4].rep, 1); gtEq(slow.items[4].i, 0); gtEq(slow.items[11].rep, 2);
  gtNear(slow.items[1].dur, 2 / 2.5, 'lorry takes two syllables');
  slow.items.forEach(function (it, i) { if (i) gtAssert(it.start >= slow.items[i - 1].start + slow.items[i - 1].dur - 1e-9, 'no overlap at ' + i); });
  gtAssert(slow.items[2].start > slow.items[1].start + slow.items[1].dur, 'a comma adds a breath');
  gtAssert(slow.items[4].start > slow.items[3].start + slow.items[3].dur, 'a gap between repetitions');
  var end = slow.items[11];
  gtNear(slow.total, end.start + end.dur, 'no trailing rest after the last word');
  GYM_PACES.forEach(function (p) { GYM_TWISTERS.forEach(function (t) { var x = gymTwisterTiming(t.text, p.sps); gtEq(x.reps, GYM_TW_REPS); gtAssert(x.total > 0 && x.total < 120, t.id + ' at ' + p.id + ': ' + x.total); x.items.forEach(function (it) { gtAssert(it.dur >= 0.16); }); }); });
  gtEq(gymTwisterTiming('', 3).items.length, 0);
  gtEq(gymTwisterTiming(null, 3).total, 0);
  gtNear(gymTwisterTiming('red', 0).items[0].dur, 1 / 3, 'a zero pace falls back');
  gtNear(gymTwisterTiming('red', 0.01).items[0].dur, 1 / 0.5, 'a tiny pace is floored');
});
check('gym twisters: word lookup matches a linear scan', function () {
  var tm = gymTwisterTiming('Betty Botter bought some butter, but she said the butter’s bitter.', 3.5, 3);
  gtEq(gymWordAt(tm, -0.1), -1); gtEq(gymWordAt(tm, 0), 0); gtEq(gymWordAt(tm, tm.total), tm.items.length); gtEq(gymWordAt(tm, tm.total + 5), tm.items.length);
  for (var t = 0; t < tm.total; t += 0.037) {
    var want = 0; tm.items.forEach(function (it, i) { if (it.start <= t) want = i; });
    gtEq(gymWordAt(tm, t), want, 'at ' + t);
  }
  gtEq(gymWordAt({ items: [], total: 0 }, 1), -1);
  gtEq(gymWpm(3.5), 145); gtAssert(gymVoiceRate(100) === 1.8 && gymVoiceRate(0.1) === 0.6, 'voice rate is clamped');
});

/* ---------- Device check ---------- */
check('gym lab: our own model lines never fail the quick check', function () {
  var ok = 0;
  GYM_LAB.forEach(function (x) {
    var r = gymDeviceCheck(x.device, x.model, x.plain);
    gtAssert(r.ok !== false, x.id + ' ' + x.device + ': ' + r.note);
    gtAssert(typeof r.note === 'string' && r.note.length > 0, x.id + ' needs a note');
    if (r.ok === true) ok++;
  });
  return ok + ' confirmed, ' + (GYM_LAB.length - ok) + ' left for the speaker to judge';
});
check('gym lab: quick check, device by device', function () {
  var yes = {
    anaphora: 'We will rise. We will build. We will win.',
    epistrophe: 'We plan it together, we run it together.',
    tricolon: 'It is cheaper, faster, simpler.',
    question: 'Who wants more traffic in town?',
    hypophora: 'Why do we practice? Because it works.',
    alliteration: 'Wild winter wind whipped through.',
    asyndeton: 'We came, we saw, we won.',
    polysyndeton: 'Food and water and tents and maps.',
    chiasmus: 'Practice builds confidence, and confidence builds practice.',
    simile: 'It ran like a spark through grass.',
    litotes: 'Winning this is no small thing.',
  };
  var no = {
    anaphora: 'The roads got fixed by us today.',
    epistrophe: 'We plan it, then ship the thing.',
    tricolon: 'Plain one clause here today',
    question: 'Nobody wants more traffic today.',
    hypophora: 'Remote work helps people today.',
    alliteration: 'The product is fast today.',
    asyndeton: 'We came and we saw and we won.',
    polysyndeton: 'Food and water for us.',
    chiasmus: 'Practice makes people more confident.',
    simile: 'It was quite fast today.',
    metaphor: 'It ran like a spark through grass.',
    litotes: 'It was very good today.',
    antithesis: 'Plain one clause today only',
    climax: 'It helps our town today',
  };
  Object.keys(yes).forEach(function (d) { gtEq(gymDeviceCheck(d, yes[d]).ok, true, d + ' yes: ' + gymDeviceCheck(d, yes[d]).note); });
  Object.keys(no).forEach(function (d) { gtEq(gymDeviceCheck(d, no[d]).ok, false, d + ' no: ' + gymDeviceCheck(d, no[d]).note); });
  gtEq(gymDeviceCheck('metaphor', 'Every book is a door today.').ok, null, 'a metaphor is the speaker’s call');
  gtEq(gymDeviceCheck('antithesis', 'Talk is cheap; change is expensive.').ok, null);
  gtEq(gymDeviceCheck('climax', 'A street, a town, a country.').ok, null);
  gtEq(gymDeviceCheck('unknown', 'Three words here.').ok, null);
  gtEq(gymDeviceCheck('anaphora', 'too short').ok, null);
  gtEq(gymDeviceCheck('anaphora', '').ok, null);
  gtEq(gymDeviceCheck('anaphora', null).ok, null);
  var copied = gymDeviceCheck('tricolon', 'The new plan will save money, and will also be quicker!', 'The new plan will save money and will also be quicker.');
  gtEq(copied.ok, false, 'a copy of the plain line fails');
  gtAssert(/original/.test(copied.note));
});
check('gym lab: words that name Object.prototype members do not crash the check', function () {
  var line = 'constructor builds the constructor, and constructor builds constructor again';
  Object.keys(GYM_DEVICES).forEach(function (d) { gymDeviceCheck(d, line); });
  gtEq(gymDeviceCheck('epistrophe', 'We call the constructor, you call the constructor.').ok, true);
  gtEq(gymDeviceCheck('anaphora', 'Constructor one here. Constructor two there.').ok, true);
  gtEq(gymDeviceCheck('chiasmus', 'A constructor needs care, and care needs a constructor.').ok, true);
});

/* ---------- Banks ---------- */
check('gym banks: at least 80 prompts, in ten categories', function () {
  gtEq(GYM_CATS.length, 10);
  var all = [];
  GYM_CATS.forEach(function (c) {
    gtAssert(c.id && c.name && /^var\(--gym-w\d\)$/.test(c.c), c.id);
    gtAssert(c.structs.length >= 2, c.id + ' structs');
    c.structs.forEach(function (s) { gtAssert(GYM_STRUCTS[s], c.id + ' needs ' + s); });
    var bank = GYM_PROMPTS[c.id];
    gtAssert(Array.isArray(bank) && bank.length >= 8, c.id + ' bank');
    bank.forEach(function (q) { gtAssert(typeof q === 'string' && q.length >= 12 && q.length <= 110, q); gtAssert(/[.?!]$/.test(q), 'unfinished: ' + q); });
    all = all.concat(bank);
  });
  gtEq(Object.keys(GYM_PROMPTS).length, GYM_CATS.length, 'no orphan banks');
  gtAssert(all.length >= 80, all.length + ' prompts');
  gtEq(new Set(all).size, all.length, 'prompts are unique');
  return all.length + ' prompts';
});
check('gym banks: at least 24 twisters across three tiers', function () {
  gtAssert(GYM_TWISTERS.length >= 24, GYM_TWISTERS.length);
  gtEq(new Set(GYM_TWISTERS.map(function (t) { return t.id; })).size, GYM_TWISTERS.length, 'unique ids');
  gtEq(new Set(GYM_TWISTERS.map(function (t) { return t.text; })).size, GYM_TWISTERS.length, 'unique text');
  gtEq(GYM_TIERS.length, 3);
  GYM_TWISTERS.forEach(function (t) { gtAssert(GYM_TIERS[t.tier] && GYM_TIERS[t.tier].id === t.tier, t.id); gtAssert(t.focus && t.text, t.id); gtAssert(t.text.split(/\s+/).length >= 3, t.id); });
  GYM_TIERS.forEach(function (tier) { gtAssert(GYM_TWISTERS.filter(function (t) { return t.tier === tier.id; }).length >= 6, tier.name); });
  gtEq(GYM_PACES.length, 5);
  GYM_PACES.forEach(function (p, i) { gtAssert(p.id && p.name && p.sps > 0); if (i) gtAssert(p.sps > GYM_PACES[i - 1].sps, 'paces get faster'); });
  return GYM_TWISTERS.length + ' twisters';
});
check('gym banks: at least 20 lab items whose marks are in the model', function () {
  gtAssert(GYM_LAB.length >= 20, GYM_LAB.length);
  gtEq(new Set(GYM_LAB.map(function (x) { return x.id; })).size, GYM_LAB.length, 'unique ids');
  GYM_LAB.forEach(function (x) {
    gtAssert(GYM_DEVICES[x.device], x.id + ' device');
    gtAssert(x.plain && x.model && x.plain !== x.model, x.id);
    gtAssert(Array.isArray(x.marks) && x.marks.length >= 1, x.id + ' marks');
    var segs = gymSegments(x.model, x.marks);
    gtEq(segs.map(function (s) { return s.t; }).join(''), x.model, x.id + ' segments rebuild the line');
    x.marks.forEach(function (m, k) { gtAssert(segs.some(function (s) { return s.k === k; }), x.id + ' mark not found: ' + m); });
  });
  Object.keys(GYM_DEVICES).forEach(function (k) {
    var d = GYM_DEVICES[k];
    gtAssert(d.name && d.def && d.recipe && d.checks.length >= 2, k);
    gtAssert(GYM_LAB.some(function (x) { return x.device === k; }), k + ' has no specimen');
  });
  return GYM_LAB.length + ' items, ' + Object.keys(GYM_DEVICES).length + ' devices';
});
check('gym banks: stations, warm-up, structures, review', function () {
  gtEq(GYM_STATIONS.length, 5);
  GYM_STATIONS.forEach(function (s) { gtAssert(s.id && s.roman && s.name && s.short && s.mins && s.color && s.stat && s.blurb, s.id); gtAssert(ICONS[s.icon], s.icon); gtAssert(typeof GYM_ART[s.id] === 'function', s.id + ' art'); });
  gtEq(gymStation('lab').id, 'lab'); gtEq(gymStation('nope').id, 'breath');
  gtEq(gymNextStation('breath').id, 'warmup'); gtEq(gymNextStation('lab').id, 'breath');
  gtEq(GYM_WARMUP.length, 6);
  GYM_WARMUP.forEach(function (w) { gtAssert(w.id && w.title && w.feel && w.say, w.id); gtEq(w.how.length, 3, w.id); });
  Object.keys(GYM_STRUCTS).forEach(function (k) { var s = GYM_STRUCTS[k]; gtEq(s.id, k); gtAssert(s.name && s.parts.length >= 3, k); s.parts.forEach(function (p) { gtAssert(p.n && p.h, k); }); });
  GYM_REVIEW_DIMS.forEach(function (d) { gtAssert(GYM_REVIEW_TIPS[d.id], d.id + ' tips'); gtAssert(d.name && d.ask && d.c, d.id); });
  gtEq(GYM_RATE_WORDS.length, 6);
  gtEq(GYM_BREATH_CUES.length, 3);
  gtEq(GYM_BULBS.length, 16);
  GYM_BULBS.forEach(function (b) { gtAssert(b[0] >= 0 && b[0] <= 100 && b[1] >= 0 && b[1] <= 100, 'bulb on the frame'); gtAssert(b[0] === 0 || b[0] === 100 || b[1] === 0 || b[1] === 100, 'bulb on an edge'); });
  ['gymWheel', 'gymPrism', 'gymBell'].forEach(function (i) { gtAssert(ICONS[i], i); });
});

/* ---------- Draws, cues, fallbacks ---------- */
check('gym roulette: prompt and structure draws', function () {
  var bank = GYM_PROMPTS.story;
  gtEq(gymPickPrompt('story', function () { return 0; }), bank[0]);
  gtEq(gymPickPrompt('story', function () { return 0.999; }), bank[bank.length - 1]);
  gtEq(gymPickPrompt('story', function () { return 1; }), bank[0], 'even a rnd of 1 stays in range');
  gtEq(gymPickPrompt('story', function () { return 0; }, [bank[0]]), bank[1], 'skips what you just had');
  gtAssert(bank.indexOf(gymPickPrompt('story', Math.random, bank)) >= 0, 'recycles once the bank runs dry');
  gtEq(gymPickPrompt('nope'), '');
  GYM_CATS.forEach(function (c) {
    c.structs.forEach(function (s) { var other = gymPickStruct(c.id, Math.random, s); gtAssert(GYM_STRUCTS[other] && other !== s, c.id + ' reshape from ' + s); });
    gtAssert(c.structs.indexOf(gymPickStruct(c.id, function () { return 0.5; })) >= 0);
  });
  gtAssert(GYM_STRUCTS[gymPickStruct('nope')]);
});
check('gym roulette: speaking cues run from open to time', function () {
  var S = GYM_STRUCTS.prep, keys = {};
  for (var l = 60; l >= -5; l -= 1) keys[gymSpeakCue(l, 60, S).key] = true;
  ['open', 'half', 'close', 'time'].forEach(function (k) { gtAssert(keys[k], 'missing cue ' + k); });
  gtEq(gymSpeakCue(60, 60, S).key, 'open'); gtAssert(gymSpeakCue(60, 60, S).text.indexOf('point') >= 0);
  gtEq(gymSpeakCue(30, 60, S).key, 'half');
  gtEq(gymSpeakCue(12, 60, S).key, 'close');
  gtEq(gymSpeakCue(0, 60, S).key, 'time'); gtEq(gymSpeakCue(-9, 60, S).key, 'time');
  gtEq(gymSpeakCue(45, 60, S).key, 'part1');
  gtEq(gymSpeakCue(20, 60, null).key, 'part2', 'falls back to PREP');
  GYM_CATS.forEach(function (c) { c.structs.forEach(function (id) { [60, 90, 120].forEach(function (t) { for (var x = t; x >= -2; x -= 3) gtAssert(gymSpeakCue(x, t, GYM_STRUCTS[id]).text, id); }); }); });
});
check('gym roulette: offline coach notes use the ratings', function () {
  var S = GYM_STRUCTS.wsn;
  var low = gymReviewFallback({ structure: 1, clarity: 2, confidence: 2, pace: 2 }, '', S);
  gtEq(low.offline, true); gtAssert(/brave/.test(low.verdict)); gtAssert(low.next.indexOf('what') >= 0, 'names the first part of the structure'); gtAssert(low.worked.length > 10);
  gtAssert(/Next time/.test(low.structure));
  var high = gymReviewFallback({ structure: 5, clarity: 5, confidence: 5, pace: 4 }, 'My point was very clear to all.', S);
  gtAssert(/strong/.test(high.verdict)); gtEq(high.worked, GYM_REVIEW_TIPS.confidence.praise); gtEq(high.next, GYM_REVIEW_TIPS.pace.tip(S)); gtAssert(/Check your notes/.test(high.structure));
  var junk = gymReviewFallback(null, null, null);
  gtAssert(junk.verdict && junk.structure && junk.next);
  var weird = gymReviewFallback({ structure: 'x', clarity: 99, confidence: -3, pace: null });
  gtAssert(weird.verdict, 'bad ratings are clamped');
});
check('gym coach: AI replies are validated, not trusted', function () {
  [null, undefined, 'text', 3, [], {}, { verdict: '   ' }, { structure: 'only structure' }].forEach(function (bad) { gtThrows(function () { gymNormFeedback(bad); }, 'invalid_json'); gtThrows(function () { gymNormLab(bad); }, 'invalid_json'); });
  var f = gymNormFeedback({ verdict: 'Good ' + 'x'.repeat(400), worked: 42, next: { nested: true }, opener: null, structure: '  a\n  b ' });
  gtEq(f.verdict.length, 160); gtEq(f.worked, '42'); gtEq(f.opener, ''); gtEq(f.structure, 'a b'); gtEq(typeof f.next, 'string');
  gtEq(gymNormFeedback({ strength: 'kept', verdict: 'v' }).worked, 'kept');
  var cases = [[{ verdict: 'v', score: 150 }, 100], [{ verdict: 'v', score: -5 }, 0], [{ verdict: 'v', score: 'high' }, 60], [{ verdict: 'v' }, 60], [{ verdict: 'v', score: '71.6' }, 72], [{ verdict: 'v', score: Infinity }, 60]];
  cases.forEach(function (c) { gtEq(gymNormLab(c[0]).score, c[1], JSON.stringify(c[0])); });
  gtEq(gymNormLab({ verdict: 'v', uses: 'true' }).uses, true); gtEq(gymNormLab({ verdict: 'v', uses: 'yes' }).uses, false); gtEq(gymNormLab({ verdict: 'v', uses: 1 }).uses, false);
  gtEq(gymStr(null), ''); gtEq(gymStr(undefined), ''); gtEq(gymStr('abc', 2), 'ab');
  var ip = gymImpPrompt({ prompt: 'Topic here', cat: 'Story', struct: GYM_STRUCTS.scr, secs: 60, ratings: { structure: 3, clarity: 4, confidence: 5, pace: 2 }, notes: 'my notes' });
  ['Topic here', 'Situation', 'clarity 4', 'my notes', 'opener'].forEach(function (s) { gtAssert(ip.indexOf(s) >= 0, s); });
  var longNotes = gymImpPrompt({ prompt: 'p', cat: 'c', struct: GYM_STRUCTS.scr, secs: 60, notes: 'n'.repeat(5000) });
  gtAssert(longNotes.length < 4000, 'notes are clipped');
  gtAssert(gymImpPrompt({ prompt: 'p', cat: 'c', struct: GYM_STRUCTS.scr, secs: 60 }).length > 0, 'missing notes and ratings are safe');
  GYM_LAB.forEach(function (x) { var lp = gymLabPrompt(x, 'my line'); gtAssert(lp.indexOf(x.plain) >= 0 && lp.indexOf('my line') >= 0 && lp.indexOf(GYM_DEVICES[x.device].name) >= 0, x.id); });
});
check('gym lab: highlights land on whole words', function () {
  var segs = gymSegments('Eat to live; do not live to eat.', ['eat', 'live']);
  gtEq(segs.filter(function (s) { return s.k >= 0; }).length, 4);
  gtEq(segs[0].t, 'Eat'); gtEq(segs[0].k, 0);
  gtEq(gymSegments('The seat is great', ['eat']).filter(function (s) { return s.k >= 0; }).length, 0, 'no match inside a word');
  gtEq(gymSegments('', ['x']).length, 0);
  gtEq(gymSegments('plain', null)[0].t, 'plain');
  gtEq(gymSegments('plain', [''])[0].k, -1);
  var overlap = gymSegments('we will fix it', ['we will', 'will fix']);
  gtEq(overlap.map(function (s) { return s.t; }).join(''), 'we will fix it', 'overlapping marks keep the text intact');
  var longest = gymSegments('we will fix it', ['we', 'we will']);
  gtEq(longest[0].t, 'we will', 'the longer mark wins at the same start');
});
check('gym profile: daily sheet resets, totals keep, odd data heals', function () {
  var p = {};
  var g = gymEnsure(p);
  gtEq(g.warmups, 0); gtEq(g.crafted, 0); gtAssert(Array.isArray(g.imps)); gtEq(g.day, dayKey()); gtEq(p.gym, g);
  gymMark(p, 'lab'); gymMark(p, 'lab'); gtEq(p.gym.done.lab, 2);
  p.gym.tw.t01 = { best: 1, clean: 2 }; p.gym.warmups = 4; p.gym.day = '2000-01-01';
  gymMark(p, 'breath');
  gtEq(p.gym.done.breath, 1); gtEq(p.gym.done.lab, undefined, 'a new day clears the sheet'); gtEq(p.gym.warmups, 4); gtEq(p.gym.tw.t01.best, 1);
  var odd = { gym: { tw: 'x', imps: 'y', done: 3, day: dayKey() } };
  gymEnsure(odd); gtEq(typeof odd.gym.tw, 'object'); gtAssert(Array.isArray(odd.gym.imps)); gtEq(typeof odd.gym.done, 'object');
  gtEq(gymEnsure({ gym: 'junk' }).warmups, 0);
  var r0 = gymRead(null); gtEq(r0.warmups, 0); gtEq(r0.imps.length, 0);
  var r1 = gymRead({ gym: { day: '2000-01-01', done: { lab: 1 }, imps: 'nope', crafted: 3 } }); gtEq(r1.done.lab, undefined, 'yesterday’s ticks do not show'); gtEq(r1.imps.length, 0); gtEq(r1.crafted, 3);
  var r2 = gymRead({ gym: { day: dayKey(), done: { lab: 1 } } }); gtEq(r2.done.lab, 1);
});
check('gym sound: every cue is safe without audio', function () {
  var was = Sound.enabled;
  [true, false].forEach(function (on) {
    Sound.enabled = on;
    ['tick', 'bowl', 'step', 'land', 'unlock', 'soft', 'bell', 'stumble', 'shimmer'].forEach(function (k) { GymSfx[k](); });
    [0, 1, 2].forEach(function (i) { GymSfx.breath(i); });
    GymSfx.beat(true); GymSfx.beat(false); GymSfx.clap(0.5);
    GymSfx.pad.start(); GymSfx.pad.set(0.5); GymSfx.pad.stop();
  });
  Sound.enabled = was;
  gymBurstAt(null); gymBurstAt({ getBoundingClientRect: function () { return { left: 1, top: 2, width: 3, height: 4 }; } });
});

/* ---------- Rendering: every station, every state, whole subtree ---------- */
check('gym render: GymPage for every station and alias', function () {
  var cases = [[undefined, 'GymHome'], ['', 'GymHome'], ['nope', 'GymHome'], [42, 'GymHome'], ['breath', 'GymBreath'], ['warmup', 'GymWarmup'], ['twisters', 'GymTwisters'], ['impromptu', 'GymRoulette'], ['roulette', 'GymRoulette'], ['lab', 'GymLab']];
  gtWith({}, function () { cases.forEach(function (c) { var o = gtRun(GymPage, { param: c[0] }); gtAssert(o.comps[c[1]], String(c[0]) + ' should render ' + c[1]); }); });
  return cases.length + ' routes';
});
check('gym render: home, fresh and seasoned', function () {
  var fresh = gtWith({}, function () { return gtRun(GymHome); });
  gtHas(fresh, 'Warm up the voice'); gtHas(fresh, 'Do all five stations'); gtHas(fresh, 'Badges in reach'); gtHas(fresh, '0 / 10');
  GYM_STATIONS.forEach(function (s) { gtHas(fresh, s.name); gtAssert(fresh.classes['gym-tile-' + s.id], 'tile class ' + s.id); });
  ['GymArtBreath', 'GymArtMirror', 'GymArtLyric', 'GymArtWheel', 'GymArtPrism', 'BadgeMedal', 'MeanderBar', 'CountUp'].forEach(function (c) { gtAssert(fresh.comps[c], c); });
  var done = {}; GYM_STATIONS.forEach(function (s) { done[s.id] = 1; });
  var full = gtProfile({
    gym: { day: dayKey(), done: done, warmups: 3, crafted: 9, tw: {}, imps: [] },
    badges: { zen: Date.now() },
    quests: { day: dayKey(), picks: ['warmup', 'impromptu', 'drill'], progress: {}, claimed: {}, chest: false },
    stats: Object.assign(defaultProfile().stats, { breaths: 14, impromptus: 2, twisters: 8 }),
  });
  var seasoned = gtWith({ profile: full }, function () { return gtRun(GymHome); });
  gtHas(seasoned, 'All five done'); gtHas(seasoned, 'Done today'); gtHas(seasoned, 'Earned'); gtHas(seasoned, 'Quest +'); gtHas(seasoned, '2 / 5');
  var claimed = Object.assign({}, full, { quests: { picks: ['warmup'], claimed: { warmup: true } } });
  var noQuest = gtWith({ profile: claimed }, function () { return gtRun(GymHome); });
  gtAssert(noQuest.str.indexOf('Quest +') < 0, 'claimed quests stop showing');
  gtWith({ profile: Object.assign(gtProfile(), { quests: null, stats: null }) }, function () { gtRun(GymHome); });
});
check('gym render: breathing through every state and preset', function () {
  gtWith({}, function () {
    var idle = gtRun(GymBreath); gtHas(idle, 'Ready when you are'); gtHas(idle, 'Begin 5 rounds'); gtAssert(idle.classes['is-idle']);
    GYM_BREATH_PRESETS.forEach(function (P) {
      var c = P.phases, cyc = c[0] + c[1] + c[2];
      var lead = gtRun(GymBreath, { init: { preset: P.id, status: 'run', elapsed: -2 } }); gtHas(lead, 'Settle in'); gtHas(lead, 'Pause');
      gtHas(gtRun(GymBreath, { init: { preset: P.id, status: 'run', elapsed: c[0] / 2 } }), 'Breathe in');
      gtHas(gtRun(GymBreath, { init: { preset: P.id, status: 'run', elapsed: c[0] + c[1] / 2 } }), 'Hold');
      gtHas(gtRun(GymBreath, { init: { preset: P.id, status: 'run', elapsed: cyc - 0.5 } }), 'Breathe out');
      gtHas(gtRun(GymBreath, { init: { preset: P.id, status: 'run', rounds: 3, elapsed: cyc + 0.5 } }), 'Round 2 of 3');
      var paused = gtRun(GymBreath, { init: { preset: P.id, status: 'paused', elapsed: 1 } }); gtHas(paused, 'Paused'); gtHas(paused, 'Resume'); gtAssert(paused.classes['is-paused']);
      var done = gtRun(GymBreath, { init: { preset: P.id, status: 'done', rounds: 5, elapsed: cyc * 5, earned: 25 } }); gtHas(done, 'Steady.'); gtHas(done, '5 rounds, steady'); gtHas(done, '+25'); gtHas(done, 'Next: Warm-up');
    });
    gtHas(gtRun(GymBreath, { init: { preset: 'bogus' } }), 'Even');
    [3, 5, 8].forEach(function (n) { gtRun(GymBreath, { init: { rounds: n, status: 'run', elapsed: 0 } }); });
  });
});
check('gym render: breathing stage geometry holds at the extremes', function () {
  var ph = gymBreathPhase(1, [4, 4, 4], 5);
  [['idle', 0.6], ['run', 0], ['run', 1], ['paused', 0.5], ['done', 1], ['run', -3], ['run', 9]].forEach(function (c) {
    var node = GymBreathStage({ status: c[0], ph: ph, level: c[1], lights: [1, 0.3, 0.3], sides: [0.5, 0, 0], rounds: 5, cueWord: 'x', cueSub: 'y', count: 3, cueColor: 'var(--stage-ethos)' });
    var o = gtWalk(node); gtAssert(o.classes['gym-breath-stage'] && o.classes['gym-breath-svg']);
    ['gym-beam-0', 'gym-beam-1', 'gym-beam-2', 'gym-side', 'gym-orb', 'gym-vertex', 'gym-fill-edge', 'gym-cue-word', 'gym-cue-count'].forEach(function (k) { gtAssert(o.classes[k], k); });
    Object.keys(o.classes).forEach(function (k) { gtSeen[k] = true; });
    gtAssert(!/NaN/.test(JSON.stringify(node.vals.filter(function (v) { return typeof v === 'string'; }))), 'no NaN in the geometry');
  });
  gtEq(GYM_DUST.length, 16); GYM_DUST.forEach(function (d) { gtAssert(d.delay <= 0, 'dust is already drifting at first paint'); });
});
check('gym render: warm-up, each step, done and paused', function () {
  gtWith({}, function () {
    var start = gtRun(GymWarmup); gtHas(start, 'Start the warm-up'); gtHas(start, 'Exercise 1 of 6'); gtHas(start, 'Posture check');
    GYM_WARMUP.forEach(function (w, i) {
      var on = gtRun(GymWarmup, { init: { idx: i, started: true, running: true } }); gtHas(on, w.title); gtHas(on, w.feel); gtHas(on, 'Pause'); gtHas(on, w.how[0]);
      gtRun(GymWarmup, { init: { idx: i, started: true, running: false, short: true } });
      gtAssert(on.classes['gym-wa-' + w.id], 'art for ' + w.id);
    });
    var last = gtRun(GymWarmup, { init: { idx: 5, started: true, running: true } }); gtHas(last, 'Exercise 6 of 6');
    var done = gtRun(GymWarmup, { init: { done: true, idx: 5 } }); gtHas(done, 'Warm, loose and ready'); gtHas(done, 'Curtain up'); gtHas(done, '+20'); gtHas(done, 'Warm up again'); gtAssert(done.classes['is-flash']);
    gtRun(GymWarmup, { init: { idx: 99 } });
  });
  ['posture', 'trills', 'siren', 'jaw', 'resonance', 'project', 'unknown'].forEach(function (k) { gtRun(GymWarmArt, { kind: k }); });
  [0, 0.5, 1, 2, -1].forEach(function (pr) {
    var m = gtRun(GymMirror, { kind: 'jaw', progress: pr, flash: pr === 1, title: 'T' });
    gtAssert(m.classes['gym-bulb']);
    if (pr === 0.5) { gtAssert(m.classes['is-lit'] && m.classes['is-next'], 'half lit, one next'); }
    if (pr === 0) gtAssert(!m.classes['is-lit']);
  });
});
check('gym render: twisters in every phase, tier and pace', function () {
  gtWith({}, function () {
    var ready = gtRun(GymTwisters); gtHas(ready, 'Red lorry'); gtHas(ready, 'Press start'); gtHas(ready, 'Start'); gtAssert(ready.classes['is-ready'] && ready.classes['gym-w'] && ready.classes['gym-ball']); gtAssert(ready.classes['is-locked'], 'later paces start locked');
    var count = gtRun(GymTwisters, { init: { phase: 'count' } }); gtHas(count, 'Get ready'); gtAssert(count.classes['gym-count'] && count.classes['is-on'], 'the metronome swings');
    var running = gtRun(GymTwisters, { init: { phase: 'run', k: 1 } }); gtHas(running, 'Repetition 1 of 3'); gtAssert(running.classes['is-now'] && running.classes['is-past'], 'one lit, one sung');
    var second = gtRun(GymTwisters, { init: { phase: 'run', k: 5 } }); gtHas(second, 'Repetition 2 of 3');
    var mark = gtRun(GymTwisters, { init: { phase: 'mark', k: 12 } }); gtHas(mark, 'How did that go?'); gtHas(mark, 'Clean'); gtHas(mark, 'Stumbled'); gtHas(mark, 'Mark your round first');
    ['clean', 'unlock', 'stumble'].forEach(function (kind) { var f = gtRun(GymTwisters, { init: { flash: { kind: kind, text: 'Flash ' + kind } } }); gtHas(f, 'Flash ' + kind); gtAssert(f.classes['is-' + kind]); });
    GYM_TWISTERS.forEach(function (t) { var o = gtRun(GymTwisters, { init: { twId: t.id } }); gtHas(o, t.text.split(' ')[0]); });
    gtHas(gtRun(GymTwisters, { init: { twId: 'bogus' } }), 'Red lorry');
    GYM_TIERS.forEach(function (t) { gtRun(GymTwisters, { init: { tier: t.id } }); });
  });
  var tw = {}; tw.t01 = { best: 4, clean: 9 }; tw.t02 = { best: 1, clean: 3 }; tw.t03 = { best: 'bad' };
  var seasoned = gtProfile({ gym: { day: dayKey(), done: {}, tw: tw, imps: [] } });
  gtWith({ profile: seasoned }, function () {
    var mastered = gtRun(GymTwisters, { init: { twId: 't01' } }); gtHas(mastered, 'Mastered at every pace'); gtAssert(mastered.classes['is-cleared']); gtAssert(!mastered.classes['is-locked'], 'nothing locked once mastered'); gtHas(mastered, 'cleared');
    var part = gtRun(GymTwisters, { init: { twId: 't02' } }); gtAssert(part.classes['is-cleared'] && part.classes['is-locked']);
    gtRun(GymTwisters, { init: { twId: 't03' } });
    gtHas(gtRun(GymTwisters, { init: { twId: 't02', pace: 99 } }), 'Brisk');
  });
  GYM_PACES.forEach(function (p) { var m = gtRun(GymMetronome, { sps: p.sps, on: true }); gtAssert(m.classes['is-on']); });
  gtRun(GymMetronome, { sps: 3, on: false });
});
check('gym render: roulette from wheel to review', function () {
  gtWith({}, function () {
    var wheel = gtRun(GymRoulette); gtHas(wheel, 'Spin the wheel'); gtHas(wheel, 'Ten categories, ninety topics'); gtAssert(wheel.classes['gym-rules'] && wheel.classes['gym-rim-bulb'] && wheel.classes['gym-seg-label'] && wheel.classes['is-wheel']);
    GYM_CATS.forEach(function (c) { gtHas(wheel, c.name); });
    var spinning = gtRun(GymRoulette, { init: { phase: 'spinning' } }); gtHas(spinning, 'Spinning'); gtAssert(spinning.classes['is-spinning']);
    GYM_CATS.forEach(function (c, i) {
      var landed = gtRun(GymRoulette, { init: { phase: 'landed', catIdx: i, prompt: GYM_PROMPTS[c.id][0], structId: c.structs[0] } });
      gtHas(landed, GYM_PROMPTS[c.id][0]); gtHas(landed, 'Spin again'); gtHas(landed, 'Start 30-second think'); gtAssert(landed.classes['is-win'] && landed.classes['is-landed'] && landed.classes['gym-prompt'] && landed.classes['gym-scaffold']);
    });
    var again = gtRun(GymRoulette, { init: { phase: 'wheel', catIdx: 3 } }); gtAssert(!again.classes['is-win'] && !again.classes['is-landed'], 'a new round starts with no old win lit');
    var prep = gtRun(GymRoulette, { init: { phase: 'prep', catIdx: 0, prompt: 'A prompt', structId: 'ppf' } }); gtHas(prep, 'Thinking time'); gtHas(prep, 'start speaking'); gtHas(prep, 'Pick your point'); gtAssert(prep.comps.Klepsydra && prep.classes['gym-spot-clock']);
    var speak = gtRun(GymRoulette, { init: { phase: 'speak', catIdx: 1, prompt: 'A prompt', structId: 'prep', speakSecs: 90 } }); gtHas(speak, 'Speaking time'); gtHas(speak, 'done'); gtAssert(speak.classes['gym-cue-banner'] && speak.classes['is-open']);
    gtRun(GymRoulette, { init: { phase: 'speak', catIdx: -1, prompt: '', structId: 'bogus' } });
    var review = gtRun(GymRoulette, { init: { phase: 'review', catIdx: 2, prompt: 'A prompt', structId: 'scr', spoke: 75 } });
    gtHas(review, 'You held the floor for 1:15'); gtHas(review, '+30'); gtHas(review, 'How did that round feel?'); gtHas(review, 'Get coach feedback'); gtAssert(review.classes['gym-bravo'] && review.classes['gym-slider'] && review.classes['gym-review']);
    GYM_REVIEW_DIMS.forEach(function (d) { gtHas(review, d.name); });
    var ai = gtRun(GymRoulette, { init: { phase: 'review', catIdx: 2, prompt: 'A prompt', fb: { verdict: 'Sharp round', structure: 'Clear', worked: 'Good line', next: 'Pause more', opener: 'Open so' } } });
    gtHas(ai, 'Sharp round'); gtHas(ai, 'Coach feedback'); gtHas(ai, 'A sharper opener');
    var off = gtRun(GymRoulette, { init: { phase: 'review', catIdx: 2, prompt: 'A prompt', fb: Object.assign(gymReviewFallback({}, '', GYM_STRUCTS.prep), { hint: true }) } });
    gtHas(off, 'Coach notes from your self-review'); gtHas(off, 'Jot at least a sentence');
  });
  gtWith({ ai: 'off' }, function () { gtHas(gtRun(GymRoulette, { init: { phase: 'review', catIdx: 2, prompt: 'P' } }), 'See coach notes'); });
  var imps = [{ t: Date.now(), cat: 'story', prompt: 'Told it', secs: 60, r: { structure: 4, clarity: 4, confidence: 4, pace: 4 } }, { t: Date.now(), cat: 'gone', prompt: 'Lost cat', secs: 60, r: null }, { t: Date.now(), prompt: 'No cat' }];
  gtWith({ profile: gtProfile({ gym: { day: dayKey(), done: {}, tw: {}, imps: imps } }) }, function () {
    var r = gtRun(GymRoulette); gtHas(r, 'Your last spins'); gtHas(r, 'Told it'); gtHas(r, '4.0 / 5'); gtHas(r, 'Topic'); gtAssert(r.classes['gym-recent-dot']);
    gtAssert(gtRun(GymRoulette, { init: { phase: 'review', prompt: 'x', catIdx: 0 } }).str.indexOf('Your last spins') < 0, 'hidden during the review');
  });
  gtEq(GymFeedback({ fb: null }), null);
  gtRun(GymFeedback, { fb: { verdict: 'only' } });
  gtRun(GymScaffold, { struct: GYM_STRUCTS.prep, active: 2 });
});
check('gym render: device lab in every state', function () {
  gtWith({}, function () {
    var blank = gtRun(GymLab); gtHas(blank, 'Your rewrite'); gtHas(blank, 'Reveal our version'); gtHas(blank, 'Show me an example first'); gtHas(blank, 'Any device'); gtAssert(blank.classes['gym-bench'] && blank.classes['gym-prism'] && blank.classes['gym-label-card'] && blank.classes['gym-meter']);
    var typed = gtRun(GymLab, { init: { itemId: 'l01', text: 'We will fix the roads. We will fix the schools.' } }); gtHas(typed, 'Quick check:'); gtHas(typed, 'Get coach feedback'); gtAssert(typed.str.indexOf('Show me an example') < 0);
    gtHas(gtRun(GymLab, { init: { itemId: 'l01', text: 'The roads get fixed soon.' } }), 'Not yet:');
    gtHas(gtRun(GymLab, { init: { itemId: 'l18', text: 'We are a ship in trouble.' } }), 'Your call:');
    GYM_LAB.forEach(function (x) { var o = gtRun(GymLab, { init: { itemId: x.id, revealed: true, text: 'A line of text here' } }); gtHas(o, 'Crafted'); gtAssert(o.classes['is-lit'] && o.classes['gym-model'], x.id); });
    gtHas(gtRun(GymLab, { init: { itemId: 'bogus' } }), 'Specimen');
    var fbHi = gtRun(GymLab, { init: { itemId: 'l12', text: 'Cheaper, faster, simpler now', fb: { uses: true, score: 88, verdict: 'Lands', worked: 'The rhythm', next: 'Trim one', example: 'Cheaper, faster, simpler.' } } });
    gtHas(fbHi, 'Lands'); gtHas(fbHi, 'Uses tricolon'); gtHas(fbHi, 'One sharper version'); gtAssert(fbHi.classes.hi && fbHi.classes['gym-lab-fb'] && fbHi.classes['gym-score']);
    gtAssert(gtRun(GymLab, { init: { text: 'one two three', fb: { uses: false, score: 65, verdict: 'V' } } }).classes.mid);
    var low = gtRun(GymLab, { init: { text: 'one two three', fb: { uses: false, score: 20, verdict: 'V' } } }); gtHas(low, 'Not quite');
    var self = gtRun(GymLab, { init: { text: 'one two three', fb: { offline: true } } }); gtHas(self, 'Self-check'); gtHas(self, 'Yes, it lands'); gtHas(self, 'Compare with ours'); gtAssert(self.classes['gym-selfcheck'] && self.classes['gym-checks']);
    gtHas(gtRun(GymLab, { init: { text: 'one two three', fb: { offline: true }, selfOk: true } }), 'Logged.');
    gtHas(gtRun(GymLab, { init: { text: 'one two three', fb: { offline: true }, selfOk: false } }), 'Good call.');
    gtRun(GymLab, { init: { filter: 'hypophora', itemId: 'l17' } });
  });
  gtWith({ ai: 'off' }, function () { gtHas(gtRun(GymLab, { init: { text: 'one two three' } }), 'Check it myself'); });
  GYM_LAB.forEach(function (x) { var o = gtRun(GymModelLine, { item: x }); gtAssert(o.classes['gym-mk'], x.id); });
  gtRun(GymPrism, { lit: true }); gtRun(GymPrism, { lit: false });
  gtRun(GymArtBreath); gtRun(GymArtMirror); gtRun(GymArtLyric); gtRun(GymArtWheel); gtRun(GymArtPrism);
  gtRun(GymHead, { id: 'lab', title: 'T', lead: 'L' }); gtRun(GymHead, { id: 'lab', title: 'T' });
  gtRun(GymToggle, { on: true, icon: 'wave', children: 'x' }); gtRun(GymToggle, { on: false, icon: 'wave', disabled: true });
  gtRun(GymLaurel, { size: 40 }); gtRun(GymFinish, { id: 'lab', title: 'T' }); gtRun(GymFinish, { id: 'breath', title: 'T', xp: 5, onAgain: function () {} });
  gtRun(GymTriGlyph, { phases: [4, 7, 8] });
});

/* ---------- The stylesheet: token discipline, and a rule for every class that was actually rendered ---------- */
var gtCss = '', gtAllCss = '';
try { gtCss = readFile(SRC + '/gym.css'); ['styles.css', 'kit.css', 'art.css', 'viva.css', 'gym.css'].forEach(function (f) { gtAllCss += readFile(SRC + '/' + f) + '\n'; }); } catch (e) { gtCss = ''; }
check('gym css: every class rendered above has a rule', function () {
  if (!gtCss) return 'skipped: no readFile';
  var defined = {}, re = /\.(-?[A-Za-z_][\w-]*)/g, m;
  while ((m = re.exec(gtAllCss))) defined[m[1]] = true;
  // Only the Gym's own classes: medals and the like are rendered from other files, with their own hooks.
  var missing = Object.keys(gtSeen).filter(function (c) { return /^(gym|is-)/.test(c) && !defined[c]; }).sort();
  gtEq(missing.join(' '), '', 'unstyled');
  var dynamic = ['gym-beam-0', 'gym-beam-1', 'gym-beam-2', 'is-idle', 'is-run', 'is-paused', 'is-done', 'is-ready', 'is-count', 'is-mark', 'is-wheel', 'is-spinning', 'is-landed', 'is-prep', 'is-speak', 'is-review', 'is-clean', 'is-unlock', 'is-stumble', 'is-time', 'is-close', 'is-half', 'is-open', 'is-part0', 'is-part1', 'is-part2', 'is-part3'];
  GYM_STATIONS.forEach(function (s) { dynamic.push('gym-head-' + s.id, 'gym-tile-' + s.id); });
  GYM_WARMUP.forEach(function (w) { dynamic.push('gym-wa-' + w.id); });
  dynamic.forEach(function (c) { gtAssert(defined[c], 'no rule for ' + c); });
  return Object.keys(gtSeen).length + ' classes rendered, all styled';
});
check('gym css: wheel gels and shipped bulbs are all defined', function () {
  if (!gtCss) return 'skipped: no readFile';
  GYM_CATS.forEach(function (c) { var name = c.c.replace(/^var\(/, '').replace(/\)$/, ''); gtAssert(gtCss.indexOf(name + ':') >= 0, name); });
});
check('gym css: tokens only, balanced, no dangling keyframes or variables', function () {
  if (!gtCss) return 'skipped: no readFile';
  var body = gtCss.replace(/\/\*[\s\S]*?\*\//g, '');
  gtEq((body.match(/\{/g) || []).length, (body.match(/\}/g) || []).length, 'braces');
  gtEq((body.match(/\(/g) || []).length, (body.match(/\)/g) || []).length, 'parens');
  var hex = body.match(/#[0-9a-fA-F]{3,8}\b/g); gtEq(hex, null, 'raw hex colors');
  var rgb = body.match(/\b(rgb|rgba|hsl|hsla)\(/g); gtEq(rgb, null, 'raw color functions');
  var named = body.replace(/(?:-webkit-)?mask(?:-image)?:[^;]*;/g, '').match(/:\s*(white|black|red|blue|green|gray|grey)\b/g); gtEq(named, null, 'named colors');
  var defs = {}, m, re = /@keyframes\s+([\w-]+)/g; while ((m = re.exec(body))) defs[m[1]] = true;
  var used = {}; (body.replace(/@keyframes\s+[\w-]+/g, '').match(/\bgym[A-Z]\w*/g) || []).forEach(function (n) { used[n] = true; });
  Object.keys(used).forEach(function (n) { gtAssert(defs[n], 'animation with no keyframes: ' + n); });
  Object.keys(defs).forEach(function (n) { gtAssert(used[n], 'unused keyframes: ' + n); });
  var vars = {}, vr = /(--[\w-]+)\s*:/g; while ((m = vr.exec(gtAllCss))) vars[m[1]] = true;
  // Custom properties set from inline styles in gym.js.
  var js = readFile(SRC + '/gym.js'), jr = /'(--[\w-]+)'\s*:/g; while ((m = jr.exec(js))) vars[m[1]] = true;
  var refs = {}, rr = /var\((--[\w-]+)/g; while ((m = rr.exec(body))) refs[m[1]] = true;
  Object.keys(refs).forEach(function (n) { gtAssert(vars[n], 'undefined variable: ' + n); });
  var jsrefs = {}; while ((m = rr.exec(js))) jsrefs[m[1]] = true;
  Object.keys(jsrefs).forEach(function (n) { gtAssert(vars[n], 'gym.js uses undefined variable: ' + n); });
  gtAssert(!/transition:\s*color/.test(body.slice(body.indexOf('.gym-w {'), body.indexOf('.gym-ball'))), 'a word lights up instantly');
  return Object.keys(defs).length + ' keyframes, ' + Object.keys(refs).length + ' variables';
});
check('gym css: phone width rules are present', function () {
  if (!gtCss) return 'skipped: no readFile';
  ['max-width: 560px', 'max-width: 640px', 'max-width: 860px', 'max-width: 920px', 'prefers-reduced-motion: reduce'].forEach(function (q) { gtAssert(gtCss.indexOf(q) >= 0, q); });
});

check('gym effort: the warm-up pays once a day and only for real running time', function () {
  gtEq(gymWarmupXp(0, 30, false).xp, 0, 'skipping through pays nothing'); gtEq(gymWarmupXp(0, 30, false).why, 'short');
  gtEq(gymWarmupXp(89, 30, false).why, 'short'); gtEq(gymWarmupXp(90, 30, false).xp, GYM_WARMUP_XP, 'half of the full warm-up counts');
  gtEq(gymWarmupXp(45, 15, false).xp, GYM_WARMUP_XP, 'the short version has its own bar');
  var again = gymWarmupXp(180, 30, true); gtEq(again.xp, 0, 'a second run today pays nothing'); gtEq(again.why, 'repeat');
  gtWith({}, function () {
    var short = gtRun(GymWarmup, { init: { done: true, idx: 5, outcome: { xp: 0, why: 'short' } } }); gtHas(short, 'Warm-up ended early'); gtHas(short, 'earned no XP'); gtAssert(short.str.indexOf('+20') < 0, 'no XP chip on a skipped run');
    var repeat = gtRun(GymWarmup, { init: { done: true, idx: 5, outcome: { xp: 0, why: 'repeat' } } }); gtHas(repeat, 'already earned');
  });
});
check('gym effort: a short impromptu round earns nothing and says why', function () {
  gtEq(gymImpCounts(0, 60), false); gtEq(gymImpCounts(19, 60), false); gtEq(gymImpCounts(20, 60), true); gtEq(gymImpCounts(20, 120), true);
  gtWith({}, function () {
    var landed = gtRun(GymRoulette, { init: { phase: 'landed', catIdx: 0, prompt: 'A prompt', structId: 'prep', tooShort: 3 } });
    gtHas(landed, 'Too short to count'); gtHas(landed, '0:03'); gtAssert(landed.classes['gym-too-short']);
  });
  var low = gymReviewFallback({ structure: 3, clarity: 3, confidence: 3, pace: 3 }, '', GYM_STRUCTS.prep);
  gtAssert(/You rated/.test(low.verdict), 'the verdict credits the self-rating'); gtAssert(low.worked.indexOf('without a script') < 0);
});
check('gym sound: the muted hint is a working button', function () {
  var was = Sound.enabled; Sound.enabled = false;
  try { gtWith({}, function () { var view = gtRun(GymBreath); gtHas(view, 'Turn sounds on'); }); } finally { Sound.enabled = was; }
});

/* ---------- Prepare, Learn, Library, Trophies, Coach (src/pages-more.js) ---------- */
function gtFindFn(node, name, depth) {
  depth = depth || 0;
  if (!node || depth > 40) return null;
  if (Array.isArray(node)) { for (var a = 0; a < node.length; a++) { var r = gtFindFn(node[a], name, depth + 1); if (r) return r; } return null; }
  if (!node.vals) return null;
  for (var i = 0; i < node.vals.length; i++) {
    var v = node.vals[i];
    if (typeof v === 'function' && v.name === name) return v;
    var f = gtFindFn(v, name, depth + 1); if (f) return f;
  }
  return null;
}
function gtPrep(patch) {
  var angle = { name: 'Angle A', approach: 'x', thesis: 't', beats: ['One', 'Two'], mix: { ethos: 30, pathos: 30, logos: 40 }, fits: '', risk: '' };
  return Object.assign(newPrep(defaultProfile()), { id: 'p_gt', angles: [angle, Object.assign({}, angle, { name: 'Angle B' })], angleIdx: 1, angle: angle, stage: 'angles', sections: [{ id: 's1', name: 'Open', pole: 'ethos', seconds: 30, text: 'My own hard written words stay safe here.', rewarded: true, prompts: [], feedback: null, nudge: null }] }, patch || {});
}
check('prepare: raw material and stories are capped in the brief', function () {
  gtEq(prepCapBrief('material', 'x'.repeat(50000)).length, 40000); gtEq(prepCapBrief('stories', 'x'.repeat(9000)).length, 8000);
  gtEq(prepCapBrief('title', 'x'.repeat(9000)).length, 9000, 'other fields are untouched'); gtEq(prepCapBrief('minutes', 5), 5);
});
check('prepare: a new angle asks first, archives the old text, and restore brings it back', function () {
  gtWith({ ai: 'off', preps: [gtPrep()] }, function () {
    var view = PrepEditor({ id: 'p_gt' });
    var build = gtFindFn(view, 'buildOutline'); gtAssert(build, 'buildOutline is wired to the button');
    build({ type: 'click' });
    var cur = Store.state.preps[0];
    gtEq(cur.sections[0].id, 's1', 'nothing is replaced without confirming'); gtAssert(!cur.sectionsArchive);
    build(true);
    cur = Store.state.preps.find(function (p) { return p.id === 'p_gt'; });
    gtEq(cur.angle.name, 'Angle B'); gtEq(cur.stage, 'build'); gtAssert(cur.sections[0].id !== 's1', 'new sections are in place');
    gtEq(cur.sectionsArchive.length, 1); gtEq(cur.sectionsArchive[0].sections[0].text, 'My own hard written words stay safe here.');
    var restored = Object.assign({}, cur, prepRestoreSections(cur, 0));
    gtEq(restored.sections[0].id, 's1'); gtEq(restored.angle.name, 'Angle A'); gtEq(restored.angleIdx, 0); gtEq(restored.sectionsArchive.length, 0, 'empty new sections are not worth archiving');
    gtHas(gtRender(function () { return PrepEditor({ id: 'p_gt' }); }), 'Restore these sections');
  });
  var many = { sections: [{ text: 'a' }], sectionsArchive: [{ at: 1 }, { at: 2 }, { at: 3 }] };
  gtEq(prepArchiveSections(many).sectionsArchive.length, 3, 'only the last three outlines are kept');
  gtEq(prepRestoreSections({ sectionsArchive: [] }, 4).sections, undefined, 'a bad index changes nothing');
  gtHas(gtRender(PrepAngleConfirm, { count: 2, onReplace: function () {}, onKeep: function () {} }), 'Replace your 2 written sections');
});
check('prepare: bad AI shapes do not break Find my angles', function () {
  var saved = AI.json, done = false, err = null;
  var angle = { name: 'A', approach: 'b', thesis: 'c', beats: ['d'], mix: { ethos: 1, pathos: 1, logos: 1 } };
  AI.json = function () { return Promise.resolve({ angles: [angle, angle, angle], questions: 'not a list' }); };
  gtWith({ ai: 'ready', preps: [gtPrep({ stage: 'brief', sections: [], angles: [], angleIdx: null, briefRewarded: true })] }, function () {
    gtFindFn(PrepEditor({ id: 'p_gt' }), 'findAngles')().then(function () { done = true; }, function (e) { err = e; });
    if (typeof drainMicrotasks === 'function') {
      drainMicrotasks();
      gtAssert(!err, 'findAngles must not reject'); gtAssert(done, 'findAngles settles');
      var cur = Store.state.preps.find(function (p) { return p.id === 'p_gt'; });
      gtEq(cur.stage, 'angles'); gtEq(cur.questions.length, 0);
    }
  });
  AI.json = saved;
  gtEq(prepArr('x').length, 0); gtEq(prepArr(null).length, 0); gtEq(prepArr([1]).length, 1);
});
check('prepare: finish needs half the target, and rehearsal pays once a day per draft', function () {
  gtEq(prepHalfTarget(5), 350); gtEq(prepCanFinish(349, 5), false); gtEq(prepCanFinish(350, 5), true); gtEq(prepHalfTarget(1), 70);
  gtWith({ ai: 'off', preps: [gtPrep({ stage: 'finish' })] }, function () {
    var view = gtRender(function () { return PrepEditor({ id: 'p_gt' }); });
    gtHas(view, 'more words to reach half your target'); gtHas(view, 'Analyze this draft');
    var finish = gtFindFn(PrepEditor({ id: 'p_gt' }), 'finish'); var xp = Store.state.profile.xp; finish();
    gtEq(Store.state.profile.xp, xp, 'a short draft earns nothing'); gtAssert(!Store.state.preps[0].done);
    Store.state.preps[0].done = true; Store.state.preps[0].rehearsals = 2;
    var done = gtRender(function () { return PrepEditor({ id: 'p_gt' }); }); gtHas(done, 'Analyze my recording'); gtHas(done, 'Rehearsed 2 times');
  });
  var one = prepRehearsal({}, '2026-01-01'); gtEq(one.pay, true); gtEq(one.patch.rehearsals, 1);
  var two = prepRehearsal(one.patch, '2026-01-01'); gtEq(two.pay, false); gtEq(two.patch.rehearsals, 2); gtEq(two.patch.rehearsedDays.length, 1);
  gtEq(prepRehearsal(two.patch, '2026-01-02').pay, true);
  gtEq(prepFullRun(1, 140), false, 'jumping to the end is not a rehearsal'); gtEq(prepFullRun((140 / 200) * 60, 140), true, 'a full run at top speed counts'); gtEq(prepFullRun(99, 0), false);
});
check('prepare: AI-off copy is honest', function () {
  gtWith({ ai: 'off', preps: [gtPrep({ stage: 'build' })] }, function () {
    var view = gtRender(function () { return PrepEditor({ id: 'p_gt' }); });
    gtHas(view, 'Section coaching needs the AI coach'); gtAssert(view.str.indexOf('Coach this section') < 0);
  });
  gtWith({ ai: 'off' }, function () {
    gtHas(gtRender(LearnPage), 'Personal lessons need the AI coach');
    gtAssert(gtRender(PrepList).str.indexOf('live coaching') < 0);
  });
});
check('learn: a drill alone does not mark a lesson done', function () {
  var id = LESSONS[0].id, done = {}; done[id] = { drill: true };
  gtWith({ profile: gtProfile({ done: done }) }, function () {
    var view = gtRender(LearnPage); gtHas(view, '0 / '); gtAssert(!view.classes.done);
    var d2 = {}; d2[id] = { at: 1 };
    Store.state = Object.assign({}, Store.state, { profile: gtProfile({ done: d2 }) });
    gtHas(gtRender(LearnPage), '1 / ');
  });
});
check('lesson: quiz XP is paid once across visits', function () {
  var p = gtProfile(), paid = 0, ctx = { xp: function (n) { paid += n; } };
  lessonPayQuiz(p, ctx, 'e1', 0); lessonPayQuiz(p, ctx, 'e1', 0); gtEq(paid, 5, 'a remount cannot pay again'); gtAssert(!p.done.e1, 'payment leaves p.done alone');
  lessonPayQuiz(p, ctx, 'e1', 1); gtEq(paid, 10);
  p.done.e2 = { at: 1 }; lessonPayQuiz(p, ctx, 'e2', 0); gtEq(paid, 10, 'a finished lesson pays no quiz XP');
});
check('lesson: finishing shows a card with the next step', function () {
  var id = LESSONS[0].id, done = {}; done[id] = { at: 1 };
  gtWith({ profile: gtProfile({ done: done }) }, function () {
    var view = gtRender(LessonPage, { id: id }); gtHas(view, 'Lesson complete'); gtHas(view, 'Next lesson:'); gtHas(view, 'Back to the Academy'); gtAssert(view.str.indexOf('Complete lesson') < 0);
  });
  gtHas(gtRender(LessonPage, { id: LESSONS[0].id }), 'Complete lesson');
  var rep = gtRender(LessonDoneCard, { lesson: { from: 's_1' }, xp: 40, next: null }); gtHas(rep, 'Back to your report'); gtHas(rep, '+40 XP'); gtAssert(rep.str.indexOf('Next lesson') < 0);
});
check('arcade: hotkeys stay out of inputs and drawers', function () {
  var hit = { closest: function () { return {}; } }, miss = { closest: function () { return null; } };
  gtEq(gameKeyIgnored(hit), true); gtEq(gameKeyIgnored(miss), false); gtEq(gameKeyIgnored(null), false);
  var had = document.querySelector; document.querySelector = function () { return {}; };
  try { gtEq(gameKeyIgnored(miss), true, 'an open drawer blocks the keys wherever the focus is'); } finally { document.querySelector = had; }
});
check('library: Mark as studied waits for time on the page', function () {
  gtWith({}, function () { var view = gtRender(SpeechPage, { id: LIBRARY[0].id }); gtHas(view, 'unlocks after 20 seconds'); });
});
check('trophies: every badge leads somewhere, and counted badges show progress', function () {
  var pages = Object.keys(PAGES);
  BADGES.forEach(function (b) { gtAssert(BADGE_GO[b.id], 'no route for ' + b.id); gtAssert(pages.indexOf(BADGE_GO[b.id][0]) >= 0, 'bad route for ' + b.id); });
  Object.keys(BADGE_PROGRESS).forEach(function (id) { gtAssert(BADGES.some(function (b) { return b.id === id; }), 'unknown badge ' + id); });
  var p = gtProfile(); p.stats.fallacies = 40; p.stats.lessons = 2;
  var f = badgeProgress('fallacy_hunter', p, []); gtEq(f.value, 25, 'progress stops at the target'); gtEq(f.max, 25);
  gtEq(badgeProgress('scholar', p, []).value, 2); gtEq(badgeProgress('first_words', p, []), null, 'one-off badges have no bar'); gtEq(badgeProgress('triple', p, []), null);
  gtEq(badgeProgress('pillar', p, [{ scores: { ethos: 61 } }, { scores: { ethos: 44 } }]).value, 61);
  gtWith({ ai: 'off', profile: p }, function () { var view = gtRender(TrophiesPage); gtHas(view, '25 / 25'); gtHas(view, 'Needs the AI coach'); gtHas(view, 'You usually speak for'); });
  gtWith({ ai: 'ready', profile: gtProfile() }, function () { gtAssert(gtRender(TrophiesPage).str.indexOf('Needs the AI coach') < 0); });
});
check('coach: with AI off the starters answer from a static map', function () {
  COACH_STARTERS.forEach(function (q) { gtAssert(COACH_OFFLINE[q], 'no answer for: ' + q); gtAssert(coachOfflineAnswer(q, gtProfile()).length > 40); });
  gtAssert(/Analyze a speech/.test(coachOfflineAnswer(COACH_STARTERS[3], gtProfile())), 'no scores yet');
  var a = coachOfflineAnswer(COACH_STARTERS[3], gtProfile({ skills: { ethos: 70, pathos: 41, logos: 80 } })); gtAssert(/Pathos/.test(a) && /41/.test(a), 'names the weakest appeal');
  gtEq(coachOfflineAnswer('Something else', gtProfile()), '');
  gtWith({ ai: 'off' }, function () {
    var view = gtRender(CoachDrawer, { seed: 'seeded question', onClose: function () {} });
    gtHas(view, 'Live coaching needs Claude allowed for this artifact'); gtHas(view, COACH_STARTERS[0]); gtAssert(view.str.indexOf('Ask your coach') < 0, 'no dead text box');
  });
  gtWith({ ai: 'ready' }, function () { gtAssert(gtRender(CoachDrawer, { onClose: function () {} }).str.indexOf('Live coaching needs') < 0); });
});
