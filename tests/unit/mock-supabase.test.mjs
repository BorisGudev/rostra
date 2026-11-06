import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { createMockSupabase, installMockEnv } from '../../scripts/mock-supabase.mjs';

const PREFIX = '/mock-supabase';

test('handle() directly: prefix, keys, token endpoint', async () => {
  const mock = createMockSupabase();
  const call = (path, init = {}) => mock.handle(new Request('http://x' + PREFIX + path, init), PREFIX);
  assert.equal(await mock.handle(new Request('http://x/other'), PREFIX), null);
  assert.equal((await call('/rest/v1/docs', { headers: { apikey: 'nope' } })).status, 401);
  const bad = await call('/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: 'mock-anon' }, body: JSON.stringify({ email: 'a@b.co', password: 'x' }) });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error_description, 'Invalid login credentials');
  const anonRead = await call('/rest/v1/docs', { headers: { apikey: 'mock-anon', authorization: 'Bearer mock-anon' } });
  assert.equal(anonRead.status, 401);
  assert.equal(installMockEnv(1234), process.env.MOCK_SUPABASE === '1' && !process.env.SUPABASE_URL);
});

test('through the real supabase-js client', async (t) => {
  const mock = createMockSupabase();
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);
    const r = await mock.handle(new Request('http://localhost' + req.url, { method: req.method, headers: req.headers, body }), PREFIX);
    if (!r) { res.writeHead(404).end(); return; }
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
  });
  await new Promise((ok) => server.listen(0, ok));
  t.after(() => server.close());
  const url = `http://localhost:${server.address().port}${PREFIX}`;
  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, 'mock-service', opts);
  const newClient = () => createClient(url, 'mock-anon', opts);

  const mkUser = async (email, role, extra = {}) => {
    const c = await admin.auth.admin.createUser({ email, password: 'password123', email_confirm: true, user_metadata: { role } });
    assert.ifError(c.error);
    const p = await admin.from('profiles').upsert({ id: c.data.user.id, role, display_name: email.split('@')[0], ...extra });
    assert.ifError(p.error);
    return c.data.user;
  };
  const school = await admin.from('schools').insert({ name: 'S', slug: 's' }).select('id, invite_code').single();
  assert.ifError(school.error);
  assert.equal(school.data.invite_code.length, 8);
  const teacher = await mkUser('t@example.com', 'teacher', { school_id: school.data.id });
  const student = await mkUser('s@example.com', 'student', { username: 'stu', school_id: school.data.id });
  const other = await mkUser('o@example.com', 'student', { username: 'oth' });

  const dup = await admin.auth.admin.createUser({ email: 't@example.com', password: 'password123' });
  assert.match(dup.error.message, /already/i);

  const wrong = await newClient().auth.signInWithPassword({ email: 's@example.com', password: 'bad' });
  assert.ok(wrong.error);
  const sc = newClient();
  const login = await sc.auth.signInWithPassword({ email: 's@example.com', password: 'password123' });
  assert.ifError(login.error);
  assert.equal((await sc.auth.getUser()).data.user.id, student.id);
  assert.equal((await sc.auth.getSession()).data.session.user.email, 's@example.com');

  // student docs: upsert twice (same key replaces), only own rows come back
  assert.ifError((await sc.from('docs').upsert({ user_id: student.id, id: 'a', type: 'speech', body: { v: 1 } }, { onConflict: 'user_id,id' })).error);
  assert.ifError((await sc.from('docs').upsert({ user_id: student.id, id: 'b', type: 'viva', body: { status: 'done' } }, { onConflict: 'user_id,id' })).error);
  assert.ifError((await sc.from('docs').upsert({ user_id: student.id, id: 'a', type: 'speech', body: { v: 2 } }, { onConflict: 'user_id,id' })).error);
  await admin.from('docs').insert({ user_id: other.id, id: 'z', type: 'speech', body: {} });
  const docs = await sc.from('docs').select('id, body').eq('user_id', student.id).order('id');
  assert.deepEqual(docs.data, [{ id: 'a', body: { v: 2 } }, { id: 'b', body: { status: 'done' } }]);
  assert.equal((await sc.from('docs').select('id')).data.length, 2); // RLS hides other's doc
  const forged = await sc.from('docs').upsert({ user_id: other.id, id: 'x', type: 'speech', body: {} });
  assert.equal(forged.error.code, '42501');

  // teacher makes a class; student joins by code
  const tc = newClient();
  assert.ifError((await tc.auth.signInWithPassword({ email: 't@example.com', password: 'password123' })).error);
  const cls = await tc.from('classes').insert({ school_id: school.data.id, teacher_id: teacher.id, name: '9B' }).select().single();
  assert.ifError(cls.error);
  assert.match(cls.data.code, /^[A-Z0-9]{6}$/);
  assert.equal((await tc.from('docs').select('id')).data.length, 0); // not yet a teacher of anyone
  const joined = await sc.rpc('join_class', { p_code: cls.data.code.toLowerCase() });
  assert.equal(joined.data, cls.data.id);
  assert.equal((await sc.rpc('join_class', { p_code: 'NOPE00' })).data, null);

  const seen = await tc.from('docs').select('user_id, id');
  assert.equal(seen.data.length, 2);
  assert.ok(seen.data.every((d) => d.user_id === student.id));
  const ts = await tc.from('teacher_students').select('*');
  assert.ifError(ts.error);
  assert.equal(ts.data.length, 1);
  assert.equal(ts.data[0].student_id, student.id);
  assert.equal(ts.data[0].exams_done, 1);
  assert.equal(ts.data[0].speeches, 1);
  assert.equal((await tc.from('profiles').select('id').eq('id', student.id).maybeSingle()).data.id, student.id);
  assert.equal((await newClient().from("teacher_students").select("*")).error.code, "42501"); // no session: refused

  // maybeSingle: no row -> null, no error; single -> error
  const none = await sc.from('profiles').select('id').eq('id', '00000000-0000-0000-0000-000000000000').maybeSingle();
  assert.equal(none.data, null); assert.equal(none.error, null);
  const strict = await sc.from('profiles').select('id').eq('id', '00000000-0000-0000-0000-000000000000').single();
  assert.equal(strict.error.code, 'PGRST116');

  // server-side account helpers: update password, profile update, delete
  assert.ifError((await admin.auth.admin.updateUserById(student.id, { password: 'newpassword1' })).error);
  assert.ok((await newClient().auth.signInWithPassword({ email: 's@example.com', password: 'password123' })).error);
  assert.ifError((await sc.from('profiles').update({ lang: 'bg' }).eq('id', student.id)).error);
  assert.equal((await admin.from('profiles').select('lang').eq('id', student.id).single()).data.lang, 'bg');
  assert.ok((await sc.from('profiles').update({ role: 'admin' }).eq('id', student.id)).error);
  assert.ifError((await admin.auth.admin.deleteUser(student.id)).error);
  assert.equal(mock.state.docs.filter((d) => d.user_id === student.id).length, 0);
  assert.equal(mock.state.class_members.length, 0);
  assert.ifError((await sc.auth.signOut()).error);
  mock.reset();
  assert.equal(mock.state.users.length, 0);
});
