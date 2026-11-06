/* ================================================================
   Engine: utilities, persistence, store, gamification, AI, analysis
   ================================================================ */

/* ---------- Utilities ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const std = (a) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const percentile = (arr, p) => {
  if (!arr.length) return 0;
  const a = Float64Array.from(arr).sort();
  const i = clamp((a.length - 1) * p, 0, a.length - 1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  return a[lo] + (a[hi] - a[lo]) * (i - lo);
};
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = (o) => JSON.parse(JSON.stringify(o));
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
const addDays = (key, n) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return dayKey(d); };
const fmtTime = (sec) => { sec = Math.max(0, Math.round(sec || 0)); const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; };
const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtBytes = (b) => (b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');
const wordsOf = (t) => (t || '').match(/[A-Za-z0-9À-ɏЀ-ӿ'’-]+/g) || [];
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const tick = () => new Promise((r) => setTimeout(r, 0));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const plural = (n, w, pl) => `${n} ${n === 1 ? w : pl || w + 's'}`;
const shuffle = (arr, rnd = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const r0 = (v) => (v == null ? null : Math.round(v));
/* A real 0 from Claude stays 0; only missing or garbage values take the default. */
const scoreOr = (v, d) => { const n = v == null || v === '' ? NaN : Number(v); return isFinite(n) ? n : d; };
const lessonDone = (p, id) => !!(p.done[id] && p.done[id].at);

/* ---------- Event bus for celebrations ---------- */
const FX = {
  listeners: new Set(),
  held: 0,
  buf: [],
  /* While held, rewards queue up so they never cover a curtain, a grade seal or a live exam. */
  hold(maxMs) {
    this.held += 1;
    let done = false;
    const rel = () => { if (done) return; done = true; this.release(); };
    if (maxMs) setTimeout(rel, maxMs);
    return rel;
  },
  release() {
    if (!this.held) return;
    this.held -= 1;
    if (!this.held) { const b = this.buf; this.buf = []; b.forEach(([t, d]) => this.emit(t, d)); }
  },
  emit(type, data) {
    if (this.held && ['xp', 'quest', 'chest', 'badge', 'levelup'].includes(type)) { this.buf.push([type, data]); return; }
    this.listeners.forEach((l) => { try { l(type, data); } catch (e) { console.error(e); } });
  },
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
};
const toast = (text, kind = '') => FX.emit('toast', { text, kind });

/* ---------- Sound: tiny synthesized cues ---------- */
const Sound = {
  ctx: null,
  enabled: true,
  ensure() {
    try {
      if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; this.ctx = new AC(); }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch (e) { return null; }
  },
  tone(freq, start, dur, type = 'sine', gain = 0.07) {
    const c = this.ensure(); if (!c) return;
    const t0 = c.currentTime + start + 0.01;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  play(name) {
    if (!this.enabled) return;
    try {
      switch (name) {
        case 'xp': this.tone(880, 0, 0.12, 'triangle', 0.05); this.tone(1318.5, 0.07, 0.2, 'triangle', 0.05); break;
        case 'correct': this.tone(659.25, 0, 0.1, 'sine', 0.08); this.tone(987.77, 0.06, 0.18, 'sine', 0.08); break;
        case 'wrong': this.tone(196, 0, 0.2, 'square', 0.025); this.tone(155.6, 0.09, 0.26, 'square', 0.025); break;
        case 'level': [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, i * 0.085, 0.45, 'triangle', 0.06)); break;
        case 'badge': [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => this.tone(f, i * 0.07, 0.5, 'sine', 0.055)); break;
        case 'quest': [698.46, 880, 1046.5].forEach((f, i) => this.tone(f, i * 0.06, 0.3, 'triangle', 0.05)); break;
        case 'tap': this.tone(1400, 0, 0.035, 'sine', 0.025); break;
        case 'reveal': [392, 523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, i * 0.12, 0.6, 'sine', 0.05)); break;
        default: break;
      }
    } catch (e) { /* audio is optional */ }
  },
};

/* ---------- Persistence: claude db (private per viewer) with a browser cache ---------- */
const LS = 'rostra.v1.';
const lsGet = (k) => { try { const v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const lsDel = (k) => { try { localStorage.removeItem(LS + k); } catch (e) { /* ignore */ } };
const SYNC_LIMIT = 250 * 1024; // db documents max out at 256 KiB
const jsonBytes = (o) => { const t = JSON.stringify(o); try { return new TextEncoder().encode(t).length; } catch (e) { return t.length * 2; } };
const cleanJson = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'number' && !isFinite(v) ? null : v)));

const Persist = {
  mode: 'local',
  col: null,
  uid: null,
  inflight: {},
  pending: {},
  timers: {},
  latest: {},
  seq: {},
  warned: false,
  localIds() { return lsGet('index') || []; },
  localLoad() {
    const docs = {};
    for (const id of this.localIds()) { const d = lsGet('doc.' + id); if (d) docs[id] = d; }
    return docs;
  },
  localSave(id, body) {
    if (!lsSet('doc.' + id, body)) return false;
    const ids = this.localIds();
    if (!ids.includes(id)) { ids.push(id); lsSet('index', ids); }
    return true;
  },
  localRemove(id) { lsDel('doc.' + id); lsSet('index', this.localIds().filter((x) => x !== id)); },
  localReplace(docs) {
    for (const id of this.localIds()) lsDel('doc.' + id);
    lsSet('index', []);
    for (const [id, d] of Object.entries(docs)) this.localSave(id, d);
  },
  async connect() {
    if (!window.claude || typeof window.claude.use !== 'function') {
      /* On the web: Supabase through Platform, once someone is signed in. */
      try {
        if (typeof Platform === 'undefined') return false;
        await Platform.init();
        const col = Platform.db();
        if (!col) return false;
        this.uid = Platform.user.id;
        this.col = col;
        return true;
      } catch (e) { return false; }
    }
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return false;
      const id = await user.id();
      if (!id) return false;
      this.uid = id;
      this.col = db.collection('data/users/' + id);
      return true;
    } catch (e) { return false; }
  },
  async remoteLoad() {
    const snap = await this.col.get();
    const docs = {};
    snap.docs.forEach((d) => { if (d.exists) docs[d.id] = d.data(); });
    return docs;
  },
  /* Sync bookkeeping survives reloads, so unsynced work is never overwritten by an older remote copy. */
  flagGet(name) { return lsGet(name) || {}; },
  flagSet(name, id, on) { const d = this.flagGet(name); if (on) d[id] = 1; else delete d[id]; lsSet(name, d); },
  clearFlags() { lsDel('dirty'); lsDel('tombs'); lsDel('localOnly'); },
  save(id, data, debounce = 0) {
    const body = cleanJson(data);
    if (!this.localSave(id, body)) this.warnLocal();
    this.flagSet('dirty', id, true);
    this.seq[id] = (this.seq[id] || 0) + 1;
    clearTimeout(this.timers[id]);
    delete this.timers[id];
    delete this.latest[id];
    if (this.mode !== 'db') return;
    if (debounce) {
      this.latest[id] = body;
      this.timers[id] = setTimeout(() => { delete this.timers[id]; delete this.latest[id]; this.write(id, body); }, debounce);
    } else this.write(id, body);
  },
  /* Send debounced writes right away: the tab may be closing. */
  flush() {
    for (const id of Object.keys(this.latest)) {
      const body = this.latest[id];
      clearTimeout(this.timers[id]);
      delete this.timers[id];
      delete this.latest[id];
      this.write(id, body);
    }
  },
  async write(id, body, attempt = 0) {
    if (this.inflight[id]) { this.pending[id] = body; return; }
    if (jsonBytes(body) > SYNC_LIMIT) {
      if (!this.flagGet('localOnly')[id]) {
        this.flagSet('localOnly', id, true);
        toast('This item is too large to sync to your account, so it stays in this browser.', 'warn');
      }
      this.flagSet('dirty', id, false);
      return;
    }
    const seq = this.seq[id];
    this.inflight[id] = true;
    try {
      await this.col.doc(id).set(body);
      if (seq === this.seq[id]) this.flagSet('dirty', id, false);
      if (this.flagGet('localOnly')[id]) this.flagSet('localOnly', id, false);
    } catch (e) {
      const code = e && e.code;
      if ((code === 'unavailable' || code === 'resource_exhausted') && attempt === 0) {
        setTimeout(() => { if (seq === this.seq[id]) this.write(id, body, 1); }, 300 + Math.random() * 700);
      } else this.fail(e);
    } finally {
      this.inflight[id] = false;
      const next = this.pending[id];
      if (next) { delete this.pending[id]; this.write(id, next); }
    }
  },
  async remove(id) {
    clearTimeout(this.timers[id]);
    delete this.timers[id];
    delete this.latest[id];
    delete this.pending[id];
    this.seq[id] = (this.seq[id] || 0) + 1;
    this.localRemove(id);
    this.flagSet('dirty', id, false);
    this.flagSet('localOnly', id, false);
    this.flagSet('tombs', id, true);
    if (this.mode !== 'db') return;
    try { await this.col.doc(id).delete(); this.flagSet('tombs', id, false); } catch (e) { this.fail(e); }
  },
  warnLocal() {
    if (this.warned || this.mode === 'db') return;
    this.warned = true;
    toast('Browser storage is full or blocked, so your latest work may not survive a reload.', 'bad');
    Store.set({ storageOk: false });
  },
  fail(e) {
    const code = e && e.code;
    if (code === 'quota_exceeded') { toast('Your Rostra storage is full. Delete a few old speeches to keep saving.', 'bad'); return; }
    if (code === 'unavailable' || code === 'resource_exhausted') return; // stays dirty; the next boot uploads it
    if (this.mode === 'db') {
      this.mode = 'local';
      Store.set({ backend: 'local' });
      toast('Account sync is off in this view, so progress is saved in this browser.', 'warn');
    }
  },
};

/* ---------- Profile model ---------- */
function defaultProfile() {
  return {
    type: 'profile', v: 1, name: '', goal: '', onboarded: false, created: Date.now(), xp: 0,
    streak: { count: 0, best: 0, last: null, days: [] },
    skills: { ethos: null, pathos: null, logos: null }, subs: {}, trail: [],
    badges: {}, quests: { day: null, picks: [], progress: {}, claimed: {}, chest: false },
    stats: { speeches: 0, minutes: 0, lessons: 0, drills: 0, fallacies: 0, devices: 0, bestCombo: 0, preps: 0, read: [], games: 0, best: {}, comeback: false, vivas: 0, vivaBest: 0, vivaQuestions: 0, impromptus: 0, breaths: 0, twisters: 0, posters: 0 },
    lessons: [], done: {}, settings: { sound: true },
  };
}
function mergeDeep(base, extra) {
  if (!extra || typeof extra !== 'object') return base;
  const out = Array.isArray(base) ? extra : { ...base };
  if (Array.isArray(base)) return Array.isArray(extra) ? extra : base;
  for (const [k, v] of Object.entries(extra)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) out[k] = mergeDeep(base[k], v);
    else out[k] = v;
  }
  return out;
}
const migrateProfile = (p) => mergeDeep(defaultProfile(), p || {});

