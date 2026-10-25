import { expect, test } from '@playwright/test';

const personalLearningCases = [
  { studyDays: 1, dailyMinutes: 30 },
  { studyDays: 7, dailyMinutes: 60 },
  { studyDays: 30, dailyMinutes: 120 }
] as const;

for (const { studyDays, dailyMinutes } of personalLearningCases) {
  test(`creates one ready lesson for a ${studyDays}-day personal learning plan`, async ({ page, context }) => {
    const baseUrl = process.env.DEMO_BASE_URL ?? 'http://localhost:5173';
    const acceptedPlans: Array<Record<string, unknown>> = [];
    const editedGoal = 'Learn derivatives with practice';
    let journeyStatusPoll = 0;

    await context.addCookies([
      { name: 'debugPlay', value: 'true', url: baseUrl },
      { name: 'classroomio_e2e', value: 'test-session', url: baseUrl },
      { name: 'classroomio_locale', value: 'en', url: baseUrl }
    ]);

    await page.route('**/learning/**', async (route) => {
      const request = route.request();
      const { pathname } = new URL(request.url());

      if (request.method() === 'POST' && pathname.endsWith('/learning/chat')) {
        await route.fulfill({
          json: {
            success: true,
            answer: 'A derivative measures how quickly a value changes.',
            conversationId: 'conversation-e2e',
            offer: {
              id: 'offer-e2e',
              suggestedStudyDays: 7,
              reason: 'A short sequence of practice builds a useful foundation.',
              choices: [1, 7, 30]
            }
          }
        });
        return;
      }

      if (request.method() === 'POST' && /\/learning\/offers\/[^/]+\/accept$/.test(pathname)) {
        const plan = request.postDataJSON() as Record<string, unknown>;
        acceptedPlans.push(plan);

        await route.fulfill({
          status: 202,
          json: {
            success: true,
            journey: {
              id: 'journey-e2e',
              conversationId: 'conversation-e2e',
              courseId: 'course-e2e',
              goal: plan.goal,
              targetStudyDays: plan.targetStudyDays,
              dailyMinutes: plan.dailyMinutes
            },
            session: { sessionIndex: 1, status: 'sourcing', lessonId: null, failureCode: null }
          }
        });
        return;
      }

      if (request.method() === 'GET' && pathname.endsWith('/learning/journeys/journey-e2e')) {
        const status = journeyStatusPoll++ === 0 ? 'generating' : 'ready';
        await route.fulfill({
          json: {
            success: true,
            journey: {
              id: 'journey-e2e',
              conversationId: 'conversation-e2e',
              courseId: 'course-e2e',
              goal: editedGoal,
              targetStudyDays: studyDays,
              dailyMinutes
            },
            messages: [
              { role: 'user', content: 'Explain derivatives' },
              { role: 'assistant', content: 'A derivative measures how quickly a value changes.' }
            ],
            sessions: [
              {
                sessionIndex: 1,
                status,
                lessonId: status === 'ready' ? 'lesson-e2e' : null,
                failureCode: null
              }
            ]
          }
        });
        return;
      }

      if (request.method() === 'POST' && pathname.endsWith('/learning/journeys/journey-e2e/chat')) {
        await route.fulfill({
          json: {
            success: true,
            answer: 'The derivative is the slope of the tangent line at that point.',
            messages: [
              { role: 'user', content: 'How does a derivative relate to slope?' },
              { role: 'assistant', content: 'The derivative is the slope of the tangent line at that point.' }
            ]
          }
        });
        return;
      }

      throw new Error(`Unexpected personal learning request: ${request.method()} ${pathname}`);
    });

    await page.route('**/api/auth/get-session*', (route) => route.fulfill({ json: null }));
    await page.goto('/personal-learning', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('personal-learning-question').fill('Explain derivatives');
    await expect(page.getByTestId('personal-learning-send')).toBeEnabled({ timeout: 30_000 });
    await page.getByTestId('personal-learning-send').click();
    await expect(page.getByText('A derivative measures how quickly a value changes.')).toBeVisible();
    await expect(page.getByTestId('personal-learning-offer')).toBeVisible();

    await page.getByTestId(`personal-learning-days-${studyDays}`).click();
    await page.getByTestId(`personal-learning-minutes-${dailyMinutes}`).click();
    await expect(page.getByTestId('personal-learning-accept')).toBeDisabled();
    await page.getByTestId('personal-learning-consent').check();
    await page.getByTestId('personal-learning-goal').fill(editedGoal);
    await expect(page.getByTestId('personal-learning-consent')).not.toBeChecked();
    await expect(page.getByTestId('personal-learning-accept')).toBeDisabled();
    await page.getByTestId('personal-learning-consent').check();
    await page.getByTestId('personal-learning-accept').click();

    await expect(page.getByTestId('personal-learning-session-1')).toBeVisible();
    await expect(page.getByTestId('personal-learning-session-1')).toContainText('Finding sources');
    await expect(page.getByTestId('personal-learning-session-1')).toContainText('Preparing lesson', {
      timeout: 10_000
    });
    await expect(page.getByTestId('personal-learning-session-1')).toContainText('Ready to learn');
    expect(acceptedPlans).toHaveLength(1);
    expect(acceptedPlans[0]).toMatchObject({
      consent: true,
      goal: editedGoal,
      targetStudyDays: studyDays,
      dailyMinutes
    });

    await page.getByTestId('personal-learning-question').fill('How does a derivative relate to slope?');
    await page.getByTestId('personal-learning-send').click();
    await expect(page.getByText('The derivative is the slope of the tangent line at that point.')).toBeVisible();
    await expect(page.locator('[data-testid^="personal-learning-session-"]')).toHaveCount(1);
    expect(acceptedPlans).toHaveLength(1);
  });
}
