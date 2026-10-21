import { randomUUID } from 'node:crypto';

import { count, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { generateObject } = vi.hoisted(() => ({ generateObject: vi.fn() }));

vi.mock('ai', () => ({ generateObject }));
vi.mock('@cio/ai-assistant/providers', () => ({
  createModel: vi.fn(() => ({})),
  pickAnyConfiguredProvider: vi.fn(() => ({ provider: 'openai', apiKey: 'test-key' }))
}));

import { Hono } from '@api/utils/hono';
import { learningRouter } from '@api/routes/learning/learning';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';

const ownerUserId = randomUUID();
const otherUserId = randomUUID();

function createTestApp(userId: string) {
  return new Hono()
    .use('*', async (c, next) => {
      c.set('user', { id: userId, email: `${userId}@example.test`, name: 'Personal learner' } as never);
      c.set('session', { id: randomUUID(), userId } as never);
      c.set('orgRoles', {});
      await next();
    })
    .route('/learning', learningRouter);
}

const ownerApp = createTestApp(ownerUserId);
const otherApp = createTestApp(otherUserId);

describe('personal learning chat API', () => {
  beforeAll(async () => {
    for (const [userId, label] of [
      [ownerUserId, 'owner'],
      [otherUserId, 'other']
    ] as const) {
      await db.insert(schema.user).values({
        id: userId,
        name: `Learning chat ${label}`,
        email: `learning-chat-${label}-${userId}@example.test`
      });
      await db.insert(schema.profile).values({
        id: userId,
        fullname: `Learning chat ${label}`,
        username: `lc_${userId.replaceAll('-', '')}`,
        welcomeEmailPending: false
      });
    }
  });

  afterAll(async () => {
    await db
      .delete(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.ownerUserId, ownerUserId));
    await db
      .delete(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.ownerUserId, otherUserId));
    await db.delete(schema.profile).where(eq(schema.profile.id, ownerUserId));
    await db.delete(schema.profile).where(eq(schema.profile.id, otherUserId));
    await db.delete(schema.user).where(eq(schema.user.id, ownerUserId));
    await db.delete(schema.user).where(eq(schema.user.id, otherUserId));
  });

  it('answers first, offers 1/7/30-day choices without creating a course, and dismisses only for the owner', async () => {
    const coursesBefore = await db.select({ value: count() }).from(schema.course);
    generateObject.mockResolvedValueOnce({
      object: {
        answer: 'Linear regression estimates a line that best fits observed data.',
        suggestedStudyDays: 7,
        reason: 'A week allows time to understand the model and practice with examples.'
      }
    });

    const chatResponse = await ownerApp.request('/learning/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Explain linear regression and help me learn it.' })
    });
    const chatBody = await chatResponse.json();

    expect(chatResponse.status).toBe(200);
    expect(chatBody.answer).toContain('Linear regression');
    expect(chatBody.offer).toMatchObject({ suggestedStudyDays: 7 });
    expect(chatBody.offer.choices).toEqual([1, 7, 30]);

    const [conversation] = await db
      .select()
      .from(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.id, chatBody.conversationId));
    expect(conversation?.messages.map(({ role }) => role)).toEqual(['user', 'assistant']);

    const dismissResponse = await ownerApp.request(`/learning/offers/${chatBody.offer.id}/dismiss`, { method: 'POST' });
    expect(dismissResponse.status).toBe(200);
    expect((await dismissResponse.json()).status).toBe('dismissed');

    const foreignDismissResponse = await otherApp.request(`/learning/offers/${chatBody.offer.id}/dismiss`, {
      method: 'POST'
    });
    expect(foreignDismissResponse.status).toBe(404);

    const [coursesAfter] = await db.select({ value: count() }).from(schema.course);
    const journeys = await db.select().from(schema.personalLearningJourney);
    expect(coursesAfter.value).toBe(coursesBefore[0].value);
    expect(journeys).toHaveLength(0);
  });

  it('rejects a model suggestion outside the supported 1/7/30-day presets', async () => {
    generateObject.mockResolvedValueOnce({
      object: { answer: 'Start with the basic idea.', suggestedStudyDays: 14, reason: 'Two weeks.' }
    });

    const response = await ownerApp.request('/learning/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Teach me calculus.' })
    });

    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe('INVALID_LEARNING_OFFER');
  });
});