function levelInfo(xp) {
  let level = 1;
  const thresholds = LEVEL_XP.slice();
  while (thresholds.length < 61) thresholds.push(thresholds[thresholds.length - 1] + 900);
  for (let i = 0; i < 60; i++) if (xp >= thresholds[i]) level = i + 1;
  const cur = thresholds[level - 1], next = thresholds[level];
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] + (level > LEVEL_TITLES.length ? ' ' + toRoman(level - LEVEL_TITLES.length + 1) : '');
  const greek = LEVEL_GREEK[Math.min(level - 1, LEVEL_GREEK.length - 1)];
  return { level, title, greek, cur, next, into: xp - cur, need: next - cur, progress: Math.min(1, (xp - cur) / (next - cur)), max: level === 60 && xp >= next };
}
function toRoman(n) { const m = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; }

function tierOf(score) {
  if (score == null) return { name: 'Unranked', color: 'var(--line-2)' };
  if (score >= 80) return { name: 'Laurel', color: 'var(--logos)' };
  if (score >= 65) return { name: 'Gold', color: 'var(--gold)' };
  if (score >= 50) return { name: 'Silver', color: 'var(--silver)' };
  return { name: 'Bronze', color: 'var(--bronze)' };
}

function archetypeOf(sc) {
  const vals = POLE_KEYS.map((k) => sc && sc[k]);
  if (vals.some((v) => v == null)) return ARCHETYPES.blank;
  if (mean(vals) < 45) return ARCHETYPES.emerging;
  const sum = vals.reduce((a, b) => a + b, 0) || 1;
  const norm = vals.map((v) => v / sum);
  if (Math.max(...norm) - Math.min(...norm) < 0.06) return ARCHETYPES.orator;
  const sorted = POLE_KEYS.map((k, i) => [k, norm[i]]).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] - sorted[1][1] > 0.045) return ARCHETYPES[sorted[0][0]];
  const pair = [sorted[0][0], sorted[1][0]].sort((a, b) => POLE_KEYS.indexOf(a) - POLE_KEYS.indexOf(b)).join('_');
  return ARCHETYPES[pair] || ARCHETYPES.orator;
}

/* Rebuild skills from the speeches themselves, so a deletion or a coach re-read can't leave them stale. */
function foldSkills(speeches) {
  const skills = { ethos: null, pathos: null, logos: null }, subs = {};
  const blend = (old, v) => (old == null ? v : Math.round(old * 0.55 + v * 0.45));
  speeches.filter((s) => !s.dup && s.scores).sort((a, b) => a.date - b.date).forEach((sp) => {
    POLE_KEYS.forEach((k) => { if (sp.scores[k] != null) skills[k] = blend(skills[k], sp.scores[k]); });
    const source = (sp.ai && sp.ai.subscores) || (sp.heur && sp.heur.subscores);
    if (source) POLE_KEYS.forEach((k) => {
      subs[k] = subs[k] || {};
      Object.entries(source[k] || {}).forEach(([sk, v]) => { subs[k][sk] = blend(subs[k][sk], v); });
    });
  });
  return { skills, subs };
}
function weakestPole(sc) {
  const known = POLE_KEYS.filter((k) => sc && sc[k] != null);
  if (!known.length) return null;
  return known.sort((a, b) => sc[a] - sc[b])[0];
}
function strongestPole(sc) {
  const known = POLE_KEYS.filter((k) => sc && sc[k] != null);
  if (!known.length) return null;
  return known.sort((a, b) => sc[b] - sc[a])[0];
}

/* ---------- Quests & streak ---------- */
function pickQuests(day, p) {
  const rnd = seeded(hashStr(day));
  const impossible = (q) => {
    if (!p) return false;
    if (q === 'read') return (p.stats.read || []).length >= LIBRARY.length;
    if (q === 'lesson' || q === 'drill') return LESSONS.every((l) => lessonDone(p, l.id)) && (p.lessons || []).every((l) => lessonDone(p, l.id));
    if (q === 'revise') return !(p.stats.vivas > 0);
    return false;
  };
  const picks = [];
  for (const pool of QUEST_POOLS) {
    const options = pool.filter((q) => !picks.includes(q) && !impossible(q));
    picks.push(options[Math.floor(rnd() * options.length)]);
  }
  return picks;
}
function ensureQuests(p) {
  const today = dayKey();
  if (p.quests.day !== today) p.quests = { day: today, picks: pickQuests(today, p), progress: {}, claimed: {}, chest: false };
}
/* A surprise, not a fixed payout: the same day always rolls the same chest. */
function chestRoll(p) {
  const r = seeded(hashStr(dayKey() + ':' + (p.created || 0)))();
  return r < 0.5 ? 60 : r < 0.8 ? 100 : r < 0.95 ? 150 : 250;
}
function touchStreak(p) {
  const today = dayKey();
  const s = p.streak;
  if (s.last === today) return false;
  const gap = s.last ? dayDiff(s.last, today) : null;
  if (gap === 1) s.count += 1;
  else if (gap === 2 && s.freezes > 0) { s.freezes -= 1; s.count += 1; s.frozeOn = today; } // one missed day, covered
  else s.count = 1;
  if (s.count > 0 && s.count % 7 === 0) s.freezes = Math.min(2, (s.freezes || 0) + 1);
  s.last = today;
  s.days = [...(s.days || []).filter((d) => dayDiff(d, today) < 60), today];
  s.best = Math.max(s.best || 0, s.count);
  return true;
}
function liveStreak(p) {
  const s = p.streak;
  if (!s.last) return 0;
  const gap = dayDiff(s.last, dayKey());
  return gap <= 1 || (gap === 2 && s.freezes > 0) ? s.count : 0;
}

/* ---------- Badges ---------- */
const BADGE_RULES = {
  first_words: (p) => p.stats.speeches >= 1,
  kindling: (p) => (p.streak.best || 0) >= 3,
  eternal_flame: (p) => (p.streak.best || 0) >= 7,
  fortnight: (p) => (p.streak.best || 0) >= 14,
  perennial: (p) => (p.streak.best || 0) >= 30,
  scholar: (p) => p.stats.lessons >= 5,
  historian: (p) => (p.stats.read || []).length >= 5,
  fallacy_hunter: (p) => p.stats.fallacies >= 25,
  wordsmith: (p) => p.stats.devices >= 25,
  unbroken: (p) => p.stats.bestCombo >= 10,
  speechwright: (p) => p.stats.preps >= 1,
  comeback: (p) => !!p.stats.comeback,
  pillar: (p, s) => s.some((x) => (x.scores?.ethos ?? 0) >= 80),
  silver_tongue: (p, s) => s.some((x) => (x.scores?.pathos ?? 0) >= 80),
  iron_logic: (p, s) => s.some((x) => (x.scores?.logos ?? 0) >= 80 && x.ai && !(x.ai.highlights || []).some((h) => h.kind === 'fallacy')),
  triple: (p, s) => s.some((x) => POLE_KEYS.every((k) => (x.scores?.[k] ?? 0) >= 70)),
  clean_air: (p, s) => s.some((x) => x.delivery && x.delivery.fillersPerMin != null && x.delivery.fillersPerMin < 1 && (x.durationSec || 0) >= 60),
  viva_first: (p) => (p.stats.vivas || 0) >= 1,
  distinction: (p) => (p.stats.vivaBest || 0) >= 85,
  improviser: (p) => (p.stats.impromptus || 0) >= 5,
  zen: (p) => (p.stats.breaths || 0) >= 10,
  pause_master: (p, s) => s.some((x) => x.metrics && x.metrics.source === 'audio' && x.metrics.pauses.deliberate >= 5 && x.metrics.pauses.long === 0),
};

