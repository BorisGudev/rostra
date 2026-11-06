/* Row Level Security, checked against a real Postgres.
   The policies in supabase/migrations/0001_init.sql are the security boundary of the whole product (the browser talks to
   Supabase directly), so they are tested here on Postgres itself, with a stub of Supabase's auth.uid().
   Where the database comes from: ROSTRA_TEST_PG=postgres://... (CI uses a postgres service), else a throwaway cluster
   made with initdb in a temp directory (needs the postgres binaries; as root they run as the `postgres` OS user).
   Without either the suite is skipped with a notice, never silently. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, chmodSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIGRATION = path.join(ROOT, 'supabase', 'migrations', '0001_init.sql');
const BIN = ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/17/bin', '/usr/lib/postgresql/15/bin', '/usr/local/pgsql/bin', '/opt/homebrew/opt/postgresql@16/bin'].find((d) => existsSync(path.join(d, 'initdb')));
const asUser = process.getuid && process.getuid() === 0 ? 'postgres' : null; // initdb refuses to run as root

function run(cmd, args, opts = {}) {
  const full = asUser && !opts.noSu ? ['runuser', ['-u', asUser, '--', cmd, ...args]] : [cmd, args];
  const r = spawnSync(full[0], full[1], { encoding: 'utf8', input: opts.input, env: { ...process.env, ...(opts.env || {}) } });
  return r;
}

let db = null; // { url } or { dir, sock, port }
let psqlArgs = [];
function startCluster() {
  if (process.env.ROSTRA_TEST_PG) { psqlArgs = [process.env.ROSTRA_TEST_PG]; return true; }
  if (!BIN) return false;
  const dir = mkdtempSync(path.join(tmpdir(), 'rostra-pg-'));
  chmodSync(dir, 0o777);
  const data = path.join(dir, 'data'), sock = dir, port = 54000 + Math.floor(Math.random() * 1000);
  let r = run(path.join(BIN, 'initdb'), ['-D', data, '-U', 'postgres', '-A', 'trust', '--no-sync', '-E', 'UTF8']);
  if (r.status !== 0) { console.log('initdb failed:', (r.stderr || r.stdout || '').trim().split('\n').slice(-3).join(' | ')); rmSync(dir, { recursive: true, force: true }); return false; }
  r = run(path.join(BIN, 'pg_ctl'), ['-D', data, '-o', `-p ${port} -k ${sock} -c listen_addresses='' -c fsync=off`, '-l', path.join(dir, 'log'), '-w', 'start']);
  if (r.status !== 0) { console.log('pg_ctl failed:', (r.stderr || r.stdout || '').trim()); rmSync(dir, { recursive: true, force: true }); return false; }
  db = { dir, data, sock, port };
  psqlArgs = ['-h', sock, '-p', String(port), '-U', 'postgres', 'postgres'];
  return true;
}
function stopCluster() {
  if (!db) return;
  run(path.join(BIN, 'pg_ctl'), ['-D', db.data, '-m', 'immediate', '-w', 'stop']);
  rmSync(db.dir, { recursive: true, force: true });
}

/* Run SQL as the server (superuser) or as a signed-in user. Returns stdout rows (tab-separated) or throws with Postgres's message. */
function sql(text, as) {
  const prelude = as ? `set role authenticated; select set_config('request.jwt.claim.sub', '${as}', false) \\gset ignored_\n` : '';
  const r = run('psql', [...psqlArgs, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1'], { input: prelude + text, env: { PGOPTIONS: '-c client_min_messages=warning' } });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || '').trim());
  return r.stdout.split('\n').filter(Boolean).filter((l) => l !== 'SET' && l !== 'set_config' && l.trim() !== '');
}
const rows = (text, as) => sql(text, as).filter((l) => !/^(SET|set_config)$/.test(l));
const denied = (text, as, re) => {
  let err = null;
  try { sql(text, as); } catch (e) { err = e; }
  assert.ok(err, 'expected the database to refuse: ' + text);
  if (re) assert.match(err.message, re);
};

/* Fixed ids make the assertions readable. */
const U = {
  teacher1: '00000000-0000-4000-8000-000000000001', teacher2: '00000000-0000-4000-8000-000000000002',
  student1: '00000000-0000-4000-8000-000000000011', student2: '00000000-0000-4000-8000-000000000012',
  admin: '00000000-0000-4000-8000-000000000099',
};
const C = { class1: '10000000-0000-4000-8000-000000000001', class2: '10000000-0000-4000-8000-000000000002' };
const A = { a1: '20000000-0000-4000-8000-000000000001', a2: '20000000-0000-4000-8000-000000000002' };
const SCHOOL = '30000000-0000-4000-8000-000000000001', OTHER_SCHOOL = '30000000-0000-4000-8000-000000000002';

const ready = startCluster();
if (!ready) console.log('rls.test: no Postgres available (set ROSTRA_TEST_PG or install postgresql); skipping the RLS suite');

test('Row Level Security on real Postgres', { skip: !ready }, async (t) => {
  t.after(stopCluster);

  await t.test('the migration applies, and applies again', () => {
    /* What Supabase provides: the authenticated role, auth.users and auth.uid(). The stub reads a session setting. */
    sql(`
      create role authenticated nologin;
      create role anon nologin;
      create role service_role nologin;
      create schema if not exists auth;
      create table if not exists auth.users (id uuid primary key, email text);
      create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create or replace function auth.role() returns text language sql stable as $$ select 'authenticated' $$;
      grant usage on schema public to authenticated;
      alter default privileges in schema public grant all on tables to authenticated;
      alter default privileges in schema public grant all on sequences to authenticated;
      alter default privileges in schema public grant execute on functions to authenticated;
    `);
    const migration = readFileSync(MIGRATION, 'utf8');
    sql(migration);
    sql(migration); // every statement is idempotent
  });

  await t.test('seed two teachers, two students, two classes, one assignment each', () => {
    sql(`
      insert into public.schools (id, name, slug, invite_code) values ('${SCHOOL}', 'Test school', 'test', 'TEST1234'), ('${OTHER_SCHOOL}', 'Other', 'other', 'OTHER123');
      insert into auth.users (id) values ('${U.teacher1}'), ('${U.teacher2}'), ('${U.student1}'), ('${U.student2}'), ('${U.admin}');
      insert into public.profiles (id, role, display_name, username, school_id) values
        ('${U.teacher1}', 'teacher', 'Teacher One', null, '${SCHOOL}'),
        ('${U.teacher2}', 'teacher', 'Teacher Two', null, '${SCHOOL}'),
        ('${U.student1}', 'student', 'Student One', 'student1', '${SCHOOL}'),
        ('${U.student2}', 'student', 'Student Two', 'student2', '${SCHOOL}'),
        ('${U.admin}', 'admin', 'Admin', null, '${SCHOOL}');
      insert into public.classes (id, school_id, teacher_id, name, code) values
        ('${C.class1}', '${SCHOOL}', '${U.teacher1}', 'Class One', 'CLASS1'),
        ('${C.class2}', '${SCHOOL}', '${U.teacher2}', 'Class Two', 'CLASS2');
      insert into public.class_members (class_id, student_id) values ('${C.class1}', '${U.student1}'), ('${C.class2}', '${U.student2}');
      insert into public.assignments (id, class_id, teacher_id, kind, title) values
        ('${A.a1}', '${C.class1}', '${U.teacher1}', 'viva', 'Exam one'),
        ('${A.a2}', '${C.class2}', '${U.teacher2}', 'speech', 'Speech two');
      insert into public.docs (user_id, id, type, body) values
        ('${U.student1}', 'doc-s1', 'viva', '{"status":"done"}'), ('${U.student2}', 'doc-s2', 'viva', '{"status":"done"}');
      insert into public.usage (user_id, kind, cost_usd) values ('${U.student1}', 'ai', 0.1), ('${U.student2}', 'ai', 0.2);
    `);
  });

  await t.test('a teacher reads their class, members and students without a recursion error', () => {
    assert.deepEqual(rows(`select name from public.classes order by name`, U.teacher1), ['Class One']);
    assert.deepEqual(rows(`select student_id from public.class_members`, U.teacher1), [U.student1]);
    assert.deepEqual(rows(`select display_name from public.profiles where id <> '${U.teacher1}' order by 1`, U.teacher1), ['Student One']);
    assert.deepEqual(rows(`select id from public.docs order by 1`, U.teacher1), ['doc-s1']);
    assert.deepEqual(rows(`select title from public.assignments`, U.teacher1), ['Exam one']);
    assert.deepEqual(rows(`select display_name, exams_done from public.teacher_students`, U.teacher1), ['Student One|1']);
    assert.deepEqual(rows(`select cost_usd from public.usage`, U.teacher1), ['0.100000']);
  });

  await t.test('a teacher cannot add members, set work for another class, or read another class', () => {
    denied(`insert into public.class_members (class_id, student_id) values ('${C.class1}', '${U.student2}')`, U.teacher1, /row-level security/);
    denied(`insert into public.assignments (class_id, teacher_id, kind, title) values ('${C.class2}', '${U.teacher1}', 'viva', 'Sneaky')`, U.teacher1, /row-level security/);
    assert.deepEqual(rows(`select count(*) from public.classes where id = '${C.class2}'`, U.teacher1), ['0']);
    assert.deepEqual(rows(`select count(*) from public.submissions`, U.teacher1), ['0']);
    /* removing a student from their own class is allowed */
    sql(`insert into public.class_members (class_id, student_id) values ('${C.class1}', '${U.student2}')`);
    assert.deepEqual(rows(`delete from public.class_members where class_id = '${C.class1}' and student_id = '${U.student2}' returning student_id`, U.teacher1), [U.student2]);
    assert.deepEqual(rows(`select count(*) from public.class_members where class_id = '${C.class1}'`), ['1']);
  });

  await t.test('a student sees only their own class and its assignments', () => {
    assert.deepEqual(rows(`select name from public.classes`, U.student1), ['Class One']);
    assert.deepEqual(rows(`select title from public.assignments`, U.student1), ['Exam one']);
    assert.deepEqual(rows(`select id from public.docs`, U.student1), ['doc-s1']);
    assert.deepEqual(rows(`select count(*) from public.profiles`, U.student1), ['1']);
    assert.deepEqual(rows(`select count(*) from public.class_members`, U.student1), ['1']);
  });

  await t.test('a student submits only their own work, only for their own class', () => {
    assert.deepEqual(rows(`insert into public.submissions (assignment_id, student_id, doc_id, summary) values ('${A.a1}', '${U.student1}', 'doc-s1', '{"percent":70}') returning doc_id`, U.student1), ['doc-s1']);
    denied(`insert into public.submissions (assignment_id, student_id, doc_id) values ('${A.a2}', '${U.student1}', 'doc-s1')`, U.student1, /row-level security/);
    denied(`insert into public.submissions (assignment_id, student_id, doc_id) values ('${A.a1}', '${U.student2}', 'doc-s2')`, U.student1, /row-level security/);
    /* the upsert the app uses (insert ... on conflict do update) is allowed for the student's own row */
    sql(`insert into public.submissions (assignment_id, student_id, doc_id, summary) values ('${A.a1}', '${U.student1}', 'doc-s1', '{"percent":80}') on conflict (assignment_id, student_id, doc_id) do update set summary = excluded.summary`, U.student1);
    assert.deepEqual(rows(`select summary->>'percent' from public.submissions`, U.student1), ['80']);
    /* the teacher who set the work sees it; the other teacher does not */
    assert.deepEqual(rows(`select summary->>'percent' from public.submissions`, U.teacher1), ['80']);
    assert.deepEqual(rows(`select count(*) from public.submissions`, U.teacher2), ['0']);
  });

  await t.test('a student cannot join a class by id, change their role, school or username, or touch others', () => {
    denied(`insert into public.class_members (class_id, student_id) values ('${C.class2}', '${U.student1}')`, U.student1, /row-level security/);
    denied(`update public.profiles set role = 'teacher' where id = '${U.student1}'`, U.student1, /row-level security/);
    denied(`update public.profiles set school_id = '${OTHER_SCHOOL}' where id = '${U.student1}'`, U.student1, /row-level security/);
    denied(`update public.profiles set username = 'teacher' where id = '${U.student1}'`, U.student1, /row-level security/);
    assert.deepEqual(rows(`update public.profiles set display_name = 'Renamed', lang = 'bg' where id = '${U.student1}' returning display_name`, U.student1), ['Renamed']);
    assert.deepEqual(rows(`update public.docs set body = '{}' where user_id = '${U.student2}' returning id`, U.student1), []);
    assert.deepEqual(rows(`delete from public.classes returning id`, U.student1), []);
    denied(`insert into public.usage (user_id, kind) values ('${U.student1}', 'ai')`, U.student1, /row-level security/);
  });

  await t.test('joining with a class code goes through join_class()', () => {
    assert.deepEqual(rows(`select public.join_class('class2')`, U.student1), [C.class2]);
    assert.deepEqual(rows(`select public.join_class('NOPE99') is null`, U.student1), ['t']);
    assert.deepEqual(rows(`select name from public.classes order by name`, U.student1), ['Class One', 'Class Two']);
    /* a teacher is not a student and does not join */
    assert.deepEqual(rows(`select public.join_class('class2') is null`, U.teacher1), ['t']);
    /* now teacher two sees student one too */
    assert.deepEqual(rows(`select display_name from public.teacher_students order by 1`, U.teacher2), ['Renamed', 'Student Two']);
    /* and student one may leave */
    assert.deepEqual(rows(`delete from public.class_members where class_id = '${C.class2}' returning class_id`, U.student1), [C.class2]);
  });

  await t.test('an admin reads the school, its people and its usage, nothing more', () => {
    assert.deepEqual(rows(`select count(*) from public.profiles`, U.admin), ['5']);
    assert.deepEqual(rows(`select count(*) from public.classes`, U.admin), ['2']);
    assert.deepEqual(rows(`select sum(cost_usd) from public.usage`, U.admin), ['0.300000']);
    assert.deepEqual(rows(`select count(*) from public.docs`, U.admin), ['0']);
    assert.deepEqual(rows(`select name from public.schools`, U.admin), ['Test school']);
  });
});
