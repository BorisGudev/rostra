/* POST /api/account: the few account actions that need the server's service-role key.
   { action: 'signup', kind: 'student', classCode, displayName, username, password, lang }
   { action: 'signup', kind: 'teacher', inviteCode, email, displayName, password, lang }
   { action: 'resolve', username }                  -> { email } so a student can sign in with a username
   { action: 'delete' }                             -> removes the signed-in user's work and account
   { action: 'reset', username, newPassword }       -> teachers reset a student's password in their class (admins: in their school)
   { action: 'create-school', name }                -> the Rostra admin makes a school and gets its invite code
   Students never give an email: the account is created with a synthetic address and no mail is sent.
   Collecting less from minors is the point (GDPR data minimisation). */
import { SUPABASE, fail, json } from '../lib/env.mjs';
import { identify, serviceDb } from '../lib/auth.mjs';

export const config = { path: '/api/account' };

const STUDENT_DOMAIN = process.env.ROSTRA_STUDENT_DOMAIN || 'students.rostra.invalid';
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 60);
const cleanUser = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
const okPassword = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 200;
const studentEmail = (username) => `${username}@${STUDENT_DOMAIN}`;
const ADMIN_EMAILS = String(process.env.ROSTRA_ADMIN_EMAILS || '').toLowerCase().split(/[,\s]+/).filter(Boolean);
const ADMIN_SETUP_CODE = String(process.env.ROSTRA_ADMIN_SETUP_CODE || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/* Sign-ups per IP address, in this function instance: a slow guard against someone scripting account creation.
   Netlify starts instances as needed, so this is a brake, not a wall; the class and invite codes are the real gate. */
const signups = new Map(); // ip -> [timestamps]
const SIGNUPS_PER_HOUR = Number(process.env.ROSTRA_SIGNUPS_PER_HOUR) || 20;
function tooManySignups(ip) {
  const now = Date.now(), recent = (signups.get(ip) || []).filter((t) => now - t < 3600 * 1000);
  recent.push(now); signups.set(ip, recent);
  if (signups.size > 5000) signups.clear();
  return recent.length > SIGNUPS_PER_HOUR;
}
const clientIp = (req, context) => context.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown';

export default async (req, context) => {
  if (req.method !== 'POST') return fail('method', 'POST only', 405);
  const db = serviceDb();
  if (!db || !SUPABASE.configured) return fail('unavailable', 'Accounts are not set up on this server yet.', 503);
  let body;
  try { body = await req.json(); } catch (e) { return fail('bad_request', 'Body must be JSON'); }
  const action = String(body.action || '');

  if (action === 'resolve') {
    const username = cleanUser(body.username);
    if (!username) return fail('bad_request', 'Username needed');
    const { data } = await db.from('profiles').select('id').eq('username', username).maybeSingle();
    /* Always answer with the synthetic address: a wrong username then fails at sign-in, which does not reveal who exists. */
    return json({ email: data ? studentEmail(username) : studentEmail(username) });
  }

  if (action === 'signup') {
    if (tooManySignups(clientIp(req, context))) return fail('rate_limited', 'Too many sign-ups from this connection. Try again in an hour.', 429);
    const lang = body.lang === 'bg' ? 'bg' : 'en';
    const displayName = cleanName(body.displayName);
    const password = body.password;
    if (!displayName) return fail('bad_request', 'A display name is needed.');
    if (!okPassword(password)) return fail('weak_password', 'Use a password of at least 8 characters.');
    if (body.kind === 'student') {
      const username = cleanUser(body.username);
      if (username.length < 3) return fail('bad_request', 'Pick a username of at least 3 letters or digits.');
      const code = String(body.classCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const { data: cls } = await db.from('classes').select('id, school_id, archived').eq('code', code).maybeSingle();
      if (!cls || cls.archived) return fail('bad_code', 'That class code is not right. Ask your teacher for the code.');
      const { data: taken } = await db.from('profiles').select('id').eq('username', username).maybeSingle();
      if (taken) return fail('taken', 'That username is taken. Try another.');
      const email = studentEmail(username);
      const created = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: 'student', display_name: displayName, username, lang } });
      if (created.error) return fail('signup_failed', created.error.message, 400);
      const uid = created.data.user.id;
      const prof = await db.from('profiles').upsert({ id: uid, role: 'student', display_name: displayName, username, school_id: cls.school_id, lang });
      if (prof.error) return fail('signup_failed', prof.error.message, 500);
      await db.from('class_members').insert({ class_id: cls.id, student_id: uid });
      return json({ ok: true, email, role: 'student' });
    }
    if (body.kind === 'teacher') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('bad_request', 'A real email address is needed.');
      const code = String(body.inviteCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      /* The Rostra admin (ROSTRA_ADMIN_EMAILS) joins with the private set-up code, not a school's invite code, and gets
         the admin role. Nobody else can take an admin's email, so a school invite code never makes an impostor admin. */
      const isAdminEmail = ADMIN_EMAILS.includes(email);
      const asAdmin = isAdminEmail && ADMIN_SETUP_CODE && code === ADMIN_SETUP_CODE;
      if (isAdminEmail && !asAdmin) return fail('reserved', 'That email address is reserved. Use the Rostra set-up code to join.', 403);
      let school = null;
      if (!asAdmin) {
        school = (await db.from('schools').select('id').eq('invite_code', code).maybeSingle()).data;
        if (!school) return fail('bad_code', 'That invite code is not right. Ask your school’s Rostra contact.');
      }
      const role = asAdmin ? 'admin' : 'teacher';
      const created = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role, display_name: displayName, lang } });
      if (created.error) return fail('signup_failed', /already/i.test(created.error.message) ? 'An account with that email already exists. Sign in instead.' : created.error.message, 400);
      const uid = created.data.user.id;
      const prof = await db.from('profiles').upsert({ id: uid, role, display_name: displayName, school_id: school ? school.id : null, lang });
      if (prof.error) return fail('signup_failed', prof.error.message, 500);
      return json({ ok: true, email, role });
    }
    return fail('bad_request', 'Unknown sign-up kind');
  }

  /* Everything below needs a signed-in caller. */
  const user = await identify(req, context);
  if (!user || user.anon) return fail('not_granted', 'Sign in first.', 401);

  if (action === 'delete') {
    /* Remove the person's work, memberships and profile, then the login itself. Usage rows keep only the id. */
    await db.from('docs').delete().eq('user_id', user.id);
    await db.from('submissions').delete().eq('student_id', user.id);
    await db.from('class_members').delete().eq('student_id', user.id);
    if (user.role === 'teacher') await db.from('classes').delete().eq('teacher_id', user.id);
    await db.from('profiles').delete().eq('id', user.id);
    const r = await db.auth.admin.deleteUser(user.id);
    if (r.error) return fail('delete_failed', r.error.message, 500);
    return json({ ok: true });
  }

  if (action === 'reset') {
    if (!['teacher', 'admin'].includes(user.role)) return fail('not_granted', 'Only teachers can reset passwords.', 403);
    const username = cleanUser(body.username);
    if (!okPassword(body.newPassword)) return fail('weak_password', 'Use a password of at least 8 characters.');
    const { data: student } = await db.from('profiles').select('id, school_id').eq('username', username).maybeSingle();
    if (!student) return fail('not_found', 'No student with that username.');
    const { data: mine } = await db.from('class_members').select('class_id, classes!inner(teacher_id)').eq('student_id', student.id).eq('classes.teacher_id', user.id);
    const inMySchool = user.role === 'admin' && user.schoolId && student.school_id === user.schoolId;
    if (!inMySchool && (!mine || !mine.length)) return fail('not_granted', 'That student is not in one of your classes.', 403);
    const r = await db.auth.admin.updateUserById(student.id, { password: body.newPassword });
    if (r.error) return fail('reset_failed', r.error.message, 500);
    return json({ ok: true });
  }

  if (action === 'create-school') {
    /* The Rostra admin (admin role in the profile row, and an address in ROSTRA_ADMIN_EMAILS) creates schools and gets the invite code. */
    if (user.role !== 'admin' || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) return fail('not_granted', 'Only the Rostra admin can create schools.', 403);
    const name = cleanName(body.name);
    if (!name) return fail('bad_request', 'School name needed');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'school';
    const r = await db.from('schools').insert({ name, slug: slug + '-' + Math.random().toString(36).slice(2, 6) }).select('id, name, invite_code').single();
    if (r.error) return fail('failed', r.error.message, 500);
    await db.from('profiles').update({ role: 'admin', school_id: r.data.id }).eq('id', user.id);
    return json({ ok: true, school: r.data });
  }

  return fail('bad_request', 'Unknown action');
};