/* ---------- Store ---------- */
const Store = {
  state: { ready: false, profile: defaultProfile(), speeches: [], preps: [], vivas: [], backend: 'local', ai: 'checking', aiLocked: false, user: null },
  listeners: new Set(),
  set(patch) { this.state = { ...this.state, ...patch }; this.listeners.forEach((l) => l(this.state)); },
  hydrate(docs, backend) {
    const profile = migrateProfile(docs.profile);
    ensureQuests(profile);
    const all = Object.values(docs).filter(Boolean);
    const speeches = all.filter((d) => d.type === 'speech').sort((a, b) => b.date - a.date);
    const preps = all.filter((d) => d.type === 'prep').sort((a, b) => b.updated - a.updated);
    const vivas = all.filter((d) => d.type === 'viva').sort((a, b) => (b.updated || 0) - (a.updated || 0));
    Sound.enabled = profile.settings.sound !== false;
    this.set({ ready: true, profile, speeches, preps, vivas, backend });
  },
  saveProfile(p) { Persist.save('profile', p, 500); },
  /* The one way to change the profile. fn(p, ctx) mutates a copy. */
  act(fn) {
    const p = clone(this.state.profile);
    ensureQuests(p);
    const events = [];
    const startLevel = levelInfo(p.xp).level;
    const ctx = {
      xp: (amount, reason) => { if (!amount) return; p.xp += amount; touchStreak(p); events.push(['xp', { amount, reason }]); },
      quest: (key, qty = 1) => {
        if (!p.quests.picks.includes(key) || p.quests.claimed[key]) return;
        const q = QUESTS[key];
        p.quests.progress[key] = Math.min(q.target, (p.quests.progress[key] || 0) + qty);
        if (p.quests.progress[key] >= q.target) {
          p.quests.claimed[key] = true;
          p.xp += q.xp; touchStreak(p);
          events.push(['quest', { label: q.label, xp: q.xp }]);
          if (!p.quests.chest && p.quests.picks.every((k) => p.quests.claimed[k])) {
            const roll = chestRoll(p);
            p.quests.chest = roll; p.xp += roll;
            events.push(['chest', { xp: roll }]);
          }
        }
      },
    };
    fn(p, ctx);
    const speeches = this.state.speeches;
    for (const b of BADGES) {
      if (p.badges[b.id]) continue;
      const rule = BADGE_RULES[b.id];
      if (rule && rule(p, speeches)) { p.badges[b.id] = Date.now(); p.xp += BADGE_XP; events.push(['badge', b]); }
    }
    const endLevel = levelInfo(p.xp).level;
    if (endLevel > startLevel) events.push(['levelup', { level: endLevel, info: levelInfo(p.xp) }]);
    this.set({ profile: p });
    this.saveProfile(p);
    events.forEach(([t, d]) => FX.emit(t, d));
    return p;
  },
  addSpeech(sp) {
    const prev = this.state.speeches.find((x) => !x.dup);
    /* A speech done for a teacher's assignment: tag it and tell the teacher's table. */
    const pa = typeof Platform !== 'undefined' ? Platform.pendingAssignment : null;
    if (pa && pa.id && !sp.sample) { sp.assignmentId = pa.id; sp.assignmentTitle = pa.title; Platform.pendingAssignment = null; }
    this.set({ speeches: [sp, ...this.state.speeches] });
    Persist.save(sp.id, sp);
    if (sp.assignmentId && typeof Platform !== 'undefined' && Platform.recordSubmission) {
      const vals = POLE_KEYS.map((k) => sp.scores && sp.scores[k]).filter((v) => v != null);
      Platform.recordSubmission(sp.assignmentId, sp.id, { kind: 'speech', title: sp.title, percent: vals.length ? Math.round(mean(vals)) : null, scores: sp.scores, words: sp.words, finished: sp.date });
    }
    if (sp.dup) { toast('You already analyzed this exact speech, so it earns no XP. Change it and try again.', 'warn'); return; }
    this.act((p, ctx) => {
      const sc = sp.scores;
      const fold = foldSkills(this.state.speeches);
      p.skills = fold.skills;
      p.subs = fold.subs;
      p.trail = [...p.trail, { id: sp.id, t: sp.date, e: sc.ethos, p: sc.pathos, l: sc.logos }].slice(-40);
      p.stats.speeches += 1;
      p.stats.minutes = Math.round((p.stats.minutes + (sp.durationSec || 0) / 60) * 10) / 10;
      if (prev && prev.scores) {
        for (const k of POLE_KEYS) if (sc[k] != null && prev.scores[k] != null && sc[k] - prev.scores[k] >= 15) p.stats.comeback = true;
      }
      const newLessons = (sp.ai && sp.ai.lessons ? sp.ai.lessons : []).map((l, i) => ({ ...l, id: sp.id + '_l' + i, from: sp.id, fromTitle: sp.title, created: Date.now() }));
      p.lessons = [...newLessons, ...p.lessons].slice(0, 30);
      ctx.xp(sp.xp, 'Speech analyzed');
      ctx.quest('analyze');
    });
  },
  updateSpeech(sp) {
    this.set({ speeches: this.state.speeches.map((s) => (s.id === sp.id ? sp : s)) });
    Persist.save(sp.id, sp);
  },
  deleteSpeech(id) {
    this.set({ speeches: this.state.speeches.filter((s) => s.id !== id) });
    Persist.remove(id);
    this.act((p) => {
      p.trail = p.trail.filter((t) => t.id !== id);
      p.lessons = p.lessons.filter((l) => l.from !== id);
      const fold = foldSkills(this.state.speeches);
      p.skills = fold.skills;
      p.subs = fold.subs;
    });
  },
  savePrep(prep) {
    const next = { ...prep, type: 'prep', updated: Date.now() };
    const others = this.state.preps.filter((x) => x.id !== prep.id);
    this.set({ preps: [next, ...others] });
    Persist.save(prep.id, next, 700);
    return next;
  },
  deletePrep(id) { this.set({ preps: this.state.preps.filter((x) => x.id !== id) }); Persist.remove(id); },
  /* Oral exams ("vivas"): one document per exam, type 'viva'. Returns the saved copy. */
  saveViva(viva, debounce = 600) {
    const next = { ...viva, type: 'viva', updated: Date.now() };
    const others = this.state.vivas.filter((x) => x.id !== viva.id);
    this.set({ vivas: [next, ...others] });
    Persist.save(viva.id, next, debounce);
    return next;
  },
  deleteViva(id) { this.set({ vivas: this.state.vivas.filter((x) => x.id !== id) }); Persist.remove(id); },
  /* After a sign-in: reconnect, merge this browser's work with the account, re-check the coach. */
  async reboot() {
    Persist.mode = 'local'; Persist.col = null; Persist.uid = null; Persist.warned = false;
    this.set({ backend: 'local' });
    await bootStore();
    if (typeof AI !== 'undefined') await AI.refresh();
  },
  /* After a sign-out on a shared classroom laptop: nothing of this person stays in the browser. */
  signOutLocal() {
    Persist.clearFlags();
    Persist.localReplace({});
    lsDel('owner');
    Persist.mode = 'local'; Persist.col = null; Persist.uid = null;
    const profile = defaultProfile();
    ensureQuests(profile);
    this.set({ ready: true, profile, speeches: [], preps: [], vivas: [], backend: 'local' });
    if (typeof AI !== 'undefined') AI.refresh();
  },
  async resetAll() {
    const ids = ['profile', ...this.state.speeches.map((s) => s.id), ...this.state.preps.map((p) => p.id), ...this.state.vivas.map((v) => v.id)];
    for (const id of ids) await Persist.remove(id);
    const profile = defaultProfile();
    ensureQuests(profile);
    this.set({ profile, speeches: [], preps: [], vivas: [] });
    Persist.save('profile', profile);
  },
};

async function bootStore() {
  Store.hydrate(Persist.localLoad(), 'local');
  try {
    window.addEventListener('pagehide', () => Persist.flush());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Persist.flush(); });
  } catch (e) { /* no page lifecycle here */ }
  const ok = await Persist.connect();
  if (!ok) return;
  try {
    const remote = await Persist.remoteLoad();
    const owner = lsGet('owner');
    if (owner && owner !== Persist.uid) {
      // Another account used this browser: its cache and unsynced edits are not this viewer's.
      Persist.clearFlags();
      Persist.localReplace(remote);
      Persist.mode = 'db';
      Store.hydrate(remote, 'db');
    } else {
      const cached = Persist.localLoad(); // read now: includes anything done since first paint
      const dirty = Persist.flagGet('dirty'), tombs = Persist.flagGet('tombs'), localOnly = Persist.flagGet('localOnly');
      const remoteEmpty = !Object.keys(remote).length;
      const merged = { ...remote };
      Object.keys(tombs).forEach((id) => { delete merged[id]; });
      const upload = [];
      Object.entries(cached).forEach(([id, d]) => {
        if (tombs[id]) return;
        if (localOnly[id]) { merged[id] = d; return; }
        if (dirty[id] || remoteEmpty) { merged[id] = d; upload.push(id); }
      });
      Persist.localReplace(merged);
      Persist.mode = 'db';
      Store.hydrate(merged, 'db');
      upload.forEach((id) => { Persist.flagSet('dirty', id, true); Persist.write(id, merged[id]); });
      Object.keys(tombs).forEach((id) => { Persist.remove(id); });
    }
    lsSet('owner', Persist.uid);
  } catch (e) {
    Persist.mode = 'local';
    Store.set({ backend: 'local' });
  }
}

/* ---------- AI (the viewer's own Claude, via the sample capability) ---------- */
const AI = {
  fn: null, images: false, imageMax: 0, initPromise: null,
  init() {
    this.initPromise = (async () => {
      if (!window.claude || typeof window.claude.use !== 'function') {
        /* On the web the coach lives behind /api/ai. 'locked' means the server has AI but wants a sign-in first. */
        if (typeof Platform === 'undefined') { Store.set({ ai: 'off' }); return; }
        try {
          await Platform.init();
          const state = Platform.aiState();
          this.fn = state === 'ready' ? Platform.sampleShim() : null;
          this.images = false;
          Store.set({ ai: state === 'ready' ? 'ready' : 'off', aiLocked: state === 'locked', backend: Platform.signedIn ? 'db' : Store.state.backend });
        } catch (e) { Store.set({ ai: 'off' }); }
        return;
      }
      try {
        const s = await window.claude.use('sample');
        if (!s) { Store.set({ ai: 'off' }); return; }
        this.fn = s;
        try { const lim = await s.limits(); this.images = !!(lim && lim.images); this.imageMax = (lim && lim.images && lim.images.maxCount) || 0; } catch (e) { this.images = false; }
        Store.set({ ai: 'ready' });
      } catch (e) { Store.set({ ai: 'off' }); }
    })();
    return this.initPromise;
  },
  get ready() { return Store.state.ai === 'ready'; },
  get on() { return Store.state.ai !== 'off'; },
  async json(prompt, opts = {}) {
    if (this.initPromise) await this.initPromise;
    if (!this.fn) throw { code: 'unavailable', message: 'AI unavailable' };
    try { return await this.fn.json(prompt, opts); } catch (e) { this.handle(e); throw e; }
  },
  async text(input, opts = {}) {
    if (this.initPromise) await this.initPromise;
    if (!this.fn) throw { code: 'unavailable', message: 'AI unavailable' };
    try { return await this.fn(input, opts); } catch (e) { this.handle(e); throw e; }
  },
  handle(e) {
    const c = e && e.code;
    if (c === 'not_granted' && typeof Platform !== 'undefined' && Platform.accountsRequired) { Store.set({ ai: 'off', aiLocked: true }); return; }
    if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(c)) Store.set({ ai: 'off' });
  },
  /* Re-check after a sign-in or sign-out. */
  refresh() { return this.init(); },
};
function aiErrorText(e) {
  const c = e && e.code;
  switch (c) {
    case 'not_granted': return typeof Platform !== 'undefined' && Platform.accountsRequired ? 'Sign in to use the coach.' : 'The AI coach isn’t enabled for this page.';
    case 'sampling_disabled': case 'not_declared': case 'capability_disabled': case 'capability_removed': case 'unavailable':
      return 'The AI coach isn’t available on this server right now.';
    case 'rate_limited': return 'You’ve reached today’s limit for the coach. It resets tomorrow.';
    case 'timeout': return 'The coach took too long to answer. Try again.';
    case 'network': return 'The coach couldn’t be reached. Check your connection and try again.';
    case 'server_misconfigured': return 'The AI key on the server isn’t valid. Tell your teacher or the Rostra team.';
    case 'session_expired': return 'Your session expired. Sign in to Claude again, then retry.';
    case 'prompt_too_large': return 'That text is too long for one pass. Trim it to the part you most want coached.';
    case 'refused': return 'The coach couldn’t work with this text. Try different content.';
    case 'invalid_json': return 'The coach’s reply came back incomplete. Try again.';
    case 'image_rejected': case 'images_unavailable': return 'Video frames couldn’t be sent, so presence wasn’t scored.';
    case 'cancelled': return 'Stopped.';
    default: return 'The coach couldn’t be reached. Check your connection and try again.';
  }
}

