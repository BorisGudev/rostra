import { test, expect } from '@playwright/test';

const SPEECH = 'Three years ago I stood behind a restaurant in Lisbon at eleven at night, watching a chef throw away forty kilos of perfectly good vegetables. Forty kilos. In one night. From one kitchen. That is when I decided that food waste is not a charity problem, it is a business problem, and that we could build a company around it. Today our compost club serves twelve restaurants and every one of them pays us.';

test('a pasted speech gets a coached report through the server AI', async ({ page }) => {
  await page.goto('/#analyze');
  await page.locator('#an-text').fill(SPEECH);
  await page.getByRole('button', { name: /Analyze content/ }).click();
  // The mock coach scores the content 62 / 71 / 54 and names the speech after its first words.
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Three years ago/i, { timeout: 30_000 });
  await expect(page.locator('body')).toContainText('One number persuades');
});
