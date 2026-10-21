import { randomUUID } from 'node:crypto';

import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { discoverLearningSources, generateObject } = vi.hoisted(() => ({
  discoverLearningSources: vi.fn(),
  generateObject: vi.fn()
}));

vi.mock('@cio/core/services/personal-learning/source-discovery', () => ({ discoverLearningSources }));
vi.mock('ai', () => ({ generateObject }));
vi.mock('@cio/ai-assistant/providers', () => ({
  createModel: vi.fn(() => ({})),
  pickAnyConfiguredProvider: vi.fn(() => ({ provider: 'openai', apiKey: 'test-key' }))
}));

import { generatePersonalLearningSession } from '@cio/core/services/personal-learning/generate-session';
import { recoverPersonalLearningSessions } from '@cio/db/queries/personal-learning';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';

const ownerUserId = randomUUID();
const sessionIds = [randomUUID(), randomUUID(), randomUUID()];
const journeyIds = [randomUUID(), randomUUID(), randomUUID()];
const courseIds = [randomUUID(), randomUUID(), randomUUID()];
const groupIds = [randomUUID(), randomUUID(), randomUUID()];
const conversationIds = [randomUUID(), randomUUID(), randomUUID()];
const sources = [
  {
    url: 'https://example.edu/photography',
    title: 'University photography guide',
    accessedAt: '2026-10-21T00:00:00.000Z',
    content: 'Exposure balances aperture, shutter speed and ISO.'
  }
];
const draft = {
  title: 'Exposure triangle',
  objectives: ['Explain the three exposure controls'],
  activities: [{ type: 'reading' as const, estimatedMinutes: 20, content: 'Compare the settings.' }],
  checkQuestions: ['What happens when ISO increases?'],
  citations: [{ url: sources[0].url, title: sources[0].title, claimIds: ['objective-1'] }],
  whyThisSession: 'Build the core vocabulary first.'
};

