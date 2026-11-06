/* In-memory stand-in for the parts of Supabase this app uses: GoTrue (auth) and PostgREST (tables, the
   teacher_students view, a few RPCs), with Row Level Security approximated from supabase/migrations/0001_init.sql.
   No dependencies. Use it from tests or from scripts/dev.mjs:
     const mock = createMockSupabase();  const res = await mock.handle(request, '/mock-supabase');  // Response | null
   Keys: anon = 'mock-anon', service = 'mock-service'. Tokens are unsigned fake JWTs. Not a security boundary. */

export const ANON_KEY = 'mock-anon';
export const SERVICE_KEY = 'mock-service';

const rid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const rand = (n) => Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

/* ---------- table definitions (columns, keys, defaults) ---------- */
let usageSeq = 0;
const TABLES = {
  schools: { cols: ['id', 'name', 'slug', 'invite_code', 'created_at'], pk: ['id'], unique: [['slug'], ['invite_code']], req: ['name', 'slug'], def: () => ({ id: rid(), invite_code: rand(8), created_at: now() }) },
  profiles: { cols: ['id', 'role', 'display_name', 'username', 'school_id', 'lang', 'created_at'], pk: ['id'], unique: [['username']], req: ['id'], def: () => ({ role: 'student', display_name: '', username: null, school_id: null, lang: 'en', created_at: now() }) },
  classes: { cols: ['id', 'school_id', 'teacher_id', 'name', 'code', 'archived', 'created_at'], pk: ['id'], unique: [['code']], req: ['school_id', 'teacher_id', 'name'], def: () => ({ id: rid(), code: rand(6), archived: false, created_at: now() }) },
  class_members: { cols: ['class_id', 'student_id', 'joined_at'], pk: ['class_id', 'student_id'], unique: [], req: ['class_id', 'student_id'], def: () => ({ joined_at: now() }) },
  docs: { cols: ['user_id', 'id', 'type', 'body', 'updated_at'], pk: ['user_id', 'id'], unique: [], req: ['user_id', 'id', 'type', 'body'], def: () => ({ updated_at: now() }) },
  assignments: { cols: ['id', 'class_id', 'teacher_id', 'kind', 'title', 'config', 'due_at', 'created_at'], pk: ['id'], unique: [], req: ['class_id', 'teacher_id', 'kind', 'title'], def: () => ({ id: rid(), config: {}, due_at: null, created_at: now() }) },
  submissions: { cols: ['id', 'assignment_id', 'student_id', 'doc_id', 'summary', 'created_at'], pk: ['id'], unique: [['assignment_id', 'student_id', 'doc_id']], req: ['assignment_id', 'student_id', 'doc_id'], def: () => ({ id: rid(), summary: {}, created_at: now() }) },
  usage: { cols: ['id', 'user_id', 'kind', 'tier', 'model', 'input_tokens', 'output_tokens', 'cache_read_tokens', 'cost_usd', 'ms', 'doc_id', 'step', 'created_at'], pk: ['id'], unique: [], req: ['user_id', 'kind'], def: () => ({ id: ++usageSeq, tier: null, model: null, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cost_usd: 0, ms: null, doc_id: null, step: null, created_at: now() }) },
};
const VIEW_COLS = ['class_id', 'class_name', 'student_id', 'display_name', 'username', 'joined_at', 'exams_done', 'speeches', 'last_active'];
const CHECKS = {
  profiles: (r) => ['student', 'teacher', 'admin'].includes(r.role) && ['en', 'bg'].includes(r.lang),
  assignments: (r) => ['viva', 'speech'].includes(r.kind),
};
/* Many-to-one embeds supported in select=, e.g. class_members?select=class_id,classes!inner(teacher_id) */
const EMBEDS = { class_members: { classes: ['class_id', 'classes'], profiles: ['student_id', 'profiles'] }, assignments: { classes: ['class_id', 'classes'] }, submissions: { assignments: ['assignment_id', 'assignments'] }, classes: { schools: ['school_id', 'schools'] } };

