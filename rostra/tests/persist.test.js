// Sync and data-integrity scenarios against a fake db that enforces the 256 KiB document limit.
(function () {
  var timers = [];
  window.setTimeout = function (fn) { timers.push({ fn: fn, dead: false }); return timers.length; };
  window.clearTimeout = function (id) { if (timers[id - 1]) timers[id - 1].dead = true; };
  var fireTimers = function () { var t = timers; timers = []; t.forEach(function (x) { if (!x.dead) x.fn(); }); drainMicrotasks(); };
  var settle = function () { for (var i = 0; i < 6; i++) { drainMicrotasks(); fireTimers(); } };
  var utf8 = function (s) { return new TextEncoderLite().encode(s).length; };
  function TextEncoderLite() { this.encode = function (t) { var n = 0; for (var i = 0; i < t.length; i++) { var c = t.charCodeAt(i); n += c < 0x80 ? 1 : c < 0x800 ? 2 : 3; } return { length: n }; }; }
  if (typeof TextEncoder === 'undefined') window.TextEncoder = TextEncoderLite;

  var remote = {}, failNext = [], connected = true, uid = 'u1';
  var db = {
    collection: function () {
      return {
        get: function () { return Promise.resolve({ docs: Object.keys(remote).map(function (id) { return { id: id, exists: true, data: function () { return remote[id]; } }; }) }); },
        doc: function (id) {
          return {
            set: function (b) {
              if (failNext.length) return Promise.reject({ code: failNext.shift() });
              if (utf8(JSON.stringify(b)) > 256 * 1024) return Promise.reject({ code: 'invalid_argument' });
              remote[id] = JSON.parse(JSON.stringify(b)); return Promise.resolve();
            },
            delete: function () { delete remote[id]; return Promise.resolve(); },
          };
        },
      };
    },
  };
  window.claude = { use: function (n) { return Promise.resolve(!connected ? null : n === 'db' ? db : n === 'user' ? { id: function () { return Promise.resolve(uid); } } : null); } };
  var toasts = [];
  FX.on(function (t, d) { if (t === 'toast') toasts.push(d.text); });
  var freshPage = function () { // a reload: memory gone, localStorage kept
    Persist.mode = 'local'; Persist.col = null; Persist.inflight = {}; Persist.pending = {}; Persist.timers = {}; Persist.latest = {}; Persist.seq = {}; Persist.warned = false;
    timers = [];
    Store.state = { ready: false, profile: defaultProfile(), speeches: [], preps: [], vivas: [], backend: 'local', ai: 'off' };
    bootStore(); settle();
  };
  var wipe = function () { Object.keys(_ls).forEach(function (k) { delete _ls[k]; }); remote = {}; failNext = []; connected = true; uid = 'u1'; toasts = []; freshPage(); };
  var eq = function (a, b, msg) { if (a !== b) throw new Error((msg || 'expected') + ': got ' + JSON.stringify(a) + ', wanted ' + JSON.stringify(b)); };
  var bigPrep = function () { var p = newPrep(Store.state.profile); p.brief.material = new Array(60000).join('word '); return p; };

  check('persist: a document over the limit stays local and sync keeps working', function () {
    wipe();
    var p = bigPrep(); Store.savePrep(p); settle();
    Store.act(function (pp, c) { c.xp(500, 'x'); }); settle();
    eq(Persist.mode, 'db', 'mode'); eq(remote.profile.xp, 500, 'remote xp'); eq(!!remote[p.id], false, 'oversize on remote');
    eq(toasts.some(function (t) { return /too large to sync/.test(t); }), true, 'warned');
    freshPage();
    eq(Store.state.profile.xp, 500, 'xp after reload'); eq(Store.state.preps.length, 1, 'oversize prep survives reload');
    return 'kept ' + Store.state.preps[0].brief.material.length + ' chars locally';
  });
  check('persist: work done while disconnected is uploaded, not discarded', function () {
    wipe();
    Store.act(function (pp, c) { c.xp(100, 'x'); }); settle();
    connected = false; freshPage();
    eq(Persist.mode, 'local', 'offline mode');
    Store.act(function (pp, c) { c.xp(400, 'x'); }); Store.saveViva({ id: 'v_off', subject: 'x', status: 'live' }); settle();
    connected = true; freshPage();
    eq(Store.state.profile.xp, 500, 'xp'); eq(Store.state.vivas.length, 1, 'exam'); eq(remote.profile.xp, 500, 'uploaded xp'); eq(!!remote.v_off, true, 'uploaded exam');
  });
  check('persist: closing the tab inside the debounce loses nothing', function () {
    wipe();
    Store.act(function (pp, c) { c.xp(150, 'x'); }); // debounced, timer never fires
    freshPage();
    eq(Store.state.profile.xp, 150); eq(remote.profile.xp, 150, 'uploaded on next boot');
  });
  check('persist: flush sends debounced writes immediately', function () {
    wipe();
    Store.act(function (pp, c) { c.xp(70, 'x'); });
    Persist.flush(); drainMicrotasks();
    eq(remote.profile.xp, 70);
  });
  check('persist: a transient failure retries, and a second failure stays dirty for next boot', function () {
    wipe();
    failNext = ['unavailable']; Store.saveViva({ id: 'v_a', subject: 'a' }, 0); settle();
    eq(!!remote.v_a, true, 'retried once');
    failNext = ['unavailable', 'unavailable']; Store.saveViva({ id: 'v_b', subject: 'b' }, 0); settle();
    eq(!!remote.v_b, false, 'still failing'); eq(Persist.mode, 'db', 'mode stays db');
    freshPage();
    eq(!!remote.v_b, true, 'uploaded on next boot');
  });
  check('persist: a debounced save cannot overwrite a newer immediate one', function () {
    wipe();
    Store.saveViva({ id: 'v_c', subject: 'old' }, 600);
    Store.saveViva({ id: 'v_c', subject: 'new' }, 0); settle();
    eq(remote.v_c.subject, 'new');
  });
  check('persist: a deleted document stays deleted', function () {
    wipe();
    Store.saveViva({ id: 'v_d', subject: 'x' }, 600);
    Store.deleteViva('v_d'); settle();
    eq(!!remote.v_d, false, 'not resurrected'); freshPage(); eq(Store.state.vivas.length, 0, 'gone after reload');
  });
  check('persist: a delete made offline reaches the server later', function () {
    wipe();
    Store.saveViva({ id: 'v_e', subject: 'x' }, 0); settle();
    connected = false; freshPage();
    Store.deleteViva('v_e'); settle();
    connected = true; freshPage();
    eq(!!remote.v_e, false, 'server copy removed'); eq(Store.state.vivas.length, 0);
  });
  check('persist: remote data from another device still loads when nothing is dirty', function () {
    wipe();
    Store.act(function (pp, c) { c.xp(10, 'x'); }); settle();
    remote.profile = Object.assign({}, remote.profile, { xp: 999 });
    freshPage();
    eq(Store.state.profile.xp, 999);
  });
  check('persist: another account on this browser never inherits the cache', function () {
    wipe();
    Store.act(function (pp, c) { c.xp(321, 'x'); }); settle();
    uid = 'u2'; remote = {};
    freshPage();
    eq(Store.state.profile.xp, 0, 'xp'); eq(Object.keys(remote).length, 0, 'nothing uploaded');
  });
  check('persist: a view-only rejection falls back to this browser with a warning', function () {
    wipe();
    failNext = ['invalid_argument']; Store.saveViva({ id: 'v_f', subject: 'x' }, 0); settle();
    eq(Persist.mode, 'local'); eq(toasts.some(function (t) { return /saved in this browser/.test(t); }), true);
  });
  check('skills: deleting a speech refolds the triangle', function () {
    wipe();
    var a = JSON.parse(JSON.stringify(getSample())); a.id = 's_a'; a.fp = 1; a.date = 1;
    var b = JSON.parse(JSON.stringify(getSample())); b.id = 's_b'; b.fp = 2; b.date = 2; b.scores.ethos = 20;
    Store.addSpeech(a); Store.addSpeech(b); settle();
    var withB = Store.state.profile.skills.ethos;
    Store.deleteSpeech('s_b'); settle();
    eq(Store.state.profile.skills.ethos, a.scores.ethos, 'back to a alone');
    Store.deleteSpeech('s_a'); settle();
    eq(Store.state.profile.skills.ethos, null, 'empty after last delete');
    return 'with b ' + withB;
  });
  check('xp: a duplicate speech earns nothing and does not move skills', function () {
    wipe();
    var a = JSON.parse(JSON.stringify(getSample())); a.id = 's_a'; a.fp = 5; a.xp = 100;
    Store.addSpeech(a); settle();
    var xp = Store.state.profile.xp;
    var d = JSON.parse(JSON.stringify(a)); d.id = 's_d'; d.dup = true; d.xp = 0; d.scores.ethos = 1;
    Store.addSpeech(d); settle();
    eq(Store.state.profile.xp, xp, 'xp'); eq(Store.state.profile.stats.speeches, 1, 'stats');
  });
  check('fx: hold queues rewards until released', function () {
    wipe();
    var seen = []; var off = FX.on(function (t) { seen.push(t); });
    FX.hold();
    Store.act(function (p, c) { c.xp(5, 'x'); });
    eq(seen.indexOf('xp'), -1, 'held'); FX.emit('toast', { text: 'still shows' }); eq(seen.indexOf('toast') >= 0, true, 'toast passes');
    FX.release();
    eq(seen.indexOf('xp') >= 0, true, 'released'); off();
  });
  check('levels: the cap has no NaN', function () { var l = levelInfo(1000000); eq(isFinite(l.progress), true); eq(l.level, 60); return l.title; });
  check('quests: finished content is never offered', function () {
    var p = defaultProfile(); p.stats.read = LIBRARY.map(function (s) { return s.id; });
    for (var i = 0; i < 400; i++) { var day = addDays('2027-01-01', i); if (pickQuests(day, p).indexOf('read') >= 0) throw new Error('read on ' + day); }
    return 'ok';
  });
})();