/* ---------- Transcript handling ---------- */
function parseTs(s) {
  const parts = s.trim().replace(',', '.').split(':').map(Number);
  if (parts.some((n) => isNaN(n))) return null;
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts.length === 2 ? parts[0] * 60 + parts[1] : null;
}
function parseCaptions(raw) {
  const blocks = raw.replace(/\r/g, '').split(/\n{2,}/);
  const cues = [];
  for (const b of blocks) {
    const lines = b.split('\n').filter((l) => l.trim());
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, z] = lines[i].split('-->');
    const start = parseTs(a), end = parseTs((z || '').trim().split(/\s+/)[0] || '');
    let text = lines.slice(i + 1).join(' ').replace(/<[^>]+>/g, '').replace(/^\s*-\s*/, '').trim();
    text = text.replace(/^([A-Z][\w'.-]*\s?){1,4}:\s+/, '');
    if (!text || start == null || end == null) continue;
    const prev = cues[cues.length - 1];
    if (prev && prev.text === text) { prev.end = end; continue; }
    cues.push({ start, end, text });
  }
  return cues;
}
function readTranscriptFile(name, text) {
  const lower = (name || '').toLowerCase();
  const trimmed = text.trim();
  if (lower.endsWith('.vtt') || lower.endsWith('.srt') || /^WEBVTT/.test(trimmed) || /^\d+\s*\n\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(trimmed.replace(/\r/g, ''))) {
    const cues = parseCaptions(text);
    return { text: paragraphize(cues.map((c) => c.text).join(' ')), cues: cues.length > 2 ? cues : null };
  }
  return { text: trimmed, cues: null };
}
function paragraphize(text) {
  const t = (text || '').replace(/[ \t]+/g, ' ').trim();
  if (!t || /\n/.test(t) || t.length < 700) return t;
  const sentences = t.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) || [t];
  const paras = [];
  let cur = '';
  sentences.forEach((s, i) => { cur += s; if ((i + 1) % 4 === 0) { paras.push(cur.trim()); cur = ''; } });
  if (cur.trim()) paras.push(cur.trim());
  return paras.join('\n\n');
}
function prepareTranscript(t) { return paragraphize((t || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()).slice(0, 120000); }

/* Normalized text search so Claude's quotes can be highlighted in the original */
function normMap(s) {
  const map = []; let out = ''; let space = false;
  for (let i = 0; i < s.length; i++) {
    let c = s[i];
    if (/\s/.test(c)) { if (space) continue; c = ' '; space = true; } else space = false;
    c = c.toLowerCase().replace(/[‘’`´]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, '-');
    out += c; map.push(i);
  }
  return { out, map };
}
function locate(norm, quote) {
  if (!quote) return null;
  let q = normMap(String(quote).trim()).out.replace(/^["'.…\s]+|["'…\s]+$/g, '').replace(/\.\.\.$/, '').trim();
  if (q.length < 3) return null;
  let i = norm.out.indexOf(q);
  if (i < 0) { const q2 = q.replace(/[.,;:!?"]+$/, ''); i = norm.out.indexOf(q2); if (i >= 0) q = q2; }
  if (i < 0) {
    const w = q.split(' ');
    if (w.length > 6) {
      const head = w.slice(0, 6).join(' ');
      i = norm.out.indexOf(head);
      if (i >= 0) q = norm.out.slice(i, Math.min(norm.out.length, i + q.length));
    }
  }
  if (i < 0) return null;
  const endIdx = Math.min(norm.map.length - 1, i + q.length - 1);
  return { start: norm.map[i], end: norm.map[endIdx] + 1 };
}
const KIND_PRIORITY = { fallacy: 9, inconsistency: 8, vague: 7, weak: 6, device: 5, strength: 4, ethos: 4, pathos: 4, logos: 4, filler: 2 };
function placeMarks(text, items) {
  const norm = normMap(text);
  const placed = [];
  const order = items.map((it, idx) => ({ it, idx })).sort((a, b) => (KIND_PRIORITY[b.it.kind] || 0) - (KIND_PRIORITY[a.it.kind] || 0));
  for (const { it, idx } of order) {
    const pos = it.start != null ? { start: it.start, end: it.end } : locate(norm, it.quote);
    if (!pos || pos.end <= pos.start) continue;
    if (placed.some((p) => pos.start < p.end && pos.end > p.start)) continue;
    placed.push({ ...pos, idx, kind: it.kind });
  }
  return placed.sort((a, b) => a.start - b.start);
}
function segmentText(text, marks) {
  const out = []; let pos = 0;
  for (const m of marks) {
    if (m.start > pos) out.push({ text: text.slice(pos, m.start) });
    out.push({ text: text.slice(m.start, m.end), mark: m });
    pos = m.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}

/* Filler words */
const FILLER_RES = [
  [/\b(um+|uh+|uhm|erm|er|ah)\b/gi, 'hesitation'],
  [/\byou know\b(?!\s+(what|how|why|that|who|where|when|if)\b)/gi, '“you know”'],
  [/\bi mean\b/gi, '“I mean”'],
  [/\b(basically|literally|honestly)\b/gi, 'qualifier'],
  [/\b(kind of|sort of)\b/gi, 'hedge'],
  [/(?:,\s*|^|\.\s+)(like),/gi, '“like”'],
];
function findFillers(text) {
  const out = [];
  for (const [re, label] of FILLER_RES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const word = m[1] && label === '“like”' ? m[1] : m[0];
      const start = label === '“like”' ? m.index + m[0].indexOf(word) : m.index;
      out.push({ start, end: start + word.length, word: word.toLowerCase(), label });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/* ---------- Audio analysis (runs entirely in the browser) ---------- */
async function decodeAudio(file) {
  const buf = await file.arrayBuffer();
  const tryCtx = (rate) => {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) throw new Error('no-offline');
    const ctx = new OAC(1, rate, rate);
    return new Promise((res, rej) => {
      const p = ctx.decodeAudioData(buf.slice(0), res, rej);
      if (p && typeof p.then === 'function') p.then(res, rej);
    });
  };
  try { return await tryCtx(16000); } catch (e) { /* fall through */ }
  try { return await tryCtx(44100); } catch (e) { /* fall through */ }
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  try {
    return await new Promise((res, rej) => { const p = ctx.decodeAudioData(buf.slice(0), res, rej); if (p && p.then) p.then(res, rej); });
  } finally { try { ctx.close(); } catch (e) { /* ignore */ } }
}
function fillShortRuns(arr, value, maxLen, interiorOnly) {
  let i = 0;
  while (i < arr.length) {
    if (arr[i] !== value) { i++; continue; }
    let j = i; while (j < arr.length && arr[j] === value) j++;
    const interior = i > 0 && j < arr.length;
    if (j - i < maxLen && (!interiorOnly || interior)) for (let k = i; k < j; k++) arr[k] = value ? 0 : 1;
    i = j;
  }
}
function summarizePauses(list) {
  const short = list.filter((p) => p.d < 0.7).length;
  const deliberate = list.filter((p) => p.d >= 0.7 && p.d <= 2).length;
  const long = list.filter((p) => p.d > 2).length;
  const longest = list.reduce((m, p) => (!m || p.d > m.d ? p : m), null);
  return { count: list.length, short, deliberate, long, longest: longest ? { t: +longest.t.toFixed(1), d: +longest.d.toFixed(2) } : null, list: list.slice(0, 160).map((p) => ({ t: +p.t.toFixed(2), d: +p.d.toFixed(2) })) };
}
async function analyzeAudio(file, onProgress = () => {}, signal) {
  onProgress(0.03, 'decode');
  let audio;
  try { audio = await decodeAudio(file); }
  catch (e) { throw { code: 'decode', message: 'This file’s audio couldn’t be decoded here. Try exporting it as MP3, M4A or WAV.' }; }
  const sr0 = audio.sampleRate, chs = audio.numberOfChannels;
  const factor = Math.max(1, Math.round(sr0 / 8000));
  const sr = sr0 / factor;
  const n = Math.floor(audio.length / factor);
  const x = new Float32Array(n);
  for (let c = 0; c < chs; c++) {
    const d = audio.getChannelData(c);
    for (let i = 0, j = 0; i < n; i++) { let s = 0; for (let k = 0; k < factor; k++) s += d[j++]; x[i] += s / (factor * chs); }
  }
  const duration = n / sr;
  if (duration < 8) throw { code: 'short', message: 'That recording is under 8 seconds. Upload at least 20 seconds of speech.' };
  onProgress(0.12, 'energy');
  await tick();

  const hop = Math.round(sr * 0.01), win = Math.round(sr * 0.03);
  const nf = Math.max(1, Math.floor((n - win) / hop));
  const db = new Float32Array(nf);
  for (let f = 0; f < nf; f++) {
    const o = f * hop; let s = 0, prev = x[o];
    for (let i = 1; i < win; i++) { const v = x[o + i] - 0.95 * prev; prev = x[o + i]; s += v * v; }
    db[f] = 10 * Math.log10(s / win + 1e-12);
  }
  const floor = percentile(db, 0.08), peak = percentile(db, 0.97);
  const span = Math.max(peak - floor, 12);
  const thr = floor + Math.max(6, span * 0.28);
  const voiced = new Uint8Array(nf);
  for (let f = 0; f < nf; f++) voiced[f] = db[f] > thr ? 1 : 0;
  fillShortRuns(voiced, 0, 16, true);
  fillShortRuns(voiced, 1, 6, false);
  const first = voiced.indexOf(1), last = voiced.lastIndexOf(1);
  if (first < 0 || last - first < 300) throw { code: 'silent', message: 'We couldn’t hear enough speech in this recording. Check that the voice is audible.' };

  const pausesRaw = [];
  let run = 0;
  for (let f = first; f <= last; f++) {
    if (!voiced[f]) run++;
    else { if (run) { const d = (run * hop) / sr; if (d >= 0.3) pausesRaw.push({ t: ((f - run) * hop) / sr, d }); } run = 0; }
  }
  let voicedCount = 0; for (let f = first; f <= last; f++) voicedCount += voiced[f];
  const speakingSec = (voicedCount * hop) / sr;
  const spanSec = ((last - first) * hop) / sr;

  // syllable nuclei: peaks in the smoothed energy envelope
  const env = new Float32Array(nf);
  for (let f = 0; f < nf; f++) { let s = 0, c = 0; for (let k = -2; k <= 2; k++) { const g = f + k; if (g >= 0 && g < nf) { s += db[g]; c++; } } env[f] = s / c; }
  const syll = [];
  for (let f = first + 7; f <= last - 7; f++) {
    if (!voiced[f] || env[f] < thr + 2) continue;
    let isMax = true;
    for (let k = -7; k <= 7; k++) if (env[f + k] > env[f]) { isMax = false; break; }
    if (!isMax) continue;
    let minL = Infinity, minR = Infinity;
    for (let k = 1; k <= 15; k++) { if (f - k >= 0) minL = Math.min(minL, env[f - k]); if (f + k < nf) minR = Math.min(minR, env[f + k]); }
    if (env[f] - minL >= 1.5 && env[f] - minR >= 1.5 && (!syll.length || f - syll[syll.length - 1] >= 9)) syll.push(f);
  }
  const wpmEst = Math.round(syll.length / 1.45 / (spanSec / 60));
  onProgress(0.35, 'pitch');
  await tick();

  // pitch: normalized autocorrelation every 30 ms on voiced frames
  const pw = Math.round(sr * 0.04);
  const minLag = Math.floor(sr / 400), maxLag = Math.ceil(sr / 70);
  const pitch = [];
  const r = new Float32Array(maxLag + 2);
  let lastYield = performance.now();
  for (let f = first; f <= last; f += 3) {
    if (!voiced[f] || db[f] < thr + 3) continue;
    const o = f * hop;
    if (o + pw + maxLag + 1 >= n) break;
    let e0 = 0; for (let i = 0; i < pw; i++) e0 += x[o + i] * x[o + i];
    if (e0 <= 1e-9) continue;
    let best = 0, bestLag = 0;
    for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
      let s = 0, e1 = 0;
      for (let i = 0; i < pw; i++) { const b = x[o + i + lag]; s += x[o + i] * b; e1 += b * b; }
      const v = s / Math.sqrt(e0 * e1 + 1e-12);
      r[lag] = v;
      if (lag >= minLag && lag <= maxLag && v > best) { best = v; bestLag = lag; }
    }
    if (best < 0.55) continue;
    for (let lag = minLag; lag < bestLag; lag++) if (r[lag] >= 0.9 * best && r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1]) { bestLag = lag; break; }
    const a = r[bestLag - 1], b = r[bestLag], c = r[bestLag + 1];
    const den = a - 2 * b + c;
    const shift = den ? clamp((0.5 * (a - c)) / den, -0.5, 0.5) : 0;
    const f0 = sr / (bestLag + shift);
    if (f0 >= 70 && f0 <= 420) pitch.push({ t: (f * hop) / sr, f0 });
    if (performance.now() - lastYield > 40) {
      if (signal && signal.aborted) throw { code: 'cancelled' };
      onProgress(0.35 + (0.55 * (f - first)) / (last - first + 1), 'pitch');
      await tick();
      lastYield = performance.now();
    }
  }
  let pitchStats = null;
  if (pitch.length >= 30) {
    const med = percentile(pitch.map((p) => p.f0), 0.5);
    const st = pitch.map((p) => 12 * Math.log2(p.f0 / med)).filter((s) => Math.abs(s) < 12);
    pitchStats = { median: Math.round(med), std: +std(st).toFixed(2), range: +(percentile(st, 0.9) - percentile(st, 0.1)).toFixed(1), points: pitch.length };
  }
  // loudness dynamics: mean level per half-second window of voiced speech
  const winF = 50, levels = [];
  for (let f = first; f + winF <= last; f += winF) {
    const vals = []; for (let k = f; k < f + winF; k++) if (voiced[k]) vals.push(db[k]);
    if (vals.length > winF * 0.4) levels.push(mean(vals));
  }
  const loudness = levels.length > 6 ? { std: +std(levels).toFixed(2), range: +(percentile(levels, 0.9) - percentile(levels, 0.1)).toFixed(1) } : null;

  // timeline: 40 bins of loudness, pitch and pace
  const B = 40, timeline = [];
  const med = pitchStats ? pitchStats.median : null;
  const lvMin = percentile(levels.length ? levels : [floor], 0.05), lvMax = percentile(levels.length ? levels : [peak], 0.98);
  for (let bI = 0; bI < B; bI++) {
    const a = first + Math.floor(((last - first) * bI) / B), z = first + Math.floor(((last - first) * (bI + 1)) / B);
    const vals = []; for (let k = a; k < z; k++) if (voiced[k]) vals.push(db[k]);
    const loud = vals.length ? clamp((mean(vals) - lvMin) / Math.max(1, lvMax - lvMin), 0.05, 1) : 0.05;
    const t0 = (a * hop) / sr, t1 = (z * hop) / sr;
    const ps = pitch.filter((p) => p.t >= t0 && p.t < t1).map((p) => 12 * Math.log2(p.f0 / med));
    const sy = syll.filter((f) => f >= a && f < z).length;
    timeline.push({ t: (t0 + t1) / 2, loud: +loud.toFixed(3), pitch: ps.length && med ? +mean(ps).toFixed(2) : null, rate: Math.round((sy / 1.45) / Math.max(0.01, (t1 - t0) / 60)) });
  }
  // waveform overview
  const W = 480, wave = [];
  const per = Math.max(1, Math.floor(n / W));
  let gmax = 1e-6; const raw = [];
  for (let i = 0; i < W; i++) { let m = 0; const o = i * per; for (let k = 0; k < per && o + k < n; k += 2) { const v = Math.abs(x[o + k]); if (v > m) m = v; } raw.push(m); if (m > gmax) gmax = m; }
  for (const m of raw) wave.push(Math.round(Math.pow(m / gmax, 0.7) * 100));
  onProgress(1, 'pitch');
  return {
    source: 'audio', duration: +duration.toFixed(1), spanSec: +spanSec.toFixed(1), speakingSec: +speakingSec.toFixed(1),
    wpmEst, syllables: syll.length, pauses: summarizePauses(pausesRaw), pitch: pitchStats, loudness, timeline, wave,
  };
}
function metricsFromCues(cues) {
  const start = cues[0].start, end = cues[cues.length - 1].end;
  const spanSec = Math.max(1, end - start);
  const gaps = [];
  for (let i = 1; i < cues.length; i++) { const g = cues[i].start - cues[i - 1].end; if (g >= 0.3) gaps.push({ t: cues[i - 1].end, d: g }); }
  const B = 24, timeline = [];
  for (let b = 0; b < B; b++) {
    const t0 = start + (spanSec * b) / B, t1 = start + (spanSec * (b + 1)) / B;
    let w = 0; for (const c of cues) { const mid = (c.start + c.end) / 2; if (mid >= t0 && mid < t1) w += wordsOf(c.text).length; }
    timeline.push({ t: (t0 + t1) / 2, rate: Math.round(w / ((t1 - t0) / 60)), loud: null, pitch: null });
  }
  const words = cues.reduce((s, c) => s + wordsOf(c.text).length, 0);
  return { source: 'captions', duration: +end.toFixed(1), spanSec: +spanSec.toFixed(1), speakingSec: null, wpmEst: Math.round(words / (spanSec / 60)), pauses: summarizePauses(gaps), pausesReliable: gaps.length >= 3, pitch: null, loudness: null, timeline, wave: null };
}

/* Video frames → images for the presence read */
function once(el, ev, ms) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => { el.removeEventListener(ev, h); rej(new Error('timeout')); }, ms);
    const h = () => { clearTimeout(t); el.removeEventListener(ev, h); res(); };
    el.addEventListener(ev, h);
  });
}
async function extractFrames(file, count) {
  const url = URL.createObjectURL(file);
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  try {
    await once(v, 'loadeddata', 9000);
    const dur = v.duration;
    if (!isFinite(dur) || !v.videoWidth) throw new Error('no-video');
    const scale = Math.min(1, 900 / v.videoWidth);
    const c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
    const t = document.createElement('canvas'); const ts = 200 / c.width; t.width = 200; t.height = Math.round(c.height * ts);
    const ctx = c.getContext('2d'), tctx = t.getContext('2d');
    const blobs = [], thumbs = [];
    for (let i = 0; i < count; i++) {
      v.currentTime = Math.min(dur - 0.1, (dur * (i + 0.5)) / count);
      await once(v, 'seeked', 6000);
      ctx.drawImage(v, 0, 0, c.width, c.height);
      tctx.drawImage(c, 0, 0, t.width, t.height);
      thumbs.push(t.toDataURL('image/jpeg', 0.6));
      blobs.push(await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.82)));
    }
    return { blobs: blobs.filter(Boolean), thumbs };
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- Scoring ---------- */
function ramp(v, pts) {
  if (v <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (v <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return Math.round(y0 + ((y1 - y0) * (v - x0)) / (x1 - x0)); }
  return pts[pts.length - 1][1];
}
function bandScore(v, lo, hi, slope, floor = 25) { if (v >= lo && v <= hi) return 100; const d = v < lo ? lo - v : v - hi; return Math.max(floor, Math.round(100 - d * slope)); }

function scoreDelivery(m, words, occasionId, fillerCount) {
  const occ = occasionOf(occasionId);
  const [lo, hi] = occ.pace;
  const minutes = Math.max(m.spanSec, 1) / 60;
  const hasWords = words >= 30;
  const wpm = hasWords ? Math.round(words / minutes) : m.wpmEst;
  const wpmSource = hasWords ? 'transcript' : m.source === 'captions' ? 'captions' : 'estimate';
  const paceScore = wpm ? bandScore(wpm, lo, hi, 2.2) : null;
  const pausesOk = m.source === 'audio' || m.pausesReliable;
  const dpm = m.pauses.deliberate / minutes, lpm = m.pauses.long / minutes;
  const pauseScore = pausesOk ? clamp(Math.round(ramp(dpm, [[0, 35], [1, 60], [2, 85], [3, 100], [6, 100], [10, 70]]) - Math.min(35, lpm * 25)), 10, 100) : null;
  const pitchScore = m.pitch ? ramp(m.pitch.std, [[0.8, 25], [1.5, 40], [2.5, 70], [3.5, 92], [4.5, 100], [6.5, 92], [9, 75]]) : null;
  const volumeScore = m.loudness ? ramp(m.loudness.std, [[1, 35], [2, 55], [3.5, 80], [5, 100], [8, 95], [11, 75]]) : null;
  const fillersPerMin = hasWords ? +(fillerCount / minutes).toFixed(2) : null;
  const fillerScore = fillersPerMin == null ? null : ramp(fillersPerMin, [[0, 100], [1, 92], [3, 70], [6, 45], [10, 25]]);
  const conf = [paceScore, pauseScore, fillerScore].filter((v) => v != null);
  const expr = [pitchScore, volumeScore].filter((v) => v != null);
  const notes = [];
  const est = wpmSource === 'estimate' ? ' (estimated from syllables)' : '';
  if (wpm) {
    if (wpm > hi + 6) notes.push({ tone: 'warn', title: 'Ease off the gas', text: `You averaged ${wpm} words per minute${est}. For a ${occ.label.toLowerCase()}, ${lo}–${hi} lets ideas land. Slow down on your key lines and let the pauses do the work.` });
    else if (wpm < lo - 6) notes.push({ tone: 'warn', title: 'Pick up the pace', text: `At ${wpm} words per minute${est} you’re below the ${lo}–${hi} range that suits a ${occ.label.toLowerCase()}. Energy can sag; tighten sentences and move briskly through transitions.` });
    else notes.push({ tone: 'good', title: 'Pace in the sweet spot', text: `${wpm} words per minute${est} sits inside the ${lo}–${hi} range for a ${occ.label.toLowerCase()}.` });
  }
  if (pausesOk) {
    if (m.pauses.long > 0 && m.pauses.longest) notes.push({ tone: 'warn', title: m.pauses.long === 1 ? 'One frozen silence' : `${m.pauses.long} frozen silences`, text: `${plural(m.pauses.long, 'pause')} ran past two seconds (the longest was ${m.pauses.longest.d.toFixed(1)} s at ${fmtTime(m.pauses.longest.t)}). If those weren’t planned beats, keep a one-line roadmap in your notes.` });
    if (dpm < 1) notes.push({ tone: 'warn', title: 'Few deliberate pauses', text: 'You rarely stopped for more than a breath. Add a one-to-two second pause before each key point and after each question.' });
    else notes.push({ tone: 'good', title: 'You use the pause', text: `${plural(m.pauses.deliberate, 'deliberate pause')} (0.7–2 s). That gives the audience time to absorb what you said.` });
  }
  if (m.pitch) {
    if (m.pitch.std < 2) notes.push({ tone: 'warn', title: 'Flat pitch', text: `Your pitch varied about ${m.pitch.std.toFixed(1)} semitones, which reads as monotone. Let your voice rise on questions and fall at the end of statements.` });
    else if (m.pitch.std > 6) notes.push({ tone: 'warn', title: 'Very sing-song', text: `Your pitch swung about ${m.pitch.std.toFixed(1)} semitones. Expressive is good; settle it on key lines so they sound certain.` });
    else notes.push({ tone: 'good', title: 'Expressive voice', text: `Your pitch moved about ${m.pitch.std.toFixed(1)} semitones, in the lively range that keeps listeners engaged.` });
  }
  if (m.loudness) {
    if (m.loudness.std < 2) notes.push({ tone: 'warn', title: 'Steady volume', text: 'Your volume barely changed. Drop it to pull people in on a personal moment; lift it on your call to action.' });
    else notes.push({ tone: 'good', title: 'Dynamic volume', text: `Your volume moved across a ${m.loudness.range.toFixed(0)} dB range. You’re using power as an instrument.` });
  }
  if (fillersPerMin != null) {
    if (fillersPerMin >= 3) notes.push({ tone: 'warn', title: 'Filler words', text: `${plural(fillerCount, 'filler')}, about ${fillersPerMin.toFixed(1)} per minute. Replace each one with a silent breath.` });
    else if (fillerCount > 0) notes.push({ tone: 'good', title: 'Few fillers', text: `${plural(fillerCount, 'filler')} (${fillersPerMin.toFixed(1)} per minute). Auto-transcripts often drop “um”, so check the recording too.` });
    else notes.push({ tone: 'good', title: 'No fillers detected', text: 'Clean. Note that some auto-transcripts remove “um” and “uh”.' });
  }
  return {
    wpm, wpmSource, pace: [lo, hi], paceScore, pauseScore, pitchScore, volumeScore, fillersPerMin, fillerScore, fillerCount,
    confidence: conf.length ? Math.round(mean(conf)) : null, expressiveness: expr.length ? Math.round(mean(expr)) : null, notes,
  };
}

function heuristicContent(text) {
  const W = Math.max(1, wordsOf(text).length);
  const lower = text.toLowerCase();
  const count = (re) => (lower.match(re) || []).length;
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 1);
  const avgLen = W / Math.max(1, sentences.length);
  const per = (n) => (n / W) * 100;
  const you = count(/\b(you|your|you're|yours)\b/g), we = count(/\b(we|our|us|together)\b/g);
  const nums = count(/\b\d[\d,.]*\b/g) + count(/\b(two|three|four|five|six|seven|eight|nine|ten|twelve|twenty|thirty|fifty|hundred|thousand|million|billion|percent)\b/g) * 0.6;
  const reasons = count(/\b(because|therefore|for example|for instance|according to|research|study|data|evidence|which means|so that|that's why)\b/g);
  const signposts = count(/\b(first|second|third|finally|next|in summary|here's|the problem|the solution|in short)\b/g);
  const story = count(/\b(i remember|years ago|one day|last (year|week|month)|when i was|i stood|i watched|i saw|that moment|that night|that day)\b/g);
  const sensory = count(/\b(saw|heard|smell|felt|cold|warm|bright|dark|loud|quiet|tears|laugh|heart|hands|eyes|voice|picture|imagine)\b/g);
  const emotion = count(/\b(love|fear|hope|proud|afraid|angry|joy|grief|lost|dream|believe|care|courage)\b/g);
  const hedges = count(/\b(i think|maybe|perhaps|probably|i guess|hopefully|i feel like)\b/g);
  const absolutes = count(/\b(everyone knows|everybody|always|never|nobody|no one|obviously|clearly)\b/g);
  const questions = (text.match(/\?/g) || []).length;
  const subs = {
    ethos: { credibility: clamp(Math.round(48 + Math.min(14, per(nums) * 3) - per(absolutes) * 4), 25, 82), goodwill: clamp(Math.round(45 + Math.min(25, per(you + we) * 2.2)), 25, 85), composure: clamp(Math.round(72 - per(hedges) * 8), 25, 85) },
    pathos: { story: clamp(Math.round(40 + Math.min(32, per(story) * 14)), 25, 88), imagery: clamp(Math.round(42 + Math.min(30, per(sensory) * 6)), 25, 85), connection: clamp(Math.round(42 + Math.min(18, per(you) * 2) + Math.min(10, questions * 2) + Math.min(10, per(emotion) * 3)), 25, 85) },
    logos: { structure: clamp(Math.round(46 + Math.min(26, per(signposts) * 7) - (avgLen > 28 ? 8 : 0)), 25, 85), evidence: clamp(Math.round(40 + Math.min(30, per(nums) * 5) + Math.min(10, per(reasons) * 3)), 25, 85), reasoning: clamp(Math.round(62 + Math.min(14, per(reasons) * 4) - per(absolutes) * 6), 25, 85) },
  };
  const scores = {};
  for (const k of POLE_KEYS) scores[k] = Math.round(mean(Object.values(subs[k])));
  // marks
  const marks = [];
  const scan = (re, kind, label, note, fix, pole, limit = 4) => {
    re.lastIndex = 0; let m, n = 0;
    while ((m = re.exec(text)) && n < limit) { marks.push({ start: m.index, end: m.index + m[0].length, quote: text.slice(m.index, m.index + m[0].length).trim(), kind, label, note, fix, pole }); n++; }
  };
  scan(/\b(everyone knows|everybody knows|always|never|nobody|no one|obviously|clearly)\b/gi, 'vague', 'Sweeping claim', 'Absolute words invite the skeptic to find the exception.', 'Swap it for a specific, checkable claim.', 'logos');
  scan(/\beither\b[^.?!]{3,90}?\bor\b[^.?!]*/gi, 'fallacy', 'Possible false dilemma', '“Either… or…” can hide the options in between. Make sure there really are only two.', 'Acknowledge the middle options, then explain why yours is best.', 'logos', 2);
  scan(/\b(i think|maybe|perhaps|probably|i guess|hopefully)\b/gi, 'weak', 'Hedge', 'Hedges soften your authority. Use them only where you are genuinely unsure.', 'Cut the hedge or replace it with evidence.', 'ethos', 3);
  scan(/[^.!?\n]*\?/g, 'device', 'Question to the audience', 'Questions pull listeners into active thinking.', null, 'pathos', 2);
  scan(/\b\d[\d,.]*\s*(%|percent|kilos?|tonnes?|million|thousand|people|years|months|minutes)?/gi, 'strength', 'Concrete number', 'Specific figures make claims credible and memorable.', null, 'logos', 3);
  // anaphora: consecutive sentences sharing their first two words
  const sentRe = /[^.!?\n]+[.!?]/g; const sents = []; let sm;
  while ((sm = sentRe.exec(text))) sents.push({ s: sm[0], i: sm.index });
  for (let i = 1; i < sents.length; i++) {
    const a = sents[i - 1].s.trim().toLowerCase().split(/\s+/).slice(0, 2).join(' '), b = sents[i].s.trim().toLowerCase().split(/\s+/).slice(0, 2).join(' ');
    if (a && a === b && a.length > 3) { const st = sents[i - 1].i + sents[i - 1].s.search(/\S/); marks.push({ start: st, end: sents[i].i + sents[i].s.length, kind: 'device', label: 'Anaphora', note: 'Repeating the opening words of consecutive sentences builds rhythm and emphasis.', pole: 'pathos' }); break; }
  }
  const strengths = [], growth = [];
  const best = strongestPole(scores), worst = weakestPole(scores);
  if (story > 0) strengths.push('You use personal story moments, which make the talk memorable.'); else growth.push('Add one specific story moment (a time, a place, a person) to make it memorable.');
  if (nums >= 2) strengths.push('Concrete numbers give your claims weight.'); else growth.push('Support your main claim with at least one specific number or example.');
  if (per(you + we) > 3) strengths.push('You speak to the audience directly with “you” and “we”.'); else growth.push('Use “you” and “we” more to make the talk about the audience.');
  if (absolutes > 1) growth.push('Replace sweeping words like “always”, “never” and “everyone” with specific claims.');
  if (hedges > 1) growth.push('Cut hedges like “I think” and “maybe” where you are actually sure.');
  if (signposts > 1) strengths.push('Signposts help listeners follow your structure.');
  const POLE_TIPS = { ethos: 'Open with one specific detail that shows why you are worth listening to.', pathos: 'Add one concrete moment: a time, a place and a person.', logos: 'Back your main claim with one specific fact and say where it comes from.' };
  POLE_KEYS.slice().sort((a, b) => scores[a] - scores[b]).forEach((k) => { if (growth.length < 3 && !growth.includes(POLE_TIPS[k])) growth.push(POLE_TIPS[k]); });
  if (!strengths.length) strengths.push('You finished a full draft, which gives you something real to improve.');
  return {
    scores, subscores: subs, marks: marks.slice(0, 16),
    strengths: strengths.slice(0, 3), growth: growth.slice(0, 3),
    summary: `On-device read: strongest appeal ${best ? POLES[best].name : 'unclear'}, weakest ${worst ? POLES[worst].name : 'unclear'}. This is a word-pattern estimate. Allow Claude for this artifact to get fallacy checks, a structure map and personal lessons.`,
  };
}

function combineScores({ content, delivery, presence, fillerScore }) {
  const out = {};
  for (const k of POLE_KEYS) {
    const parts = [];
    if (content) parts.push([content[k], k === 'logos' ? 0.9 : 0.7]);
    if (delivery) {
      if (k === 'ethos' && delivery.confidence != null) parts.push([delivery.confidence, content ? 0.3 : 1]);
      if (k === 'pathos' && delivery.expressiveness != null) parts.push([delivery.expressiveness, content ? 0.3 : 1]);
      if (k === 'logos' && content && delivery.paceScore != null) parts.push([delivery.paceScore, 0.1]);
    } else if (k === 'ethos' && content && fillerScore != null) parts.push([fillerScore, 0.15]);
    if (presence && k === 'ethos' && presence.score != null) parts.push([presence.score, parts.length ? 0.15 : 1]);
    if (!parts.length) { out[k] = null; continue; }
    const wsum = parts.reduce((s, [, w]) => s + w, 0);
    out[k] = Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / wsum);
  }
  const known = POLE_KEYS.map((k) => out[k]).filter((v) => v != null);
  out.overall = known.length ? Math.round(mean(known)) : null;
  return out;
}

function normalizeAnalysis(raw) {
  if (!raw || typeof raw !== 'object') throw { code: 'invalid_json' };
  const num = (v, d = 50) => { const n = v == null || v === '' ? NaN : Number(v); return isFinite(n) ? clamp(Math.round(n), 0, 100) : d; };
  const scores = {}; const subscores = {};
  for (const k of POLE_KEYS) {
    scores[k] = num(raw.scores && raw.scores[k]);
    subscores[k] = {};
    for (const sk of Object.keys(POLES[k].subs)) subscores[k][sk] = num(raw.subscores && raw.subscores[k] && raw.subscores[k][sk], scores[k]);
  }
  const kinds = ['strength', 'device', 'fallacy', 'inconsistency', 'vague', 'weak'];
  const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
  const arr = (v) => (Array.isArray(v) ? v : []);
  return {
    title: str(raw.title).slice(0, 80),
    summary: str(raw.summary),
    scores, subscores,
    structure: arr(raw.structure).slice(0, 8).map((s) => ({ part: str(s.part), verdict: ['strong', 'solid', 'weak', 'missing'].includes(s.verdict) ? s.verdict : 'solid', quote: str(s.quote), note: str(s.note) })),
    highlights: arr(raw.highlights).slice(0, 18).map((h) => ({ quote: str(h.quote), kind: kinds.includes(h.kind) ? h.kind : 'weak', label: str(h.label) || 'Note', pole: POLE_KEYS.includes(h.pole) ? h.pole : 'logos', note: str(h.note), fix: h.fix ? str(h.fix) : '' })).filter((h) => h.quote),
    strengths: arr(raw.strengths).map(str).filter(Boolean).slice(0, 4),
    growth: arr(raw.growth).map(str).filter(Boolean).slice(0, 4),
    lessons: arr(raw.lessons).slice(0, 3).map((l) => ({ title: str(l.title) || 'Lesson', pole: POLE_KEYS.includes(l.pole) ? l.pole : 'logos', why: str(l.why), concept: str(l.concept), example: str(l.example), drill: str(l.drill) })).filter((l) => l.drill),
    coach_note: str(raw.coach_note),
  };
}

/* ---------- Prompts ---------- */
function profileLine(p) {
  const s = p.skills;
  const has = POLE_KEYS.some((k) => s[k] != null);
  if (!has) return 'No speeches analyzed yet, so their strengths are unknown.';
  const best = strongestPole(s), worst = weakestPole(s);
  return `Rhetorical profile (0-100): ethos ${s.ethos ?? '?'}, pathos ${s.pathos ?? '?'}, logos ${s.logos ?? '?'}. Strongest: ${POLES[best].name}. Weakest: ${POLES[worst].name}. Archetype: ${archetypeOf(s).name}.`;
}
function voiceSample(speeches) {
  const s = speeches.find((x) => x.transcript && x.transcript.length > 200);
  return s ? s.transcript.slice(0, 700) : '';
}
function deliveryLine(metrics, delivery) {
  if (!metrics || !delivery) return '';
  const bits = [`${fmtTime(metrics.duration)} long`];
  if (delivery.wpm) bits.push(`${delivery.wpm} words per minute`);
  if (metrics.source === 'audio' || metrics.pausesReliable) bits.push(`${metrics.pauses.deliberate} deliberate pauses, ${metrics.pauses.long} over 2 seconds`);
  if (metrics.pitch) bits.push(`pitch variety ${metrics.pitch.std} semitones`);
  if (delivery.fillerCount != null) bits.push(`${delivery.fillerCount} filler words`);
  return `Measured delivery: ${bits.join(', ')}.`;
}
function analysisPrompt({ transcript, occasion, focus, title, profile, metrics, delivery }) {
  return `You are Rostra, a world-class speech coach grounded in Aristotle's rhetoric (ethos, pathos, logos) and modern public-speaking practice. Analyze the speech transcript below and coach the speaker.

CONTEXT
Occasion: ${occasionOf(occasion).label}
${title ? `Speaker's title: ${title}\n` : ''}${focus && focus.length ? `The speaker especially wants feedback on: ${focus.join(', ')}\n` : ''}${profileLine(profile)}
${deliveryLine(metrics, delivery)}

SCORING
Score the content (delivery is measured separately). Calibrate honestly: an average competent amateur speech scores 45-65 on each appeal; 80+ means genuinely excellent; below 35 means the appeal is nearly absent.
- ethos: credibility shown (not claimed), goodwill toward this audience, composure in the wording (hedges and fillers lower it).
- pathos: storytelling, vivid concrete language, emotional connection with this audience.
- logos: clear structure, evidence (specific facts, numbers, examples), sound reasoning (fallacies and contradictions lower it).

HIGHLIGHTS
Pick 6-14 passages. Each "quote" MUST be copied exactly from the transcript: 3-25 consecutive words with the same spelling and punctuation, so the app can find it. Flag every logical fallacy and every internal inconsistency or contradiction you find, and include the strongest rhetorical moments.
"kind" is one of: "strength", "device" (a named rhetorical device), "fallacy", "inconsistency", "vague" (unsupported or sweeping claim), "weak" (hedging, clutter, jargon, a weak transition).

Reply with only JSON in exactly this shape:
{
  "title": "a short title for this speech, max 6 words",
  "summary": "two sentences on what the speech does and how well",
  "scores": {"ethos": 0, "pathos": 0, "logos": 0},
  "subscores": {
    "ethos": {"credibility": 0, "goodwill": 0, "composure": 0},
    "pathos": {"story": 0, "imagery": 0, "connection": 0},
    "logos": {"structure": 0, "evidence": 0, "reasoning": 0}
  },
  "structure": [{"part": "Opening", "verdict": "strong", "quote": "first words of this part, copied exactly", "note": "one sentence"}],
  "highlights": [{"quote": "...", "kind": "fallacy", "label": "False dilemma", "pole": "logos", "note": "why it matters, 1-2 sentences", "fix": "one concrete fix (empty string for strengths and devices)"}],
  "strengths": ["three specific strengths, one sentence each"],
  "growth": ["three specific, actionable improvements, one sentence each"],
  "lessons": [{"title": "short lesson title", "pole": "ethos", "why": "tie to a specific moment in this speech", "concept": "the technique in 2-4 sentences", "example": "a short illustrative example, not from this speech", "drill": "a 5-minute writing exercise the speaker can do right now"}],
  "coach_note": "2-3 warm, direct sentences addressed to the speaker as 'you'"
}
structure: 3-6 parts in speaking order; verdict is one of "strong", "solid", "weak", "missing" (use "missing" with an empty quote for an expected part that is absent, such as a clear call to action).
lessons: exactly 3, targeting the speaker's weakest areas.

TRANSCRIPT
"""
${transcript}
"""`;
}
function presencePrompt(n, occasion) {
  return `These ${n} images are still frames taken at even intervals from a video of a person giving a ${occasionOf(occasion).label.toLowerCase()}. Assess only visible delivery: posture, gestures, facial expression, eye line (toward the audience or camera vs. down at notes), framing and energy. Do not identify the person or comment on appearance beyond delivery.
Reply with only JSON: {"score": 0-100 for overall stage presence (60 is typical), "observations": ["three short, specific observations"], "tip": "one actionable tip for next time"}`;
}
function drillPrompt(lesson, answer) {
  return `You are a speech coach grading a short practice exercise.
Lesson: ${lesson.title} (${POLES[lesson.pole] ? POLES[lesson.pole].name : lesson.pole})
Technique: ${Array.isArray(lesson.concept) ? lesson.concept.join(' ') : lesson.concept}
Exercise: ${lesson.drill}
The speaker wrote:
"""
${answer}
"""
Grade how well this applies the technique, 0-100 (70 is a solid attempt). Be encouraging and specific. Do not rewrite their whole answer.
Reply with only JSON: {"score": 0, "verdict": "one short line", "worked": "what works, quoting their words", "next": "one specific improvement", "example": "one improved line in their own voice, max 25 words"}`;
}
function briefBlock(b) {
  return `Occasion: ${occasionOf(b.occasion).label}
Working title: ${b.title || '(none yet)'}
Audience: ${b.audience || '(not specified)'}
What the audience should think, feel or do afterwards: ${b.goal || '(not specified)'}
Length: about ${b.minutes || 5} minutes
Speaker's raw material (notes, facts, ideas): ${b.material || '(none)'}
Personal stories they could use: ${b.stories || '(none)'}`;
}
function anglesPrompt(brief, profile, speeches) {
  const vs = voiceSample(speeches);
  return `You are Rostra, a speech coach who helps people write their OWN speeches. You never write the speech for them. Propose three genuinely different approaches to the speech below.

THE SPEECH
${briefBlock(brief)}

THE SPEAKER
${profileLine(profile)}
${vs ? `Their natural speaking voice (excerpt from a past speech): """${vs}"""\n` : ''}Lean on their strengths and give them a safe way to stretch their weakest appeal.

Each approach needs a distinct structure (for example story-led, problem-solution, contrarian, question-led, Monroe's motivated sequence, past-present-future) and a different emphasis across ethos, pathos and logos.
Also write three sharp questions that will help the speaker find their own best material (about their experience, their audience, their stakes).

Reply with only JSON:
{"angles": [{"name": "evocative 2-4 word name", "approach": "structure type", "thesis": "the angle in one sentence", "beats": ["4-6 short beats in order"], "mix": {"ethos": 30, "pathos": 50, "logos": 20}, "fits": "why this suits this speaker, one sentence referencing their profile", "risk": "the main way it could go wrong, one sentence"}], "questions": ["...", "...", "..."]}
Exactly 3 angles; each mix sums to 100.`;
}
function outlinePrompt(prep, profile, speeches) {
  const a = prep.angle;
  const qa = (prep.questions || []).filter((q) => q.a && q.a.trim()).map((q) => `Q: ${q.q}\nA: ${q.a}`).join('\n');
  const vs = voiceSample(speeches);
  return `You are Rostra, a speech coach. Build a speaking outline the speaker will fill with their OWN words. Never write sentences of the speech itself. Give scaffolding only: purposes, prompts, and sentence frames with [brackets] where their content goes.

THE SPEECH
${briefBlock(prep.brief)}

CHOSEN APPROACH: ${a.name} (${a.approach}): ${a.thesis}
Beats: ${(a.beats || []).join(' → ')}
${qa ? `\nTHE SPEAKER'S ANSWERS\n${qa}\n` : ''}
THE SPEAKER
${profileLine(profile)}
${vs ? `Their natural voice (excerpt): """${vs}"""\nShape the sentence frames so they fit this voice.\n` : ''}
Plan sections whose seconds add up to about ${(prep.brief.minutes || 5) * 60}.
Reply with only JSON:
{"core": "a draft of the one-sentence big idea built only from the speaker's own material, under 18 words", "sections": [{"name": "Hook", "pole": "pathos", "seconds": 30, "purpose": "what this section must achieve", "technique": "one named technique with a one-line how-to", "frame": "a sentence frame with [brackets]", "prompts": ["two or three questions that pull the content out of the speaker"]}], "pitfalls": ["two or three traps specific to this speech"]}
4-7 sections, ending with a close that has a clear call to action or final image.`;
}
function sectionPrompt(prep, sec) {
  return `You are Rostra, a speech coach reviewing ONE section of a speech the speaker is writing. Do not rewrite it. Coach it.
Speech: ${occasionOf(prep.brief.occasion).label} for ${prep.brief.audience || 'a general audience'}. Goal: ${prep.brief.goal || 'not specified'}.
Big idea: ${prep.core || '(not set)'}
Approach: ${prep.angle ? prep.angle.name + ': ' + prep.angle.thesis : 'not chosen'}
Section: ${sec.name}. Purpose: ${sec.purpose}. Target about ${sec.seconds} seconds (~${Math.round((sec.seconds / 60) * 140)} words).
Their draft:
"""
${sec.text}
"""
Reply with only JSON: {"scores": {"ethos": 0, "pathos": 0, "logos": 0}, "verdict": "one line", "keep": "their strongest phrase, quoted exactly, and why it works", "improve": "the single most valuable change, specific", "flags": [{"quote": "exact words", "issue": "fallacy, vague claim, cliché, jargon, hedge or inconsistency", "note": "one sentence"}], "question": "one question that pushes their thinking further"}
flags: 0-3 items, only real problems. Score this section for what it is trying to do, 0-100.`;
}
function nudgePrompt(prep, sec) {
  return `A speaker is stuck writing one section of their speech. Give them a way in without writing it for them.
Speech: ${occasionOf(prep.brief.occasion).label}. Audience: ${prep.brief.audience || 'general'}. Big idea: ${prep.core || '(not set)'}.
Their material: ${prep.brief.material || '(none)'} ${prep.brief.stories ? 'Stories: ' + prep.brief.stories : ''}
Section: ${sec.name}. Purpose: ${sec.purpose}.
${sec.text ? `What they have so far: """${sec.text}"""` : 'They have nothing yet.'}
Reply with only JSON: {"questions": ["two specific questions that draw on their material"], "starters": ["three different opening fragments of at most 7 words each, ending mid-sentence with …"]}`;
}
function slidesPrompt(prep, draft) {
  const n = Math.max(4, Math.min(12, Math.round((prep.brief.minutes || 5) * 1.3)));
  return `Turn this speech into a lean slide outline. Slides support the speaker; they don't repeat the script. One idea per slide, minimal words, a strong visual idea.
Reply with only JSON: {"slides": [{"title": "max 6 words", "visual": "a concrete visual suggestion", "text": "on-slide text, max 12 words, or empty", "notes": "a one-line speaker cue taken from their script", "pole": "ethos|pathos|logos"}]}
Between ${n - 2} and ${n} slides.
SPEECH
"""
${draft}
"""`;
}
function coachRules(profile, speeches) {
  const li = levelInfo(profile.xp);
  const last = speeches[0];
  return `You are the speaking coach inside Rostra, a public-speaking practice app. Be warm, direct and practical. Ground advice in rhetoric (ethos, pathos, logos) and real stagecraft. Keep replies under 170 words, in short paragraphs or a few bullets, with **bold** for key phrases. Never write a complete speech for the user: coach them to write it, ask questions, offer frames and examples. If they paste text, give specific feedback on it.
About this speaker: level ${li.level} (${li.title}). ${profileLine(profile)} They mostly speak for: ${profile.goal ? occasionOf(profile.goal).label : 'unknown'}. ${speeches.length} speeches analyzed.${last && last.ai && last.ai.growth ? ' Their latest growth areas: ' + last.ai.growth.join(' ') : ''}`;
}

/* ---------- Speech analysis pipeline ---------- */
async function runSpeechAnalysis(input, stage, signal) {
  const { file, transcript: rawT, cues, title, occasion, focus } = input;
  const profile = Store.state.profile;
  const transcript = prepareTranscript(rawT || '');
  const words = wordsOf(transcript).length;
  const isVideo = !!file && (/^video\//.test(file.type) || /\.(mp4|mov|webm|m4v)$/i.test(file.name));
  let metrics = null, presence = null;
  if (file) {
    stage('decode', 0);
    metrics = await analyzeAudio(file, (p, label) => stage(label, p), signal);
  } else if (cues && cues.length > 2) {
    stage('captions', 1);
    metrics = metricsFromCues(cues);
  }
  if (signal && signal.aborted) throw { code: 'cancelled' };
  const fillers = transcript ? findFillers(transcript) : [];
  const delivery = metrics ? scoreDelivery(metrics, words, occasion, fillers.length) : null;
  const minutesGuess = metrics ? metrics.spanSec / 60 : words / 140;
  const fillerScore = !metrics && words >= 30 ? ramp(fillers.length / Math.max(0.5, minutesGuess), [[0, 100], [1, 92], [3, 70], [6, 45], [10, 25]]) : null;

  if (isVideo && AI.ready && AI.images) {
    stage('presence', 0);
    try {
      const { blobs, thumbs } = await extractFrames(file, Math.max(1, Math.min(5, AI.imageMax || 5)));
      if (blobs.length) {
        const raw = await AI.json(presencePrompt(blobs.length, occasion), { images: blobs, signal });
        presence = { score: clamp(Math.round(scoreOr(raw.score, 60)), 0, 100), observations: (raw.observations || []).map(String).slice(0, 4), tip: String(raw.tip || ''), thumbs: thumbs.slice(0, 5) };
      }
    } catch (e) { if (e && e.code === 'cancelled') throw e; presence = null; }
  }
  let ai = null, heur = null, aiError = null;
  if (words >= 30) {
    if (Store.state.ai !== 'off') {
      stage('ai', 0);
      try {
        const raw = await AI.json(analysisPrompt({ transcript, occasion, focus, title, profile, metrics, delivery }), { signal, modelTier: 'default', cache: false, onText: ({ text }) => stage('ai', text.length) });
        ai = normalizeAnalysis(raw);
      } catch (e) {
        if (e && e.code === 'cancelled') throw e;
        aiError = aiErrorText(e);
      }
    }
    if (!ai) heur = heuristicContent(transcript);
  }
  const content = ai ? ai.scores : heur ? heur.scores : null;
  const scores = combineScores({ content, delivery, presence, fillerScore });
  const prev = Store.state.speeches[0];
  // Full XP for a real speech, less for a few lines, none for re-submitting the same thing.
  const fp = hashStr(transcript + '|' + (file ? file.name + ':' + file.size : ''));
  const dup = Store.state.speeches.some((x) => x.fp === fp);
  let xp = file ? 100 : Math.round(100 * clamp(words / 150, 0.25, 1));
  if (prev && prev.scores) for (const k of POLE_KEYS) if (scores[k] != null && prev.scores[k] != null && scores[k] > prev.scores[k]) xp += Math.min(30, (scores[k] - prev.scores[k]) * 2);
  if (ai) xp += 20;
  if (dup) xp = 0;
  const doc = {
    type: 'speech', id: uid('s_'), date: Date.now(), fp, dup,
    title: (title || (ai && ai.title) || (file && file.name.replace(/\.[^.]+$/, '')) || (words ? wordsOf(transcript).slice(0, 6).join(' ') + '…' : 'Untitled speech')).slice(0, 80),
    occasion, focus: focus || [],
    source: { file: file ? file.name : null, kind: file ? (isVideo ? 'video' : 'audio') : null, captions: !!(cues && cues.length) },
    transcript, words, durationSec: metrics ? metrics.duration : Math.round((words / 140) * 60),
    metrics, delivery, presence, ai, heur, aiError, scores, fillerScore,
    fillers: fillers.slice(0, 200), xp: Math.round(xp), archetype: archetypeOf(scores).name,
  };
  // Keep the document under the sync limit: frames go first, then the end of a very long transcript.
  if (jsonBytes(doc) > SYNC_LIMIT && doc.presence) doc.presence = { ...doc.presence, thumbs: [] };
  const over = jsonBytes(doc);
  if (over > SYNC_LIMIT) { doc.transcript = doc.transcript.slice(0, Math.floor(doc.transcript.length * (SYNC_LIMIT / over) * 0.9)); doc.transcriptTrimmed = true; }
  return doc;
}

/* Sample report, computed through the same pipeline as a real one */
let _sample = null;
function getSample() {
  if (_sample) return _sample;
  const transcript = SAMPLE_TRANSCRIPT;
  const metrics = makeSampleMetrics();
  const fillers = findFillers(transcript);
  const words = wordsOf(transcript).length;
  const delivery = scoreDelivery(metrics, words, 'pitch', fillers.length);
  const ai = normalizeAnalysis(SAMPLE_AI);
  const scores = combineScores({ content: ai.scores, delivery });
  _sample = {
    type: 'speech', id: 'sample', sample: true, date: Date.now() - 86400000 * 2, title: ai.title, occasion: 'pitch', focus: ['Persuasion'],
    source: { file: 'compost-club-pitch.m4a', kind: 'audio', captions: false },
    transcript, words, durationSec: metrics.duration, metrics, delivery, presence: null, ai, heur: null, scores, fillers, xp: 140, archetype: archetypeOf(scores).name,
  };
  return _sample;
}

/* ---------- Markdown exports ---------- */
function reportMarkdown(sp) {
  const L = [];
  L.push(`# ${sp.title}`, '', `${occasionOf(sp.occasion).label} · ${new Date(sp.date).toLocaleDateString()} · ${fmtTime(sp.durationSec)}`, '');
  L.push(`**Overall ${sp.scores.overall ?? '–'}** · Ethos ${sp.scores.ethos ?? '–'} · Pathos ${sp.scores.pathos ?? '–'} · Logos ${sp.scores.logos ?? '–'}`, '');
  const a = sp.ai || sp.heur;
  if (sp.ai && sp.ai.coach_note) L.push(`> ${sp.ai.coach_note}`, '');
  if (a && a.summary) L.push(a.summary, '');
  if (a && a.strengths && a.strengths.length) { L.push('## Strengths'); a.strengths.forEach((s) => L.push(`- ${s}`)); L.push(''); }
  if (a && a.growth && a.growth.length) { L.push('## Growth areas'); a.growth.forEach((s) => L.push(`- ${s}`)); L.push(''); }
  if (sp.delivery) { L.push('## Delivery'); sp.delivery.notes.forEach((n) => L.push(`- **${n.title}.** ${n.text}`)); L.push(''); }
  if (sp.ai && sp.ai.highlights.length) {
    L.push('## Content check');
    sp.ai.highlights.filter((h) => ['fallacy', 'inconsistency', 'vague', 'weak'].includes(h.kind)).forEach((h) => L.push(`- **${h.label}**: “${h.quote}”. ${h.note}${h.fix ? ' Fix: ' + h.fix : ''}`));
    L.push('');
  }
  if (sp.ai && sp.ai.lessons.length) { L.push('## Lessons'); sp.ai.lessons.forEach((l) => L.push(`### ${l.title}`, l.concept, '', `*Drill:* ${l.drill}`, '')); }
  if (sp.transcript) L.push('## Transcript', '', sp.transcript);
  return L.join('\n');
}
function prepMarkdown(prep) {
  const L = [`# ${prep.brief.title || 'Untitled speech'}`, '', `${occasionOf(prep.brief.occasion).label} · about ${prep.brief.minutes} minutes`, ''];
  if (prep.core) L.push(`**Big idea:** ${prep.core}`, '');
  (prep.sections || []).forEach((s) => { L.push(`## ${s.name}`, '', s.text || '_(not written yet)_', ''); });
  if (prep.slides && prep.slides.length) {
    L.push('---', '', '# Slide outline', '');
    prep.slides.forEach((s, i) => L.push(`${i + 1}. **${s.title}**${s.text ? ' · ' + s.text : ''}`, `   - Visual: ${s.visual}`, `   - Cue: ${s.notes}`));
  }
  return L.join('\n');
}
async function offerDownload(filename, text) {
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl) { await dl.save({ filename, data: text }); toast('Saved ' + filename); return; }
  } catch (e) {
    if (e && e.code === 'declined') return;
  }
  try {
    const blob = new Blob([text], { type: /\.json$/i.test(filename) ? 'application/json' : 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Saved ' + filename);
    return;
  } catch (e) { /* fall through */ }
  try { await navigator.clipboard.writeText(text); toast('Downloads aren’t available here, so the Markdown was copied to your clipboard.'); }
  catch (e) { toast('Downloads aren’t available in this view.', 'warn'); }
}