describe('personal learning session generation', () => {
  beforeAll(async () => {
    await db
      .insert(schema.user)
      .values({ id: ownerUserId, name: 'Generation test', email: `${ownerUserId}@example.test` });
    await db.insert(schema.profile).values({
      id: ownerUserId,
      fullname: 'Generation test',
      username: `pg_${ownerUserId.replaceAll('-', '')}`,
      welcomeEmailPending: false
    });
    for (const [index, journeyId] of journeyIds.entries()) {
      await db.insert(schema.group).values({ id: groupIds[index], name: 'Private learning', organizationId: null });
      await db.insert(schema.course).values({
        id: courseIds[index],
        title: 'Learn photography',
        description: 'Learn basic photography',
        groupId: groupIds[index],
        isPublished: false,
        isTemplate: false,
        metadata: { allowSelfEnrollment: false }
      });
      await db.insert(schema.personalLearningConversation).values({
        id: conversationIds[index],
        ownerUserId,
        messages: [],
        offerStatus: 'accepted'
      });
      await db.insert(schema.personalLearningJourney).values({
        id: journeyId,
        ownerUserId,
        courseId: courseIds[index],
        conversationId: conversationIds[index],
        goal: 'Learn basic photography',
        language: 'en',
        targetStudyDays: 7,
        dailyMinutes: 30
      });
      await db.insert(schema.personalLearningSession).values({
        id: sessionIds[index],
        journeyId,
        sessionIndex: 1,
        status: 'queued'
      });
    }
  });

  afterAll(async () => {
    const lessons = await db
      .select({ lessonId: schema.personalLearningSession.lessonId })
      .from(schema.personalLearningSession)
      .where(inArray(schema.personalLearningSession.journeyId, journeyIds));
    const lessonIds = lessons.flatMap(({ lessonId }) => (lessonId ? [lessonId] : []));
    if (lessonIds.length)
      await db.delete(schema.lessonLanguage).where(inArray(schema.lessonLanguage.lessonId, lessonIds));
    if (lessonIds.length) await db.delete(schema.lesson).where(inArray(schema.lesson.id, lessonIds));
    await db.delete(schema.personalLearningJourney).where(eq(schema.personalLearningJourney.ownerUserId, ownerUserId));
    await db.delete(schema.course).where(eq(schema.course.id, courseIds[0]));
    await db.delete(schema.course).where(eq(schema.course.id, courseIds[1]));
    await db.delete(schema.course).where(eq(schema.course.id, courseIds[2]));
    await db.delete(schema.group).where(eq(schema.group.id, groupIds[0]));
    await db.delete(schema.group).where(eq(schema.group.id, groupIds[1]));
    await db.delete(schema.group).where(eq(schema.group.id, groupIds[2]));
    await db
      .delete(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.ownerUserId, ownerUserId));
    await db.delete(schema.profile).where(eq(schema.profile.id, ownerUserId));
    await db.delete(schema.user).where(eq(schema.user.id, ownerUserId));
  });

  it('stores one verified lesson atomically and remains idempotent on a retry', async () => {
    discoverLearningSources.mockResolvedValueOnce(sources);
    generateObject.mockResolvedValueOnce({ object: draft });

    const first = await generatePersonalLearningSession({ sessionId: sessionIds[0], attempt: 1 });
    const retry = await generatePersonalLearningSession({ sessionId: sessionIds[0], attempt: 2 });
    const [session] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[0]));
    const lessons = await db.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseIds[0]));
    const languageRows = lessons.length
      ? await db.select().from(schema.lessonLanguage).where(eq(schema.lessonLanguage.lessonId, lessons[0].id))
      : [];

    expect(first).toMatchObject({ status: 'ready', lessonId: session.lessonId });
    expect(retry).toEqual(first);
    expect(session).toMatchObject({ status: 'ready', sessionIndex: 1 });
    expect(session.sourceManifest).toEqual(sources);
    expect(lessons).toHaveLength(1);
    expect(lessons[0]?.slug).toBe('exposure-triangle-1');
    expect(languageRows[0]?.content).toContain('University photography guide');
    expect(languageRows[0]?.content).toContain('https://example.edu/photography');
    expect(discoverLearningSources).toHaveBeenCalledTimes(1);
    expect(generateObject).toHaveBeenCalledTimes(1);
    expect(
      await db
        .select()
        .from(schema.personalLearningSession)
        .where(eq(schema.personalLearningSession.journeyId, journeyIds[0]))
    ).toHaveLength(1);
  });

  it('records a terminal verified-source failure without creating a lesson', async () => {
    discoverLearningSources.mockRejectedValueOnce(
      Object.assign(new Error('No source'), { code: 'NO_VERIFIABLE_SOURCE' })
    );

    await expect(generatePersonalLearningSession({ sessionId: sessionIds[1], attempt: 3 })).rejects.toMatchObject({
      code: 'NO_VERIFIABLE_SOURCE'
    });
    const [session] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[1]));

    expect(session).toMatchObject({ status: 'failed', failureCode: 'NO_VERIFIABLE_SOURCE' });
    expect(await db.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseIds[1]))).toHaveLength(0);
  });

  it('requeues a stale generating session so the same first lesson can finish', async () => {
    await db
      .update(schema.personalLearningSession)
      .set({ status: 'generating', updatedAt: '2026-10-20T00:00:00.000Z' })
      .where(eq(schema.personalLearningSession.id, sessionIds[2]));
    const recoveredSessions = await recoverPersonalLearningSessions(10);
    const [sessionAfterRecovery] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[2]));
    discoverLearningSources.mockResolvedValueOnce(sources);
    generateObject.mockResolvedValueOnce({ object: draft });

    const result = await generatePersonalLearningSession({ sessionId: sessionIds[2], attempt: 2 });

    expect(recoveredSessions).toContainEqual({
      sessionId: sessionIds[2],
      journeyId: journeyIds[2],
      attempt: 0
    });
    expect(sessionAfterRecovery.status).toBe('queued');
    expect(result.status).toBe('ready');
    expect(await db.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseIds[2]))).toHaveLength(1);
  });
});
