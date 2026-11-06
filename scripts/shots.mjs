#!/usr/bin/env node
/* Screenshot the running app at 375 and 1440 px, light and dark, signed in as a fresh student (and as the teacher
   for the class pages). Usage: node scripts/shots.mjs [outDir] [route ...]   Needs the dev server (MOCK_SUPABASE=1 MOCK_SEED=1). */
import { chromium, request as pwRequest } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClassroom, signIn } from '../tests/e2e/helpers.mjs';

const out = process.argv[2] || 'test-results/shots';
const routes = process.argv.slice(3).length ? process.argv.slice(3) : ['home', 'viva', 'analyze', 'prepare', 'gym', 'learn', 'library', 'trophies', 'account', 'teacher'];
const base = `http://localhost:${process.env.PORT || 8788}/`;
mkdirSync(out, { recursive: true });
const req = await pwRequest.newContext();
const room = await createClassroom(req);
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  for (const [w, h] of [[375, 812], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1, baseURL: base });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    let who = 'student';
    await signIn(page, room.student.username, room.student.password);
    for (const r of routes) {
      const needTeacher = r === 'teacher' || r === 'class';
      if (needTeacher && who !== 'teacher') { await page.evaluate(() => { location.hash = '#account'; }); await page.getByRole('button', { name: 'Sign out' }).click(); await signIn(page, room.teacher.email, room.teacher.password); who = 'teacher'; }
      await page.evaluate((hash) => { location.hash = hash; }, '#' + r);
      await page.waitForTimeout(600);
      const name = `${r}-${w}-${scheme}.png`;
      await page.screenshot({ path: path.join(out, name), fullPage: true });
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) console.log(`horizontal overflow on ${name}: scrollWidth ${sw}`);
    }
    if (errors.length) console.log(`page errors (${w} ${scheme}):`, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
}
await browser.close();
await req.dispose();
console.log(`screenshots in ${out}`);
