import { test, expect } from '@playwright/test';
import { createClassroom, signIn, uniq } from './helpers.mjs';

/* The school flow, end to end, through the real screens:
   a teacher signs up with the school's invite code and creates a class; a student joins with the class code;
   the teacher sets an oral exam; the student sits it (typed, to keep this test short); the teacher sees the result. */
test('teacher creates a class, student joins, exam is set, taken and seen', async ({ page, request }) => {
  test.setTimeout(240_000);
  const teacher = { email: uniq('t') + '@example.com', password: 'teacherpass1' };

  // Teacher joins through the door.
  await page.goto('/');
  await page.getByRole('tab', { name: 'Join as a teacher' }).click();
  await page.getByLabel('School invite code').fill('DEMOSCHOOL');
  await page.getByLabel('Your name').fill('Mr Dimitrov');
  await page.getByLabel('School email').fill(teacher.email);
  await page.getByLabel('Password').fill(teacher.password);
  await page.getByRole('button', { name: 'Create my teacher account' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' }).first()).toBeVisible({ timeout: 20_000 });

  // Creates a class and reads its code.
  await page.getByRole('button', { name: 'Classes' }).first().click();
  await page.getByLabel('New class').fill('History 11A');
  await page.getByRole('button', { name: 'Create class' }).click();
  const tile = page.locator('.teach-class', { hasText: 'History 11A' });
  await expect(tile).toBeVisible();
  const code = (await tile.locator('.teach-code').innerText()).replace('Code', '').trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);

  // Sets an oral exam.
  await tile.click();
  await page.getByRole('button', { name: 'Set an oral exam' }).click();
  await page.getByLabel('Title students see').fill('The French Revolution, oral check');
  await page.getByLabel('Subject', { exact: true }).fill('The French Revolution');
  await page.getByRole('button', { name: /Type my answers/ }).click();
  await page.getByRole('button', { name: 'Assign to the class' }).click();
  await expect(page.locator('.assign-card', { hasText: 'The French Revolution, oral check' })).toBeVisible();
  await page.goto('/#account');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('tab', { name: 'Join as a student' })).toBeVisible();

  // Student joins with the code.
  const student = { username: uniq('ivan'), password: 'studentpass1' };
  await page.getByRole('tab', { name: 'Join as a student' }).click();
  await page.getByLabel('Class code from your teacher').fill(code);
  await page.getByLabel('Your name, as your teacher knows it').fill('Ivan Georgiev');
  await page.getByLabel('Username').fill(student.username);
  await page.getByLabel('Password').fill(student.password);
  await page.getByRole('button', { name: 'Join my class' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' }).first()).toBeVisible({ timeout: 20_000 });

  // Sees the assignment on Home and sits it, typing answers.
  await page.getByRole('button', { name: 'Sit the exam' }).click();
  await expect(page.locator('#viva-subject')).toHaveValue('The French Revolution');
  await page.getByRole('button', { name: 'Enter the exam room' }).click();
  await page.getByRole('button', { name: /Begin the exam/ }).click();
  for (let i = 0; i < 60; i++) {
    const skip = page.getByRole('button', { name: 'Skip to think time' });
    const start = page.getByRole('button', { name: 'Start my answer now' });
    const submit = page.getByRole('button', { name: 'Submit answer' });
    const nothing = page.getByRole('button', { name: 'Nothing to add' });
    const skipWarm = page.getByRole('button', { name: 'Skip the warm-up' });
    const verdict = page.getByRole('button', { name: 'Hear the verdict' });
    await expect(skip.or(start).or(submit).or(nothing).or(verdict).first()).toBeVisible({ timeout: 60_000 });
    if (await verdict.isVisible()) break;
    if (await skip.isVisible()) { await skip.click(); continue; }
    if (await start.isVisible()) { await start.click(); continue; }
    if (await skipWarm.isVisible()) { await skipWarm.click(); continue; }
    if (await nothing.isVisible()) { await nothing.click(); continue; }
    if (await submit.isVisible()) {
      await page.locator('.viva-textarea').fill('The Revolution began in 1789 because the monarchy was bankrupt, the harvest had failed, and the Third Estate had no voice. For example, the Estates-General had not met since 1614, so when it was called the deputies demanded votes by head.');
      await submit.click();
      continue;
    }
  }
  await page.getByRole('button', { name: 'Hear the verdict' }).click();
  await expect(page.locator('.viva-report')).toBeVisible({ timeout: 60_000 });
  await page.goto('/#home');
  await expect(page.locator('.assign-list')).toContainText('All assignments done');
  await page.goto('/#account');
  await page.getByRole('button', { name: 'Sign out' }).click();
  // Sign-out first uploads pending work, so wait for the door before signing in as someone else.
  await expect(page.getByRole('tab', { name: 'Join as a student' })).toBeVisible({ timeout: 20_000 });

  // The teacher sees the result and can open the report.
  await signIn(page, teacher.email, teacher.password);
  await page.getByRole('button', { name: 'Classes' }).first().click();
  await page.locator('.teach-class', { hasText: 'History 11A' }).click();
  const card = page.locator('.assign-card', { hasText: 'The French Revolution, oral check' });
  await expect(card).toContainText('1 of 1 done');
  await expect(card.locator('.teach-table')).toContainText('Ivan Georgiev');
  await card.getByRole('button', { name: 'Open report' }).click();
  await expect(page.locator('.teach-review')).toContainText('Ivan Georgiev');
  await expect(page.locator('.viva-report')).toBeVisible();
  await page.screenshot({ path: 'test-results/shots/teacher-review-1440.png', fullPage: true });
});
