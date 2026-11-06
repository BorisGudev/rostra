import { test, expect } from '@playwright/test';

test('health reports mock mode', async ({ request }) => {
  const r = await request.get('/api/health');
  expect(r.ok()).toBeTruthy();
  const j = await r.json();
  expect(j.ai).toBe('mock');
});

test('the door renders with self-hosted assets only, and the privacy page opens without an account', async ({ page }) => {
  const external = [];
  page.on('request', (req) => { const u = new URL(req.url()); if (u.host !== 'localhost:8788') external.push(req.url()); });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Rehearse the exam');
  await page.getByRole('link', { name: 'How your data is handled' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('How Rostra handles your data');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
