/* Shared steps for the end-to-end tests. The dev server runs with MOCK_SUPABASE=1 MOCK_SEED=1, so a school
   named "Demo School" exists with the teacher invite code DEMOSCHOOL. */
import { expect } from '@playwright/test';

const BASE = 'http://localhost:8788';
const MOCK = BASE + '/mock-supabase';
let n = 0;
export const uniq = (p) => `${p}${Date.now().toString(36)}${(n++).toString(36)}`;

export async function api(request, action, payload, token) {
  const r = await request.post(BASE + '/api/account', { data: { action, ...payload }, headers: token ? { authorization: 'Bearer ' + token } : {} });
  const j = await r.json();
  if (!r.ok()) throw new Error(`${action}: ${JSON.stringify(j)}`);
  return j;
}
export async function tokenFor(request, email, password) {
  const r = await request.post(MOCK + '/auth/v1/token?grant_type=password', { data: { email, password }, headers: { apikey: 'mock-anon' } });
  const j = await r.json();
  if (!r.ok()) throw new Error('token: ' + JSON.stringify(j));
  return j.access_token;
}
export async function rest(request, method, path, body, token) {
  const r = await request.fetch(MOCK + '/rest/v1/' + path, { method, data: body, headers: { apikey: 'mock-anon', authorization: 'Bearer ' + token, prefer: 'return=representation', 'content-type': 'application/json' } });
  const j = await r.json().catch(() => null);
  if (!r.ok()) throw new Error(`${method} ${path}: ${JSON.stringify(j)}`);
  return j;
}

/* A teacher with one class, and one student in it. Returns everything the tests need to sign in. */
export async function createClassroom(request, { className = 'Biology 10B' } = {}) {
  const teacher = { email: uniq('teacher') + '@example.com', password: 'teacherpass1', displayName: 'Ms Petrova' };
  await api(request, 'signup', { kind: 'teacher', inviteCode: 'DEMOSCHOOL', ...teacher });
  const token = await tokenFor(request, teacher.email, teacher.password);
  const me = await rest(request, 'GET', 'profiles?select=id,school_id', null, token);
  const cls = (await rest(request, 'POST', 'classes', { name: className, teacher_id: me[0].id, school_id: me[0].school_id }, token))[0];
  const student = { username: uniq('maria'), password: 'studentpass1', displayName: 'Maria Ivanova', classCode: cls.code };
  await api(request, 'signup', { kind: 'student', ...student });
  return { teacher: { ...teacher, token }, cls, student };
}

/* Sign in through the real door. */
/* Sign out and wait for the door: sign-out first uploads pending work, and a reload before it finishes keeps the session. */
export async function signOut(page) {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('tab', { name: 'Join as a student' })).toBeVisible({ timeout: 20_000 });
}
export async function signIn(page, login, password) {
  await page.goto('/');
  await page.getByLabel('Username or email').fill(login);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Main' }).first()).toBeVisible({ timeout: 20_000 });
}
