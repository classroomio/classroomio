import { expect, test } from '@playwright/test';

import { DEMO_ADMIN } from '../helpers/login';

const sourceUrl = 'https://en.wikipedia.org/wiki/Derivative';

test('personal learning creates one private, source-cited lesson with a live model', async ({ page }) => {
  test.skip(
    process.env.PERSONAL_LEARNING_LIVE_E2E !== 'true',
    'Set PERSONAL_LEARNING_LIVE_E2E=true to run against the configured live model and API.'
  );
  test.setTimeout(300_000);

  const baseURL = process.env.DEMO_BASE_URL ?? 'http://localhost:4173';
  const loginResponse = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
    data: { email: DEMO_ADMIN.email, password: DEMO_ADMIN.password },
    headers: { Origin: baseURL, 'Content-Type': 'application/json' }
  });
  expect(loginResponse.ok()).toBeTruthy();

  await page.goto('/personal-learning');

  const chatResponsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return request.method() === 'POST' && new URL(response.url()).pathname.endsWith('/learning/chat');
  });
  await page.getByTestId('personal-learning-question').fill('Teach me the basics of derivatives.');
  await page.getByTestId('personal-learning-send').click();

  const chatResponse = await chatResponsePromise;
  expect(chatResponse.ok()).toBeTruthy();
  const chatBody = (await chatResponse.json()) as {
    answer: string;
    offer: { choices: number[]; suggestedStudyDays: number };
  };
  expect(chatBody.answer.trim().length).toBeGreaterThan(0);
  expect(chatBody.offer.choices).toEqual([1, 7, 30]);
  expect([1, 7, 30]).toContain(chatBody.offer.suggestedStudyDays);
  await expect(page.getByTestId('personal-learning-offer')).toBeVisible();
  await expect(page.getByTestId('personal-learning-journey')).toHaveCount(0);

  await page.getByTestId('personal-learning-days-7').click();
  await page.getByTestId('personal-learning-minutes-30').click();
  await expect(page.getByTestId('personal-learning-accept')).toBeDisabled();
  await page.getByTestId('personal-learning-consent').check();

  const acceptResponsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return request.method() === 'POST' && /\/learning\/offers\/[^/]+\/accept$/.test(new URL(response.url()).pathname);
  });
  await page.getByTestId('personal-learning-accept').click();

  const acceptResponse = await acceptResponsePromise;
  expect(acceptResponse.ok()).toBeTruthy();
  const acceptBody = (await acceptResponse.json()) as {
    journey: { targetStudyDays: number; dailyMinutes: number };
    session: { sessionIndex: number };
  };
  expect(acceptBody.journey).toMatchObject({ targetStudyDays: 7, dailyMinutes: 30 });
  expect(acceptBody.session.sessionIndex).toBe(1);

  const journey = page.getByTestId('personal-learning-journey');
  const session = page.getByTestId('personal-learning-session-1');
  const sourceInput = page.getByRole('textbox', { name: 'Public learning source URL' });
  await expect(journey.getByText('Private course')).toBeVisible();
  await expect(session).toBeVisible();
  await expect
    .poll(
      async () => {
        const sourceRequired = await sourceInput.isVisible().catch(() => false);
        const statusText = await session
          .getByRole('status')
          .innerText()
          .catch(() => '');
        return sourceRequired || /ready/i.test(statusText);
      },
      { timeout: 120_000 }
    )
    .toBe(true);

  let expectedSourceUrl: string | null = null;
  if (await sourceInput.isVisible()) {
    expectedSourceUrl = sourceUrl;
    await sourceInput.fill(sourceUrl);
    const retryResponsePromise = page.waitForResponse((response) => {
      const request = response.request();
      return (
        request.method() === 'POST' && /\/learning\/journeys\/[^/]+\/retry$/.test(new URL(response.url()).pathname)
      );
    });
    await page.getByRole('button', { name: 'Retry with this source' }).click();
    const retryResponse = await retryResponsePromise;
    expect(retryResponse.ok()).toBeTruthy();
  }

  await expect(session.getByRole('status')).toHaveText(/ready/i, { timeout: 180_000 });
  await expect(page.locator('[data-testid^="personal-learning-session-"]')).toHaveCount(1);
  await page.getByTestId('personal-learning-open-lesson').click();

  if (expectedSourceUrl) {
    await expect(page.locator(`a[href="${expectedSourceUrl}"]`)).toBeVisible();
  } else {
    await expect(page.locator('a[href^="https://"]').first()).toBeVisible();
  }
});