class PgError extends Error {
  constructor(status, code, message, details = null, hint = null) { super(message); Object.assign(this, { status, code, details, hint }); }
}
const rls = (table) => new PgError(403, '42501', 'new row violates row-level security policy for table "' + table + '"');

const jsonRes = (status, body, headers = {}) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'x-supabase-api-version': '2024-01-01', ...headers } });

export function createMockSupabase() {
  const state = { users: [], schools: [], profiles: [], classes: [], class_members: [], docs: [], assignments: [], submissions: [], usage: [] };
  const tokens = new Map();   // access token -> { userId, sid }
  const refresh = new Map();  // refresh token -> { userId, sid }

  function reset() {
    for (const k of Object.keys(state)) state[k].length = 0;
    tokens.clear(); refresh.clear(); usageSeq = 0;
  }
  function seed() { state.schools.push({ ...TABLES.schools.def(), name: 'Demo School', slug: 'demo-school', invite_code: 'DEMOSCHOOL' }); }
  if (process.env.MOCK_SEED === '1') seed();

  /* ---------- auth ---------- */
  const publicUser = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.created_at, phone: '', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: u.user_metadata, identities: [], created_at: u.created_at, updated_at: u.updated_at });
  function authError(status, errorCode, msg, extra = {}) { return jsonRes(status, { code: errorCode, error_code: errorCode, msg, ...extra }); }
  function session(u, sid = rid()) {
    const iat = Math.floor(Date.now() / 1000), exp = iat + 3600;
    const payload = { aud: 'authenticated', exp, iat, sub: u.id, email: u.email, role: 'authenticated', session_id: sid, app_metadata: {}, user_metadata: u.user_metadata };
    const access = b64url({ alg: 'HS256', typ: 'JWT' }) + '.' + b64url(payload) + '.mock-signature';
    const rt = rid().replace(/-/g, '');
    tokens.set(access, { userId: u.id, sid }); refresh.set(rt, { userId: u.id, sid });
    return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: rt, user: publicUser(u) };
  }
  const userByToken = (t) => { const rec = t && tokens.get(t); return rec ? state.users.find((u) => u.id === rec.userId) || null : null; };

  async function authRoute(req, method, path, url, ctx, body) {
    if (path === '/token' && method === 'POST') {
      const grant = url.searchParams.get('grant_type');
      if (grant === 'password') {
        const email = String(body.email || '').trim().toLowerCase();
        const u = state.users.find((x) => x.email === email);
        /* auth-js turns this 400 into an AuthApiError, so signInWithPassword returns { error } */
        if (!u || u.password !== body.password) return authError(400, 'invalid_credentials', 'Invalid login credentials', { error: 'invalid_grant', error_description: 'Invalid login credentials' });
        return jsonRes(200, session(u));
      }
      if (grant === 'refresh_token') {
        const rec = refresh.get(body.refresh_token);
        const u = rec && state.users.find((x) => x.id === rec.userId);
        if (!u) return authError(400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found');
        refresh.delete(body.refresh_token);
        return jsonRes(200, session(u, rec.sid));
      }
      return authError(400, 'validation_failed', 'unsupported grant_type');
    }
    if (path === '/user' && (method === 'GET' || method === 'PUT')) {
      const u = userByToken(ctx.token);
      if (!u) return jsonRes(401, { code: 401, msg: 'invalid JWT: unable to parse or verify signature, token is malformed' });
      if (method === 'PUT') { if (body.password) u.password = body.password; if (body.data) Object.assign(u.user_metadata, body.data); u.updated_at = now(); }
      return jsonRes(200, publicUser(u));
    }
    if (path === '/logout' && method === 'POST') {
      const rec = tokens.get(ctx.token);
      if (rec) {
        for (const [t, r] of tokens) if (r.sid === rec.sid) tokens.delete(t);
        for (const [t, r] of refresh) if (r.sid === rec.sid) refresh.delete(t);
      }
      return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*' } });
    }
    const m = path.match(/^\/admin\/users(?:\/([^/]+))?$/);
    if (m) {
      if (!ctx.service) return authError(403, 'not_admin', 'User not allowed');
      const id = m[1];
      if (!id && method === 'POST') {
        const email = String(body.email || '').trim().toLowerCase();
        if (!email) return authError(422, 'validation_failed', 'To create a user, email or phone must be provided');
        if (state.users.some((u) => u.email === email)) return authError(422, 'email_exists', 'A user with this email address has already been registered');
        const u = { id: rid(), email, password: body.password || '', user_metadata: body.user_metadata || {}, created_at: now(), updated_at: now() };
        state.users.push(u);
        return jsonRes(200, publicUser(u));
      }
      if (!id && method === 'GET') return jsonRes(200, { users: state.users.map(publicUser), aud: 'authenticated' });
      const u = state.users.find((x) => x.id === id);
      if (!u) return authError(404, 'user_not_found', 'User not found');
      if (method === 'GET') return jsonRes(200, publicUser(u));
      if (method === 'PUT') {
        if (body.password) u.password = body.password;
        if (body.email) u.email = String(body.email).toLowerCase();
        if (body.user_metadata) u.user_metadata = { ...u.user_metadata, ...body.user_metadata };
        u.updated_at = now();
        return jsonRes(200, publicUser(u));
      }
      if (method === 'DELETE') {
        state.users.splice(state.users.indexOf(u), 1);
        for (const [t, r] of tokens) if (r.userId === id) tokens.delete(t);
        for (const [t, r] of refresh) if (r.userId === id) refresh.delete(t);
        removeRows('profiles', (p) => p.id === id); // profiles.id references auth.users on delete cascade
        return jsonRes(200, {});
      }
    }
    return authError(404, 'not_found', 'Not found: ' + method + ' ' + path);
  }

  /* ---------- Row Level Security approximation ---------- */
  const profileOf = (id) => state.profiles.find((p) => p.id === id);
  const mySchool = (c) => (profileOf(c.uid) || {}).school_id || null;
  const myRole = (c) => (profileOf(c.uid) || {}).role || null;
  const classOf = (id) => state.classes.find((x) => x.id === id);
  const teaches = (c, student) => state.class_members.some((m) => m.student_id === student && (classOf(m.class_id) || {}).teacher_id === c.uid);
  const isMember = (c, classId) => state.class_members.some((m) => m.class_id === classId && m.student_id === c.uid);
  const isAdmin = (c) => myRole(c) === 'admin';

  function visible(table, r, c) {
    if (c.service) return true;
    switch (table) {
      case 'schools': return r.id === mySchool(c);
      case 'profiles': return r.id === c.uid || teaches(c, r.id) || (isAdmin(c) && r.school_id === mySchool(c));
      case 'classes': return r.teacher_id === c.uid || isMember(c, r.id) || (isAdmin(c) && r.school_id === mySchool(c));
      case 'class_members': return r.student_id === c.uid || (classOf(r.class_id) || {}).teacher_id === c.uid;
      case 'docs': return r.user_id === c.uid || teaches(c, r.user_id);
      case 'assignments': return r.teacher_id === c.uid || isMember(c, r.class_id);
      case 'submissions': return r.student_id === c.uid || (state.assignments.find((a) => a.id === r.assignment_id) || {}).teacher_id === c.uid;
      case 'usage': return r.user_id === c.uid || teaches(c, r.user_id) || (isAdmin(c) && (profileOf(r.user_id) || {}).school_id === mySchool(c));
    }
    return false;
  }
  /* May this row be written (as it is before an update/delete, or as it will be after an insert/update)? */
  function writable(table, r, c) {
    if (c.service) return true;
    switch (table) {
      case 'profiles': return r.id === c.uid;
      case 'classes': return r.teacher_id === c.uid && r.school_id === mySchool(c) && ['teacher', 'admin'].includes(myRole(c));
      case 'class_members': return r.student_id === c.uid || (classOf(r.class_id) || {}).teacher_id === c.uid;
      case 'docs': return r.user_id === c.uid;
      case 'assignments': return r.teacher_id === c.uid;
      case 'submissions': return r.student_id === c.uid;
    }
    return false; // schools, usage: server only
  }

  function removeRows(table, pred) {
    const gone = [];
    for (let i = state[table].length - 1; i >= 0; i--) if (pred(state[table][i])) gone.unshift(...state[table].splice(i, 1));
    const ids = new Set(gone.map((r) => r.id));
    if (table === 'schools') { removeRows('classes', (r) => ids.has(r.school_id)); for (const p of state.profiles) if (ids.has(p.school_id)) p.school_id = null; }
    if (table === 'profiles') {
      removeRows('docs', (r) => ids.has(r.user_id)); removeRows('classes', (r) => ids.has(r.teacher_id)); removeRows('class_members', (r) => ids.has(r.student_id));
      removeRows('assignments', (r) => ids.has(r.teacher_id)); removeRows('submissions', (r) => ids.has(r.student_id));
    }
    if (table === 'classes') { removeRows('class_members', (r) => ids.has(r.class_id)); removeRows('assignments', (r) => ids.has(r.class_id)); }
    if (table === 'assignments') removeRows('submissions', (r) => ids.has(r.assignment_id));
    return gone;
  }

  /* ---------- query parsing ---------- */
  const splitTop = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } if (cur) out.push(cur); return out; };
  function parseSelect(sel) {
    return splitTop(sel || '*').map((tok) => {
      tok = tok.trim();
      const em = tok.match(/^(?:(\w+):)?(\w+)(?:![\w.]+)?\((.*)\)$/s);
      if (em) return { name: em[2], alias: em[1] || em[2], sub: parseSelect(em[3]), inner: /!inner/.test(tok) };
      const cm = tok.match(/^(?:(\w+):)?([\w*]+)(?:::\w+)?$/);
      return cm ? { name: cm[2], alias: cm[1] || cm[2] } : { name: tok, alias: tok };
    });
  }
  function project(row, items, table, c) {
    const out = {};
    for (const it of items) {
      if (it.name === '*' && !it.sub) Object.assign(out, row);
      else if (it.sub) { const e = (EMBEDS[table] || {})[it.name]; const t = e && state[e[1]].find((x) => x.id === row[e[0]]); out[it.alias] = t && visible(e[1], t, c) ? project(t, it.sub, e[1], c) : null; }
      else if (it.name in row) out[it.alias] = row[it.name];
    }
    return out;
  }
  const getPath = (row, col) => { // "a.b" walks embedded rows, "body->>status" reads a JSON key
    const [base, key] = col.split('->>');
    let v = row;
    for (const k of base.split('.')) v = v == null ? v : v[k];
    return key !== undefined && v != null ? v[key] : v;
  };
  const cmp = (v, a) => (typeof v === 'number' ? v - Number(a) : String(v) < a ? -1 : String(v) > a ? 1 : 0);
  function matches(v, spec) {
    const m = spec.match(/^(not\.)?(\w+)\.(.*)$/s);
    if (!m) throw new PgError(400, 'PGRST100', 'failed to parse filter (' + spec + ')');
    const [, neg, op, arg] = m;
    let r;
    if (op === 'eq') r = v != null && String(v) === arg;
    else if (op === 'neq') r = v != null && String(v) !== arg;
    else if (op === 'gt') r = v != null && cmp(v, arg) > 0;
    else if (op === 'gte') r = v != null && cmp(v, arg) >= 0;
    else if (op === 'lt') r = v != null && cmp(v, arg) < 0;
    else if (op === 'lte') r = v != null && cmp(v, arg) <= 0;
    else if (op === 'is') r = arg === 'null' ? v == null : v === (arg === 'true');
    else if (op === 'in') r = v != null && splitTop(arg.replace(/^\(|\)$/g, '')).map((s) => s.trim().replace(/^"|"$/g, '')).includes(String(v));
    else if (op === 'like' || op === 'ilike') r = v != null && new RegExp('^' + arg.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '%').replace(/%/g, '.*') + '$', op === 'ilike' ? 'is' : 's').test(String(v));
    else throw new PgError(400, 'PGRST100', 'unsupported operator "' + op + '"');
    return neg ? !r : r;
  }
  const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns', 'or', 'and']);
  function filters(params, cols) {
    const fs = [];
    for (const [k, v] of params) {
      if (RESERVED.has(k)) continue;
      const base = k.split('->')[0].split('.')[0];
      if (!k.includes('.') && !k.includes('->') && !cols.includes(base)) throw new PgError(400, '42703', 'column ' + base + ' does not exist');
      fs.push([k, v]);
    }
    return (row) => fs.every(([k, v]) => matches(getPath(row, k), v));
  }
  function order(rows, spec) {
    if (!spec) return rows;
    const keys = spec.split(',').map((s) => { const [col, ...o] = s.split('.'); const desc = o.includes('desc'); return { col, desc, nullsFirst: o.includes('nullsfirst') ? true : o.includes('nullslast') ? false : desc }; });
    return [...rows].sort((a, b) => {
      for (const k of keys) {
        const x = getPath(a, k.col), y = getPath(b, k.col);
        if (x == null || y == null) { if (x == null && y == null) continue; return (x == null) === k.nullsFirst ? -1 : 1; }
        const d = typeof x === 'number' ? x - y : String(x) < String(y) ? -1 : String(x) > String(y) ? 1 : 0;
        if (d) return k.desc ? -d : d;
      }
      return 0;
    });
  }

  /* ---------- the teacher_students view (security_invoker: built from what the caller can see) ---------- */
  function teacherStudents(c) {
    const vis = (t) => state[t].filter((r) => visible(t, r, c));
    const docs = vis('docs'), profiles = vis('profiles'), members = vis('class_members');
    const rows = [];
    for (const cl of vis('classes')) for (const m of members.filter((x) => x.class_id === cl.id)) {
      const p = profiles.find((x) => x.id === m.student_id);
      if (!p) continue;
      const mine = docs.filter((d) => d.user_id === p.id);
      rows.push({ class_id: cl.id, class_name: cl.name, student_id: p.id, display_name: p.display_name, username: p.username, joined_at: m.joined_at,
        exams_done: mine.filter((d) => d.type === 'viva' && d.body && d.body.status === 'done').length, speeches: mine.filter((d) => d.type === 'speech').length,
        last_active: mine.reduce((a, d) => (a == null || d.updated_at > a ? d.updated_at : a), null) });
    }
    return rows;
  }

  /* ---------- writes ---------- */
  function normalize(table, input, c) {
    const T = TABLES[table];
    for (const k of Object.keys(input)) if (!T.cols.includes(k)) throw new PgError(400, 'PGRST204', "Could not find the '" + k + "' column of '" + table + "' in the schema cache");
    return { ...T.def(), ...input };
  }
  function validate(table, row, others, c) {
    const T = TABLES[table];
    for (const k of T.req) if (row[k] == null) throw new PgError(400, '23502', 'null value in column "' + k + '" of relation "' + table + '" violates not-null constraint');
    if (CHECKS[table] && !CHECKS[table](row)) throw new PgError(400, '23514', 'new row for relation "' + table + '" violates check constraint');
    for (const cols of [T.pk, ...T.unique]) {
      if (cols.some((k) => row[k] == null)) continue;
      if (others.some((o) => cols.every((k) => o[k] === row[k]))) throw new PgError(409, '23505', 'duplicate key value violates unique constraint "' + table + '_' + cols.join('_') + '_key"', 'Key (' + cols.join(', ') + ')=(' + cols.map((k) => row[k]).join(', ') + ') already exists.');
    }
    if (table === 'profiles' && !state.users.some((u) => u.id === row.id)) throw new PgError(409, '23503', 'insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"');
  }

  function insertOrUpsert(table, items, params, prefer, c) {
    const out = [];
    const mode = /resolution=merge-duplicates/.test(prefer) ? 'merge' : /resolution=ignore-duplicates/.test(prefer) ? 'ignore' : null;
    const target = (params.get('on_conflict') || '').split(',').filter(Boolean);
    const conflictCols = target.length ? target : TABLES[table].pk;
    for (const item of items) {
      if (!item || typeof item !== 'object') throw new PgError(400, 'PGRST102', 'All object keys must match');
      const row = normalize(table, item, c);
      const existing = mode && state[table].find((o) => conflictCols.every((k) => o[k] === row[k] && row[k] != null));
      if (existing) {
        if (mode === 'ignore') continue;
        if (!writable(table, existing, c) || !writable(table, { ...existing, ...item }, c)) throw rls(table);
        const merged = { ...existing, ...item };
        validate(table, merged, state[table].filter((o) => o !== existing), c);
        if (table === 'docs') merged.updated_at = now();
        Object.assign(existing, merged); out.push(existing);
        continue;
      }
      if (!writable(table, row, c)) throw rls(table);
      validate(table, row, state[table], c);
      state[table].push(row); out.push(row);
    }
    return out;
  }

  function rpc(name, args, c) {
    if (!c.service && !c.uid) throw new PgError(401, '42501', 'permission denied for function ' + name);
    const uid = c.uid || null;
    if (name === 'my_role') return myRole(c);
    if (name === 'my_school') return mySchool(c);
    if (name === 'teaches') return teaches(c, args.student);
    if (name === 'join_class') {
      const cls = state.classes.find((x) => x.code === String(args.p_code || '').trim().toUpperCase() && !x.archived);
      if (!cls) return null;
      if (!state.class_members.some((m) => m.class_id === cls.id && m.student_id === uid)) {
        const row = { ...TABLES.class_members.def(), class_id: cls.id, student_id: uid };
        if (uid) state.class_members.push(row);
      }
      return cls.id;
    }
    throw new PgError(404, 'PGRST202', 'Could not find the function public.' + name + ' in the schema cache');
  }

  async function restRoute(req, method, path, url, c, body) {
    const params = url.searchParams, prefer = req.headers.get('prefer') || '';
    const wantRows = /return=representation/.test(prefer);
    const single = /vnd\.pgrst\.object\+json/.test(req.headers.get('accept') || '');
    const name = path.replace(/^\//, '').split('/');
    if (name[0] === 'rpc') {
      if (method !== 'POST' && method !== 'GET') throw new PgError(405, 'PGRST101', 'Only GET and POST are allowed on functions');
      const result = rpc(name[1], method === 'GET' ? Object.fromEntries(params) : body || {}, c);
      return jsonRes(200, result);
    }
    const table = name[0];
    const isView = table === 'teacher_students';
    if (!isView && !TABLES[table]) throw new PgError(404, 'PGRST205', "Could not find the table 'public." + table + "' in the schema cache");
    if (!c.service && !c.uid) throw new PgError(401, '42501', 'permission denied for table ' + table);
    if (isView && method !== 'GET') throw new PgError(405, '42809', 'cannot change view "teacher_students"');
    const cols = isView ? VIEW_COLS : TABLES[table].cols;
    const where = filters(params, cols);
    const items = parseSelect(params.get('select'));
    const embedAll = (r) => { // make embedded rows available to filters like classes.teacher_id=eq.x
      const x = { ...r };
      for (const it of items) if (it.sub) { const e = (EMBEDS[table] || {})[it.name]; const t = e && state[e[1]].find((y) => y.id === r[e[0]]); x[it.name] = t && visible(e[1], t, c) ? t : null; }
      return x;
    };
    const finish = (rows, status) => {
      let rs = rows;
      if (params.has('select') || wantRows || method === 'GET') rs = rows.map((r) => project(r, items, table, c));
      if (single) {
        if (rs.length !== 1) return jsonRes(406, { code: 'PGRST116', details: 'The result contains ' + rs.length + ' rows', hint: null, message: 'Cannot coerce the result to a single JSON object' });
        return jsonRes(status, rs[0]);
      }
      return jsonRes(status, rs);
    };
    const pool = () => (isView ? teacherStudents(c) : state[table].filter((r) => visible(table, r, c)));
    const select = () => {
      let rows = pool().filter((r) => { const e = embedAll(r); return where(e) && items.every((it) => !it.inner || e[it.name]); });
      rows = order(rows, params.get('order'));
      const off = Number(params.get('offset') || 0), lim = params.has('limit') ? Number(params.get('limit')) : Infinity;
      return rows.slice(off, off + lim);
    };

    if (method === 'GET' || method === 'HEAD') { const rows = select(); return method === 'HEAD' ? jsonRes(200) : finish(rows, 200); }
    if (method === 'POST') {
      const list = Array.isArray(body) ? body : [body];
      const done = insertOrUpsert(table, list, params, prefer, c);
      return wantRows ? finish(done, 201) : jsonRes(201, undefined);
    }
    /* PATCH and DELETE touch only rows the caller can see AND write, like RLS "using" clauses. */
    const real = select().filter((r) => writable(table, r, c));
    if (method === 'PATCH') {
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PgError(400, 'PGRST102', 'Empty or invalid json');
      for (const k of Object.keys(body)) if (!TABLES[table].cols.includes(k)) throw new PgError(400, 'PGRST204', "Could not find the '" + k + "' column of '" + table + "' in the schema cache");
      for (const r of real) {
        const next = { ...r, ...body };
        if (table === 'docs') next.updated_at = now();
        if (!writable(table, next, c) || (!c.service && table === 'profiles' && next.role !== r.role)) throw rls(table);
        validate(table, next, state[table].filter((o) => o !== r), c);
        Object.assign(r, next);
      }
      return wantRows ? finish(real, 200) : jsonRes(204, undefined);
    }
    if (method === 'DELETE') {
      const gone = removeRows(table, (r) => real.includes(r));
      return wantRows ? finish(gone, 200) : jsonRes(204, undefined);
    }
    throw new PgError(405, 'PGRST101', 'Method not allowed');
  }

  /* ---------- entry point ---------- */
  async function handle(request, prefix = '/mock-supabase') {
    const url = new URL(request.url);
    if (url.pathname !== prefix && !url.pathname.startsWith(prefix + '/')) return null;
    const path = url.pathname.slice(prefix.length) || '/';
    const method = request.method.toUpperCase();
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });

    const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim() || null;
    const key = request.headers.get('apikey') || bearer;
    if (key !== ANON_KEY && key !== SERVICE_KEY) return jsonRes(401, { message: 'Invalid API key', hint: 'Use mock-anon or mock-service' });
    const ctx = { token: bearer, service: key === SERVICE_KEY && (bearer === null || bearer === SERVICE_KEY), uid: null };
    const user = userByToken(bearer);
    if (user) ctx.uid = user.id;

    const text = await request.text();
    let body = {};
    if (text) { try { body = JSON.parse(text); } catch { return jsonRes(400, { code: 'PGRST102', message: 'Empty or invalid json', details: null, hint: null }); } }
    try {
      if (path.startsWith('/auth/v1/')) return await authRoute(request, method, path.slice('/auth/v1'.length), url, ctx, body);
      if (path.startsWith('/rest/v1/')) return await restRoute(request, method, path.slice('/rest/v1'.length), url, ctx, body);
      return jsonRes(404, { message: 'mock-supabase: unsupported path ' + path });
    } catch (e) {
      if (e instanceof PgError) return jsonRes(e.status, { code: e.code, message: e.message, details: e.details, hint: e.hint });
      console.error(e);
      return jsonRes(500, { code: 'XX000', message: String(e && e.message || e), details: null, hint: null });
    }
  }

  return { handle, reset, seed, state };
}

/* Point the server-side env at the mock when MOCK_SUPABASE=1 and no real Supabase is configured. */
export function installMockEnv(port) {
  if (process.env.MOCK_SUPABASE !== '1' || process.env.SUPABASE_URL) return false;
  process.env.SUPABASE_URL = 'http://localhost:' + port + '/mock-supabase';
  process.env.SUPABASE_ANON_KEY = ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
  return true;
}
