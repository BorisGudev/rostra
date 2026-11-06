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

test('the language switch turns the door and the app Bulgarian', async ({ page, request }) => {
  const { createClassroom } = await import('./helpers.mjs');
  const { student } = await createClassroom(request);
  await page.goto('/');
  await page.getByRole('button', { name: 'Български' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Репетирайте изпита', { timeout: 15_000 });
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('bg');
  await page.getByLabel(/Потребителско име/).fill(student.username);
  await page.getByLabel(/Парола/).fill(student.password);
  await page.getByRole('button', { name: 'Вход', exact: true }).click();
  await expect(page.getByRole('navigation', { name: /Основно|Main/ }).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('body')).toContainText('Устен изпит');
  await page.screenshot({ path: 'test-results/shots/home-bg-1440.png', fullPage: true });
  // Back to English for the next tests.
  await page.evaluate(() => { location.hash = '#account'; });
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('body')).toContainText('Oral exam', { timeout: 15_000 });
});
