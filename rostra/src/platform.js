/* ================================================================
   Platform: how the page talks to the outside world.
   - /api/health says which services exist (mock or live AI, Supabase accounts).
   - Platform.ai streams Claude answers from /api/ai (the key stays on the server).
   - Platform.db is the document store the engine persists to (Supabase `docs` table).
   - Platform.auth signs people in and out through Supabase Auth and /api/account.
   Inside a Claude artifact, window.claude still takes precedence, so the old runtime keeps working.
   Loaded before engine.js; everything here is plain functions and one object.
   ================================================================ */
const PLATFORM_LS = 'rostra.v1.';
const platformLs = {
  get(k) { try { const v = localStorage.getItem(PLATFORM_LS + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(PLATFORM_LS + k, JSON.stringify(v)); } catch (e) { /* full or blocked */ } },
};
function platformError(code, message, status) { const e = new Error(message || code); e.code = code; if (status) e.status = status; return e; }

const Platform = {
  config: null, // from /api/health
  sb: null,     // supabase-js client, when accounts are configured
  session: null,
  user: null,   // { id, role, displayName, schoolId, lang, username }
  listeners: new Set(),
  initPromise: null,
  get accountsRequired() { return !!(this.config && this.config.accounts === 'supabase'); },
  get signedIn() { return !!this.user; },
  get lang() { return (this.user && this.user.lang) || platformLs.get('lang') || (typeof navigator !== 'undefined' && /^bg/i.test(navigator.language || '') ? 'bg' : 'en'); },
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit(ev) { this.listeners.forEach((l) => { try { l(ev, this); } catch (e) { console.error(e); } }); },

  /* A stable per-browser id for the no-accounts mode, so limits and local data have an owner. */
  localUserId() {
    let id = platformLs.get('localUser');
    if (!id) { id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); platformLs.set('localUser', id); }
    return id;
  },

  init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' });
        this.config = r.ok ? await r.json() : null;
      } catch (e) { this.config = null; }
      if (!this.config) { this.config = { ok: false, ai: 'none', transcription: 'browser', accounts: 'local' }; }
      if (this.config.accounts === 'supabase' && window.supabase && this.config.supabaseUrl && this.config.supabaseAnonKey) {
        try {
          this.sb = window.supabase.createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
          const { data } = await this.sb.auth.getSession();
          await this.setSession(data && data.session);
          this.sb.auth.onAuthStateChange((event, session) => { this.setSession(session).then(() => this.emit(event === 'SIGNED_OUT' ? 'signout' : 'signin')); });
        } catch (e) { console.error('Supabase init failed', e); this.sb = null; this.config.accounts = 'local'; }
      }
      return this.config;
    })();
    return this.initPromise;
  },
  async setSession(session) {
    this.session = session || null;
    if (!session) { this.user = null; return; }
    const u = session.user;
    const meta = u.user_metadata || {};
    let p = null;
    try { const r = await this.sb.from('profiles').select('role, display_name, username, school_id, lang').eq('id', u.id).maybeSingle(); p = r.data; } catch (e) { p = null; }
    this.user = { id: u.id, email: u.email || null, role: (p && p.role) || meta.role || 'student', displayName: (p && p.display_name) || meta.display_name || '', username: (p && p.username) || meta.username || '', schoolId: p ? p.school_id : null, lang: (p && p.lang) || meta.lang || platformLs.get('lang') || 'en' };
  },
  async setLang(lang) {
    platformLs.set('lang', lang);
    if (this.user && this.sb) { this.user.lang = lang; try { await this.sb.from('profiles').update({ lang }).eq('id', this.user.id); } catch (e) { /* offline */ } }
    this.emit('lang');
  },
  headers(extra = {}) {
    const h = { ...extra };
    if (this.session && this.session.access_token) h.authorization = 'Bearer ' + this.session.access_token;
    else h['x-rostra-local-user'] = this.localUserId();
    return h;
  },

  /* Is the coach usable right now? 'ready' | 'locked' (needs sign-in) | 'off' (no AI on the server). */
  aiState() {
    if (!this.config || this.config.ai === 'none') return 'off';
    if (this.accountsRequired && !this.signedIn && this.config.ai === 'live') return 'locked';
    return 'ready';
  },

  /* One streamed request to /api/ai. Resolves {text, json, usage, model, cost}. opts: {signal, onText, tier, meta}. */
  async ai(body, opts = {}) {
    const ctl = new AbortController();
    if (opts.signal) opts.signal.addEventListener('abort', () => ctl.abort(), { once: true });
    let res;
    try {
      res = await fetch('/api/ai', { method: 'POST', headers: this.headers({ 'content-type': 'application/json', accept: 'text/event-stream' }), body: JSON.stringify({ ...body, tier: opts.modelTier || body.tier || 'default', lang: this.lang, meta: opts.meta || body.meta || null, stream: true }), signal: ctl.signal });
    } catch (e) {
      if (ctl.signal.aborted) throw platformError('cancelled', 'Stopped.');
      throw platformError('network', 'The coach could not be reached. Check your connection and try again.');
    }
    if (!res.ok || !(res.headers.get('content-type') || '').includes('text/event-stream')) {
      let err = null;
      try { err = (await res.json()).error; } catch (e) { /* no body */ }
      throw platformError((err && err.code) || (res.status === 401 ? 'not_granted' : res.status === 429 ? 'rate_limited' : 'upstream'), err && err.message, res.status);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', done = null, lastText = '';
    const handle = (chunk) => {
      const m = chunk.match(/^event: (\w+)\ndata: ([\s\S]*)$/);
      if (!m) return;
      let data = null;
      try { data = JSON.parse(m[2]); } catch (e) { return; }
      if (m[1] === 'delta') { lastText = data.text; if (opts.onText) opts.onText({ text: data.text }); }
      else if (m[1] === 'done') done = data;
      else if (m[1] === 'error') throw platformError(data.code || 'error', data.message);
    };
    for (;;) {
      let r;
      try { r = await reader.read(); } catch (e) { if (ctl.signal.aborted) throw platformError('cancelled', 'Stopped.'); throw platformError('network', 'The connection dropped. Try again.'); }
      if (r.done) break;
      buf += dec.decode(r.value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) { const chunk = buf.slice(0, i); buf = buf.slice(i + 2); handle(chunk); }
    }
    if (!done) throw platformError('network', 'The reply ended early. Try again.');
    if (body.kind === 'json' && (done.json == null)) throw platformError('invalid_json', 'The coach’s reply came back incomplete. Try again.');
    Platform.lastUsage = done;
    return done;
  },
  /* The same shape the old artifact runtime offered, so engine.js needs one small change. */
  sampleShim() {
    const fn = async (input, opts = {}) => {
      const turns = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
      const r = await Platform.ai({ kind: 'text', turns }, opts);
      return { text: r.text };
    };
    fn.json = async (prompt, opts = {}) => (await Platform.ai({ kind: 'json', prompt }, opts)).json;
    fn.limits = async () => ({ images: false });
    return fn;
  },

  /* Transcribe a recorded answer. Resolves {text, words, duration, language, provider}. */
  async transcribe(blob, { lang, doc, signal } = {}) {
    let res;
    try {
      res = await fetch('/api/transcribe?lang=' + encodeURIComponent(lang || this.lang) + (doc ? '&doc=' + encodeURIComponent(doc) : ''), { method: 'POST', headers: this.headers({ 'content-type': blob.type || 'audio/webm' }), body: blob, signal });
    } catch (e) { throw platformError(signal && signal.aborted ? 'cancelled' : 'network', 'The recording could not be sent. Check your connection.'); }
    let j = null;
    try { j = await res.json(); } catch (e) { j = null; }
    if (!res.ok || !j) throw platformError((j && j.error && j.error.code) || 'upstream', j && j.error && j.error.message, res.status);
    return j;
  },
  get transcriptionMode() { return (this.config && this.config.transcription) || 'browser'; },

  /* Document store, in the shape engine.js persists to: collection.get(), doc(id).set(body), doc(id).delete(). */
  db() {
    if (!this.sb || !this.user) return null;
    const sb = this.sb, uid = this.user.id;
    const wrap = (p) => p.then(({ data, error }) => {
      if (error) {
        const msg = String(error.message || '');
        if (/row-level security|permission|JWT|not authorized/i.test(msg)) throw { code: 'not_granted', message: msg };
        if (/payload|too large|413/i.test(msg)) throw { code: 'invalid_argument', message: msg };
        throw { code: 'unavailable', message: msg };
      }
      return data;
    });
    return {
      get: async () => {
        const rows = await wrap(sb.from('docs').select('id, body').eq('user_id', uid));
        return { docs: (rows || []).map((r) => ({ id: r.id, exists: true, data: () => r.body })) };
      },
      doc: (id) => ({
        set: (body) => wrap(sb.from('docs').upsert({ user_id: uid, id, type: String(body && body.type || 'doc'), body }, { onConflict: 'user_id,id' })),
        delete: () => wrap(sb.from('docs').delete().eq('user_id', uid).eq('id', id)),
      }),
    };
  },

  /* ---------- accounts ---------- */
  async account(action, payload) {
    let res;
    try { res = await fetch('/api/account', { method: 'POST', headers: this.headers({ 'content-type': 'application/json' }), body: JSON.stringify({ action, ...payload }) }); }
    catch (e) { throw platformError('network', 'The server could not be reached. Check your connection.'); }
    let j = null;
    try { j = await res.json(); } catch (e) { j = null; }
    if (!res.ok || !j) throw platformError((j && j.error && j.error.code) || 'upstream', (j && j.error && j.error.message) || 'Something went wrong on the server.', res.status);
    return j;
  },
  async signIn({ login, password }) {
    if (!this.sb) throw platformError('unavailable', 'Accounts are not set up on this server.');
    const email = /@/.test(login) ? login.trim() : null;
    const resolved = email || (await this.account('resolve', { username: login.trim() })).email;
    const { error } = await this.sb.auth.signInWithPassword({ email: resolved, password });
    if (error) throw platformError('bad_login', 'That name or password is not right.');
    await this.setSession((await this.sb.auth.getSession()).data.session);
    this.emit('signin');
    return this.user;
  },
  async signOut() {
    if (this.sb) await this.sb.auth.signOut();
    this.session = null; this.user = null;
    this.emit('signout');
  },
  /* Students: class code + display name + username + password. Teachers: invite code + email + name + password. */
  async signUp(payload) {
    const r = await this.account('signup', payload);
    if (r.email && payload.password) await this.signIn({ login: r.email, password: payload.password });
    return r;
  },
  async deleteAccount() {
    const r = await this.account('delete', {});
    await this.signOut();
    return r;
  },
};
