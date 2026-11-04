// Content integrity checks for src/data.js. Run through tests/harness.js after core.test.js.
// These guard the shape of the data and the wording that was verified against sources:
// see the checks near the end for passages that must stay in step across banks.
(function () {
  function fail(msg) { throw new Error(msg); }
  function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function report(problems) { if (problems.length) fail(problems.length + ' problem(s): ' + problems.join(' || ')); }
  function dupes(values) {
    var seen = {}, out = [];
    values.forEach(function (v) { if (seen['$' + v]) out.push(v); seen['$' + v] = true; });
    return out;
  }
  function normText(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function speech(id) { return LIBRARY.find(function (s) { return s.id === id; }) || fail('no speech ' + id); }

  var NOTE_KINDS = ['ethos', 'pathos', 'logos', 'device', 'fallacy'];
  var NEW_SPEECHES = ['pericles', 'socrates', 'truth', 'joseph', 'pankhurst'];

  /* ---------- Library ---------- */
  check('library: ids are unique', function () {
    var d = dupes(LIBRARY.map(function (s) { return s.id; }));
    if (d.length) fail('duplicates: ' + d.join(', '));
    return LIBRARY.length + ' speeches';
  });
  check('library: new speeches are present', function () {
    NEW_SPEECHES.forEach(speech);
  });
  check('library: every entry has its fields', function () {
    var p = [];
    LIBRARY.forEach(function (s) {
      ['id', 'title', 'speaker', 'occasion', 'intro', 'text'].forEach(function (k) { if (!isStr(s[k])) p.push(s.id + ' missing ' + k); });
      if (!(s.minutes > 0)) p.push(s.id + ' minutes');
      if (!Array.isArray(s.notes) || !s.notes.length) p.push(s.id + ' has no notes');
      if (!Array.isArray(s.steal) || !s.steal.length || !s.steal.every(isStr)) p.push(s.id + ' steal');
    });
    report(p);
  });
  check('library: years sort to real numbers', function () {
    var p = [];
    LIBRARY.forEach(function (s) {
      if (typeof s.year !== 'number' && !/^\d+ BC$/.test(String(s.year))) p.push(s.id + ' year ' + s.year);
      if (typeof libraryYear(s) !== 'number' || !libraryYear(s)) p.push(s.id + ' libraryYear ' + libraryYear(s));
    });
    report(p);
    if (libraryYear(speech('socrates')) >= 0 || libraryYear(speech('pericles')) >= libraryYear(speech('socrates'))) fail('BC years sort wrongly');
  });
  check('library: each mix has the three poles and sums to 100', function () {
    var p = [];
    LIBRARY.forEach(function (s) {
      if (!isObj(s.mix)) { p.push(s.id + ' has no mix'); return; }
      var keys = Object.keys(s.mix).sort().join();
      if (keys !== POLE_KEYS.slice().sort().join()) p.push(s.id + ' keys ' + keys);
      var sum = POLE_KEYS.reduce(function (a, k) { return a + s.mix[k]; }, 0);
      if (sum !== 100) p.push(s.id + ' sums to ' + sum);
    });
    report(p);
  });
  check('library: note fields and kinds are valid', function () {
    var p = [];
    LIBRARY.forEach(function (s) {
      (s.notes || []).forEach(function (n, i) {
        ['quote', 'label', 'note'].forEach(function (k) { if (!isStr(n[k])) p.push(s.id + '#' + i + ' missing ' + k); });
        if (NOTE_KINDS.indexOf(n.kind) < 0) p.push(s.id + '#' + i + ' kind ' + n.kind);
      });
    });
    report(p);
  });
  check('library: every note quote is an exact substring of its text', function () {
    var p = [];
    LIBRARY.forEach(function (s) {
      s.notes.forEach(function (n) { if (s.text.indexOf(n.quote) < 0) p.push(s.id + ': ' + n.quote); });
    });
    report(p);
  });
  check('library: placeMarks finds every note, with no overlaps dropping any', function () {
    var p = [], total = 0;
    LIBRARY.forEach(function (s) {
      var marks = placeMarks(s.text, s.notes);
      var placed = marks.map(function (m) { return m.idx; });
      total += marks.length;
      s.notes.forEach(function (n, i) { if (placed.indexOf(i) < 0) p.push(s.id + ': ' + n.quote); });
      marks.forEach(function (m) {
        var got = s.text.slice(m.start, m.end);
        if (got !== s.notes[m.idx].quote) p.push(s.id + ' mark text differs: ' + got);
      });
    });
    report(p);
    return total + ' marks';
  });
  check('library: cuts use the […] marker on its own line', function () {
    var p = [];
    LIBRARY.forEach(function (s) {
      var cuts = s.text.split('[…]').length - 1;
      var clean = (s.text.match(/(^|\n)\[…\](\n|$)/g) || []).length;
      if (cuts !== clean) p.push(s.id + ' has ' + (cuts - clean) + ' inline cut(s)');
      if (/\[\.\.\.\]/.test(s.text)) p.push(s.id + ' uses [...]');
    });
    report(p);
  });

  /* ---------- Lessons ---------- */
  check('lessons: ids are unique', function () {
    var d = dupes(LESSONS.map(function (l) { return l.id; }));
    if (d.length) fail('duplicates: ' + d.join(', '));
    return LESSONS.length + ' lessons';
  });
  check('lessons: new lessons are present', function () {
    ['e5', 'p5', 'l5'].forEach(function (id) { if (!LESSONS.some(function (l) { return l.id === id; })) fail('no lesson ' + id); });
  });
  check('lessons: poles and fields are valid', function () {
    var p = [];
    LESSONS.forEach(function (l) {
      if (POLE_KEYS.indexOf(l.pole) < 0) p.push(l.id + ' pole ' + l.pole);
      if (!isStr(l.title)) p.push(l.id + ' title');
      if (!(l.minutes > 0)) p.push(l.id + ' minutes');
      if (!Array.isArray(l.concept) || !l.concept.length || !l.concept.every(isStr)) p.push(l.id + ' concept');
      if (!isStr(l.drill)) p.push(l.id + ' drill');
      (l.terms || []).forEach(function (t, i) { if (!isStr(t.term) || !isStr(t.def)) p.push(l.id + ' term ' + i); });
      if (l.example && (!isStr(l.example.quote) || !isStr(l.example.who) || !isStr(l.example.note))) p.push(l.id + ' example');
    });
    report(p);
  });
  check('lessons: quiz answer indexes are valid', function () {
    var p = [], total = 0;
    LESSONS.forEach(function (l) {
      if (!Array.isArray(l.quiz) || !l.quiz.length) { p.push(l.id + ' has no quiz'); return; }
      l.quiz.forEach(function (q, i) {
        total++;
        var where = l.id + ' q' + i;
        if (!isStr(q.q)) p.push(where + ' text');
        if (!isStr(q.why)) p.push(where + ' why');
        if (!Array.isArray(q.options) || q.options.length < 2 || !q.options.every(isStr)) { p.push(where + ' options'); return; }
        if (dupes(q.options).length) p.push(where + ' repeats an option');
        if (typeof q.answer !== 'number' || q.answer % 1 !== 0 || q.answer < 0 || q.answer >= q.options.length) p.push(where + ' answer ' + q.answer);
      });
    });
    report(p);
    return total + ' questions';
  });

  /* ---------- Arcade ---------- */
  [['fallacies', FALLACIES], ['devices', DEVICES]].forEach(function (pair) {
    var name = pair[0], bank = pair[1];
    check('arcade ' + name + ': items are valid', function () {
      var p = [];
      bank.forEach(function (it, i) {
        ['text', 'answer', 'why'].forEach(function (k) { if (!isStr(it[k])) p.push(name + '#' + i + ' missing ' + k); });
      });
      report(p);
      return bank.length + ' items';
    });
    check('arcade ' + name + ': no duplicate texts', function () {
      var d = dupes(bank.map(function (it) { return normText(it.text); }));
      if (d.length) fail('duplicates: ' + d.join(' | '));
    });
    check('arcade ' + name + ': enough labels and items for a full round', function () {
      var labels = Object.keys(bank.reduce(function (m, it) { m[it.answer] = 1; return m; }, {}));
      if (labels.length < 4) fail('only ' + labels.length + ' labels');
      if (bank.length < 10) fail('only ' + bank.length + ' items');
      return labels.length + ' labels';
    });
  });
  check('arcade devices: every item says who said it', function () {
    var p = [];
    DEVICES.forEach(function (d, i) { if (!isStr(d.who)) p.push('device#' + i); });
    report(p);
  });
  check('arcade: makeRounds builds playable rounds from both banks', function () {
    ['fallacy', 'device'].forEach(function (kind) {
      var rounds = makeRounds(kind);
      if (rounds.length !== 10) fail(kind + ' rounds ' + rounds.length);
      rounds.forEach(function (r) {
        if (r.options.length !== 4) fail(kind + ' options for ' + r.text);
        if (r.options.indexOf(r.answer) < 0) fail(kind + ' answer not offered for ' + r.text);
        if (dupes(r.options).length) fail(kind + ' repeated option for ' + r.text);
      });
    });
  });

  /* ---------- Modern talks ---------- */
  check('modern: https URLs that parse, with a valid pole', function () {
    var p = [];
    MODERN.forEach(function (m) {
      var where = m.title || '(untitled)';
      ['title', 'speaker', 'watch', 'url'].forEach(function (k) { if (!isStr(m[k])) p.push(where + ' missing ' + k); });
      if (!/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+\/[^\s]+$/i.test(m.url || '')) p.push(where + ' url ' + m.url);
      if (POLE_KEYS.indexOf(m.pole) < 0) p.push(where + ' pole ' + m.pole);
      if (typeof m.year !== 'number' || m.year < 1900) p.push(where + ' year ' + m.year);
    });
    report(p);
    return MODERN.length + ' talks';
  });
  check('modern: no repeated talks', function () {
    var d = dupes(MODERN.map(function (m) { return m.url; })).concat(dupes(MODERN.map(function (m) { return m.title; })));
    if (d.length) fail('duplicates: ' + d.join(', '));
  });

  /* ---------- Other id spaces ---------- */
  check('badges and occasions: ids are unique', function () {
    var d = dupes(BADGES.map(function (b) { return b.id; })).concat(dupes(OCCASIONS.map(function (o) { return o.id; })));
    if (d.length) fail('duplicates: ' + d.join(', '));
  });

  /* ---------- Verified wording stays in step ---------- */
  check('sources: each new speech names its version', function () {
    var want = { pericles: ['Thucydides', 'Crawley'], socrates: ['Plato', 'Jowett'], truth: ['Marius Robinson', 'Anti-Slavery Bugle', 'Sojourner Truth Project'], joseph: ['Howard', 'official report'] };
    var p = [];
    Object.keys(want).forEach(function (id) {
      var s = speech(id), blob = s.speaker + ' ' + s.intro;
      want[id].forEach(function (w) { if (blob.indexOf(w) < 0) p.push(id + ' does not mention ' + w); });
    });
    report(p);
  });
  check('sources: the Truth text stays the Robinson report', function () {
    var t = speech('truth').text;
    if (/ain.t i a woman|ar.n.t i a woman/i.test(t)) fail('Gage refrain found in the Robinson text');
    ['I am a woman’s rights.', 'between-a hawk and a buzzard', 'Man, where is your part?'].forEach(function (w) { if (t.indexOf(w) < 0) fail('missing: ' + w); });
  });
  check('sources: lesson examples quote the speech text exactly', function () {
    var pairs = { e5: 'pankhurst', p5: 'joseph', l5: 'truth' };
    var p = [];
    Object.keys(pairs).forEach(function (id) {
      var l = LESSONS.find(function (x) { return x.id === id; });
      if (speech(pairs[id]).text.indexOf(l.example.quote) < 0) p.push(id + ': ' + l.example.quote);
    });
    report(p);
  });
  check('sources: device quotations taken from library speeches match them', function () {
    var pairs = [
      ['Chief Joseph', 'joseph'], ['Sojourner Truth', 'truth'], ['Abraham Lincoln', 'gettysburg'],
      ['Frederick Douglass', 'douglass'], ['Franklin D. Roosevelt', 'fdr'], ['John F. Kennedy', 'jfk'],
      ['Patrick Henry', 'henry'],
    ];
    var p = [], n = 0;
    DEVICES.forEach(function (d) {
      var hit = pairs.find(function (x) { return d.who.indexOf(x[0]) === 0; });
      if (!hit) return;
      var text = normText(speech(hit[1]).text);
      // An ellipsis marks a cut, so each side of it must appear on its own.
      d.text.split('…').forEach(function (part) {
        if (!part.trim()) return;
        n++;
        if (text.indexOf(normText(part)) < 0) p.push(d.who + ': ' + part.trim());
      });
    });
    report(p);
    return n + ' passages';
  });
})();
