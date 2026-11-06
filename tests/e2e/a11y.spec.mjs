import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createClassroom, signIn, signOut } from './helpers.mjs';

/* WCAG 2.2 AA, checked by axe on the main screens at phone and laptop width, light and dark.
   Serious and critical findings fail the test; the rest are printed. */
const PAGES = ['home', 'viva', 'analyze', 'prepare', 'learn', 'account'];
for (const [w, h, scheme] of [[375, 812, 'light'], [1440, 900, 'dark']]) {
  test(`no serious accessibility problems at ${w}px ${scheme}`, async ({ browser, request }) => {
    test.setTimeout(180_000);
    const { student, teacher } = await createClassroom(request);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, baseURL: 'http://localhost:8788' });
    const page = await ctx.newPage();
    const report = [];
    const scan = async (name) => {
      const r = await new AxeBuilder({ page }).exclude('canvas').exclude('.stoa').exclude('.auth-stage').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      for (const v of r.violations) report.push({ page: name, id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) });
    };
    await page.goto('/');
    await scan('door');
    await signIn(page, student.username, student.password);
    for (const p of PAGES) { await page.evaluate((hash) => { location.hash = hash; }, '#' + p); await page.waitForTimeout(400); await scan(p); }
    await page.evaluate(() => { location.hash = '#account'; });
    await signOut(page);
    await signIn(page, teacher.email, teacher.password);
    await page.evaluate(() => { location.hash = '#teacher'; });
    await page.waitForTimeout(400);
    await scan('teacher');
    await ctx.close();
    const bad = report.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    if (report.length) console.log('axe findings:', JSON.stringify(report, null, 1));
    expect(bad, 'serious or critical accessibility violations:\n' + JSON.stringify(bad, null, 1)).toEqual([]);
  });
}
