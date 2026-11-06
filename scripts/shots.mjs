#!/usr/bin/env node
/* Screenshot the running app at 375 and 1440 px, light and dark. Usage: node scripts/shots.mjs [outDir] [#route ...]
   Needs the dev server on PORT (default 8788). Used by hand to look at the work, and by tests. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'test-results/shots';
const routes = process.argv.slice(3).length ? process.argv.slice(3) : ['', '#analyze', '#prepare', '#viva', '#gym', '#learn', '#library', '#trophies'];
const base = `http://localhost:${process.env.PORT || 8788}/`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  for (const [w, h] of [[375, 812], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const r of routes) {
      await page.goto(base + r, { waitUntil: 'load' });
      await page.waitForTimeout(400);
      const name = `${(r || 'home').replace('#', '')}-${w}-${scheme}.png`;
      await page.screenshot({ path: path.join(out, name), fullPage: true });
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) console.log(`horizontal overflow on ${name}: scrollWidth ${sw}`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`screenshots in ${out}`);
