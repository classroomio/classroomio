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
import { getCourseWithRelations } from '@cio/db/queries/course/course';
import {
  completePersonalLearningSession,
  markPersonalLearningSessionFailed,
  markPersonalLearningSessionGenerating,
  recoverPersonalLearningSessions
} from '@cio/db/queries/personal-learning';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { ROLE } from '@cio/utils/constants';
import { getCourse } from '@cio/core/services/course/course';

const ownerUserId = randomUUID();
const otherUserId = randomUUID();
const sessionIds = Array.from({ length: 5 }, () => randomUUID());
const journeyIds = Array.from({ length: 5 }, () => randomUUID());
const courseIds = Array.from({ length: 5 }, () => randomUUID());
const groupIds = Array.from({ length: 5 }, () => randomUUID());
const conversationIds = Array.from({ length: 5 }, () => randomUUID());
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
  citations: [
    {
      url: sources[0].url,
      title: sources[0].title,
      evidence: [
        { claimId: 'objective-1', quote: 'Exposure balances aperture, shutter speed and ISO.' },
        { claimId: 'activity-1', quote: 'Exposure balances aperture, shutter speed and ISO.' }
      ]
    }
  ],
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
    await db
      .insert(schema.user)
      .values({ id: otherUserId, name: 'Other student', email: `${otherUserId}@example.test` });
    await db.insert(schema.profile).values({
      id: otherUserId,
      fullname: 'Other student',
      username: `pg_${otherUserId.replaceAll('-', '')}`,
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
        language: index === 3 ? 'it' : index === 4 ? 'tr' : 'en',
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
    await db.insert(schema.groupmember).values([
      { groupId: groupIds[0], profileId: ownerUserId, roleId: ROLE.STUDENT },
      { groupId: groupIds[0], profileId: otherUserId, roleId: ROLE.STUDENT }
    ]);
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
    await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, groupIds[0]));
    await db.delete(schema.personalLearningJourney).where(eq(schema.personalLearningJourney.ownerUserId, ownerUserId));
    await db.delete(schema.course).where(inArray(schema.course.id, courseIds));
    await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
    await db
      .delete(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.ownerUserId, ownerUserId));
    await db.delete(schema.profile).where(eq(schema.profile.id, ownerUserId));
    await db.delete(schema.profile).where(eq(schema.profile.id, otherUserId));
    await db.delete(schema.user).where(eq(schema.user.id, ownerUserId));
    await db.delete(schema.user).where(eq(schema.user.id, otherUserId));
  });

  it('stores one verified lesson atomically and remains idempotent on a retry', async () => {
    discoverLearningSources.mockImplementationOnce(async () => {
      const [sessionDuringDiscovery] = await db
        .select()
        .from(schema.personalLearningSession)
        .where(eq(schema.personalLearningSession.id, sessionIds[0]));
      expect(sessionDuringDiscovery.status).toBe('sourcing');
      return sources;
    });
    generateObject.mockImplementationOnce(async () => {
      const [sessionDuringGeneration] = await db
        .select()
        .from(schema.personalLearningSession)
        .where(eq(schema.personalLearningSession.id, sessionIds[0]));
      expect(sessionDuringGeneration.status).toBe('generating');
      return { object: draft };
    });

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
    expect(session.sourceManifest).toEqual([
      {
        ...sources[0],
        evidence: [
          { claimId: 'objective-1', quote: 'Exposure balances aperture, shutter speed and ISO.' },
          { claimId: 'activity-1', quote: 'Exposure balances aperture, shutter speed and ISO.' }
        ]
      }
    ]);
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

  it('does not persist a lesson when a citation uses an unknown claim id', async () => {
    discoverLearningSources.mockResolvedValueOnce(sources);
    generateObject.mockResolvedValueOnce({
      object: {
        ...draft,
        citations: [
          {
            ...draft.citations[0],
            evidence: [{ claimId: 'objective-9', quote: 'Exposure balances aperture, shutter speed and ISO.' }]
          }
        ]
      }
    });

    await expect(generatePersonalLearningSession({ sessionId: sessionIds[1], attempt: 1 })).rejects.toMatchObject({
      code: 'INVALID_CITATION_CLAIM'
    });
    const [session] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[1]));

    expect(session).toMatchObject({ status: 'failed', failureCode: 'INVALID_CITATION_CLAIM', lessonId: null });
    expect(await db.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseIds[1]))).toHaveLength(0);
  });

  it.each([
    { index: 3, locale: 'it' },
    { index: 4, locale: 'tr' }
  ])('stores a generated lesson in the $locale locale', async ({ index, locale }) => {
    discoverLearningSources.mockResolvedValueOnce(sources);
    generateObject.mockResolvedValueOnce({ object: draft });

    await generatePersonalLearningSession({ sessionId: sessionIds[index], attempt: 1 });

    const [session] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[index]));
    const [lessonLanguage] = await db
      .select()
      .from(schema.lessonLanguage)
      .where(eq(schema.lessonLanguage.lessonId, session.lessonId!));

    expect(lessonLanguage.locale).toBe(locale);
  });

  it('loads a private course group without an organization for the journey owner', async () => {
    const courseWithRelations = await getCourseWithRelations(courseIds[0], undefined, ownerUserId);

    expect(courseWithRelations?.group).toMatchObject({
      id: groupIds[0],
      organizationId: null,
      members: expect.arrayContaining([expect.objectContaining({ profileId: ownerUserId, roleId: ROLE.STUDENT })])
    });
    await expect(getCourse(courseIds[0], undefined, ownerUserId)).resolves.toMatchObject({ id: courseIds[0] });
  });

  it('keeps an unpublished personal course hidden from students other than its owner', async () => {
    await expect(getCourse(courseIds[0], undefined, otherUserId)).rejects.toMatchObject({
      code: 'COURSE_NOT_FOUND',
      statusCode: 404
    });
  });

  it('requeues a stale generating session so the same first lesson can finish', async () => {
    await db
      .update(schema.personalLearningSession)
      .set({ status: 'generating', updatedAt: '2026-10-20T00:00:00.000Z' })
      .where(eq(schema.personalLearningSession.id, sessionIds[2]));
    await db
      .update(schema.personalLearningSession)
      .set({ status: 'sourcing', updatedAt: '2026-10-20T00:00:00.000Z' })
      .where(eq(schema.personalLearningSession.id, sessionIds[1]));
    const recoveredSessions = await recoverPersonalLearningSessions(10);
    const [sessionAfterRecovery] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[2]));
    const [sourcingSessionAfterRecovery] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[1]));
    discoverLearningSources.mockResolvedValueOnce(sources);
    generateObject.mockResolvedValueOnce({ object: draft });

    const result = await generatePersonalLearningSession({ sessionId: sessionIds[2], attempt: 2 });

    expect(recoveredSessions).toContainEqual({
      sessionId: sessionIds[2],
      journeyId: journeyIds[2],
      attempt: 0
    });
    expect(sessionAfterRecovery.status).toBe('queued');
    expect(sourcingSessionAfterRecovery.status).toBe('queued');
    expect(recoveredSessions).toContainEqual({
      sessionId: sessionIds[1],
      journeyId: journeyIds[1],
      attempt: 1
    });
    expect(result.status).toBe('ready');
    expect(await db.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseIds[2]))).toHaveLength(1);
  });

  it('keeps a completed session ready when a late generation failure arrives', async () => {
    const [readySession] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[2]));

    const failedSession = await markPersonalLearningSessionFailed(
      sessionIds[2],
      readySession.attempt,
      'late failure',
      true
    );
    const [sessionAfterFailure] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[2]));
    const staleCompletion = await completePersonalLearningSession({
      sessionId: sessionIds[2],
      attempt: readySession.attempt - 1,
      title: 'Stale lesson',
      content: '<p>Stale content</p>',
      sourceManifest: [],
      generationMeta: {}
    });

    await db
      .update(schema.personalLearningSession)
      .set({ status: 'sourcing', attempt: readySession.attempt + 1 })
      .where(eq(schema.personalLearningSession.id, sessionIds[2]));
    const staleGenerating = await markPersonalLearningSessionGenerating(sessionIds[2], readySession.attempt);
    await db
      .update(schema.personalLearningSession)
      .set({ status: 'generating' })
      .where(eq(schema.personalLearningSession.id, sessionIds[2]));
    const staleFailure = await markPersonalLearningSessionFailed(
      sessionIds[2],
      readySession.attempt,
      'stale failure',
      true
    );
    const [sessionAfterStaleFailure] = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, sessionIds[2]));

    expect(failedSession).toBeNull();
    expect(sessionAfterFailure).toMatchObject({ status: 'ready', lessonId: readySession.lessonId });
    expect(staleCompletion).toBeNull();
    expect(staleGenerating).toBeNull();
    expect(staleFailure).toBeNull();
    expect(sessionAfterStaleFailure).toMatchObject({ status: 'generating', attempt: readySession.attempt + 1 });
  });
});
