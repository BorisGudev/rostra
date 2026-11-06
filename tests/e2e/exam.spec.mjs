import { test, expect } from '@playwright/test';
import { createClassroom, signIn } from './helpers.mjs';

/* A student sits a Quick oral exam out loud. Chromium's fake microphone plays tests/fixtures/answer.wav; the mock
   transcription returns a fixed answer; the mock examiner marks it, asks one follow-up per question, and writes a report. */
test('a spoken oral exam: three questions, follow-ups, a report with measured delivery', async ({ page, request }) => {
  test.setTimeout(240_000);
  const { student } = await createClassroom(request);
  await signIn(page, student.username, student.password);
  await page.goto('/#viva');
  await page.locator('#viva-subject').fill('Photosynthesis');
  await page.getByRole('button', { name: 'Enter the exam room' }).click();
  await page.getByRole('button', { name: /Begin the exam/ }).click();

  let answered = 0;
  for (let i = 0; i < 80; i++) {
    const skip = page.getByRole('button', { name: 'Skip to think time' });
    const start = page.getByRole('button', { name: 'Start my answer now' });
    const finish = page.getByRole('button', { name: /finished speaking/ });
    const verdict = page.getByRole('button', { name: 'Hear the verdict' });
    const submitTyped = page.getByRole('button', { name: 'Submit answer' });
    const nothing = page.getByRole('button', { name: 'Nothing to add' });
    const send = page.getByRole('button', { name: 'Send to the examiner' });
    await expect(skip.or(start).or(finish).or(verdict).or(submitTyped).or(nothing).or(send).first()).toBeVisible({ timeout: 60_000 });
    if (await verdict.isVisible()) break;
    if (await skip.isVisible()) { await skip.click(); continue; }
    if (await start.isVisible()) { await start.click(); continue; }
    if (await finish.isVisible()) {
      await expect(page.locator('.viva-mic')).toBeVisible();
      const followUp = await page.locator('.viva-follow-chip').isVisible();
      await page.waitForTimeout(followUp ? 3_000 : 11_000); // a main answer must pass the ten-second "is that your full answer?" threshold
      await finish.click();
      answered++;
      continue;
    }
    if (await send.isVisible()) {
      // The transcript is shown for correction before it goes to the examiner.
      await expect(page.locator('.viva-textarea')).not.toHaveValue('');
      await send.click();
      continue;
    }
    if (await nothing.isVisible()) { await nothing.click(); continue; }
    if (await submitTyped.isVisible()) { await page.locator('.viva-textarea').fill('Chlorophyll absorbs light, and that drives the reaction.'); await submitTyped.click(); answered++; continue; }
  }
  await page.getByRole('button', { name: 'Hear the verdict' }).click();
  await expect(page.locator('.viva-report')).toBeVisible({ timeout: 60_000 });
  const text = await page.locator('.viva-report').innerText();
  expect(text).toContain('Spoken and transcribed');
  expect(text).toContain('How you sounded');
  expect(text).toMatch(/Pace/);
  expect(text).toContain('audio was not kept');
  // The transcript the examiner marked is the mock transcription (inside the collapsed question-by-question review).
  expect(await page.locator('.viva-report').textContent()).toContain('Photosynthesis is the process');
  await page.screenshot({ path: 'test-results/shots/exam-report-1440.png', fullPage: true });
});
