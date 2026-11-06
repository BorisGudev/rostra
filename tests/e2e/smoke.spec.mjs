import { test, expect } from '@playwright/test';

test('health reports mock mode', async ({ request }) => {
  const r = await request.get('/api/health');
  expect(r.ok()).toBeTruthy();
  const j = await r.json();
  expect(j.ai).toBe('mock');
});

test('home renders with self-hosted assets only', async ({ page }) => {
  const external = [];
  page.on('request', (req) => { const u = new URL(req.url()); if (u.host !== 'localhost:8788') external.push(req.url()); });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
