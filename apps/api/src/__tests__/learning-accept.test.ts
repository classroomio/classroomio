import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { enqueuePersonalLearningSession, redis } = vi.hoisted(() => ({
  enqueuePersonalLearningSession: vi.fn(),
  redis: { isReady: true, incr: vi.fn(), expire: vi.fn() }
}));
vi.mock('@cio/jobs/enqueue/personal-learning', () => ({ enqueuePersonalLearningSession }));
vi.mock('@cio/core/utils/redis/redis', () => ({ redis }));

import { Hono } from '@api/utils/hono';
import { learningRouter } from '@api/routes/learning/learning';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { recoverPersonalLearningSessions } from '@cio/db/queries/personal-learning';

const ownerUserId = randomUUID();
const otherUserId = randomUUID();
const offerId = randomUUID();
const conversationId = randomUUID();
const additionalOffers = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];

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

describe('personal learning offer acceptance', () => {
  beforeAll(async () => {
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);
    await db
      .insert(schema.role)
      .values({ id: 3, type: 'STUDENT', description: 'Personal learning test role' })
      .onConflictDoNothing();
    for (const [userId, label] of [
      [ownerUserId, 'owner'],
      [otherUserId, 'other']
    ] as const) {
      await db.insert(schema.user).values({ id: userId, name: label, email: `${userId}@example.test` });
      await db.insert(schema.profile).values({
        id: userId,
        fullname: label,
        username: `pl_${userId.replaceAll('-', '')}`,
        welcomeEmailPending: false
      });
    }
    for (const currentOfferId of [offerId, ...additionalOffers]) {
      await db.insert(schema.personalLearningConversation).values({
        id: currentOfferId === offerId ? conversationId : randomUUID(),
        ownerUserId,
        messages: [{ role: 'user', content: 'Learn basic photography' }],
        offerId: currentOfferId,
        offerPayload: { suggestedStudyDays: 7, reason: 'Practice makes the basics stick.' },
        offerStatus: 'offered'
      });
    }
  });

  afterAll(async () => {
    const ownerJourneys = await db
      .select({ id: schema.personalLearningJourney.id, courseId: schema.personalLearningJourney.courseId })
      .from(schema.personalLearningJourney)
      .where(eq(schema.personalLearningJourney.ownerUserId, ownerUserId));
    const courseIds = ownerJourneys.map(({ courseId }) => courseId);
    const courses = courseIds.length
      ? await db
          .select({ id: schema.course.id, groupId: schema.course.groupId })
          .from(schema.course)
          .where(inArray(schema.course.id, courseIds))
      : [];
    const groupIds = courses.flatMap(({ groupId }) => (groupId ? [groupId] : []));
    if (ownerJourneys.length)
      await db
        .delete(schema.personalLearningJourney)
        .where(eq(schema.personalLearningJourney.ownerUserId, ownerUserId));
    if (courseIds.length) await db.delete(schema.course).where(inArray(schema.course.id, courseIds));
    if (groupIds.length) await db.delete(schema.groupmember).where(inArray(schema.groupmember.groupId, groupIds));
    if (groupIds.length) await db.delete(schema.group).where(inArray(schema.group.id, groupIds));
    await db
      .delete(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.ownerUserId, ownerUserId));
    await db.delete(schema.profile).where(eq(schema.profile.id, ownerUserId));
    await db.delete(schema.profile).where(eq(schema.profile.id, otherUserId));
    await db.delete(schema.user).where(eq(schema.user.id, ownerUserId));
    await db.delete(schema.user).where(eq(schema.user.id, otherUserId));
  });

  it('lets a regular learner accept 1/7/30-day plans and creates one private course with session 1', async () => {
    const ownerApp = createTestApp(ownerUserId);
    const createdCourseIds: string[] = [];
    const choices = [
      { targetStudyDays: 1, dailyMinutes: 30 },
      { targetStudyDays: 7, dailyMinutes: 60 },
      { targetStudyDays: 30, dailyMinutes: 120 }
    ] as const;

    for (const [choiceIndex, choice] of choices.entries()) {
      const currentOfferId = [offerId, ...additionalOffers][choiceIndex];
      enqueuePersonalLearningSession.mockClear();
      const response = await ownerApp.request(`/learning/offers/${currentOfferId}/accept`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...choice, consent: true, goal: 'Learn basic photography', language: 'en' })
      });

      expect(response.status).toBe(202);
      const result = await response.json();
      const [journey] = await db
        .select()
        .from(schema.personalLearningJourney)
        .where(eq(schema.personalLearningJourney.id, result.journey.id));
      const [createdCourse] = await db.select().from(schema.course).where(eq(schema.course.id, journey.courseId));
      const [createdGroup] = await db.select().from(schema.group).where(eq(schema.group.id, createdCourse.groupId!));
      const members = await db.select().from(schema.groupmember).where(eq(schema.groupmember.groupId, createdGroup.id));
      const sessions = await db
        .select()
        .from(schema.personalLearningSession)
        .where(eq(schema.personalLearningSession.journeyId, journey.id));

      expect(journey).toMatchObject({ ...choice, ownerUserId, organizationId: null });
      expect(createdCourse).toMatchObject({ isPublished: false, isTemplate: false });
      createdCourseIds.push(createdCourse.id);
      expect(createdCourse.metadata.allowSelfEnrollment).toBe(false);
      expect(createdGroup.organizationId).toBeNull();
      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({ profileId: ownerUserId, roleId: 3 });
      expect(sessions.map(({ sessionIndex }) => sessionIndex)).toEqual([1]);
      expect(enqueuePersonalLearningSession).toHaveBeenCalledTimes(1);
    }

    expect(new Set(createdCourseIds).size).toBe(3);
  });

  it('reuses an accepted journey on repeat and does not create another session', async () => {
    const ownerApp = createTestApp(ownerUserId);
    const first = await ownerApp.request(`/learning/offers/${offerId}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetStudyDays: 7,
        dailyMinutes: 30,
        consent: true,
        goal: 'Learn photography',
        language: 'en'
      })
    });
    const firstBody = await first.json();
    const retry = await ownerApp.request(`/learning/offers/${offerId}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetStudyDays: 7,
        dailyMinutes: 30,
        consent: true,
        goal: 'Learn photography',
        language: 'en'
      })
    });
    const retryBody = await retry.json();

    expect(retry.status).toBe(202);
    expect(retryBody.journey.id).toBe(firstBody.journey.id);
    const sessions = await db
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.journeyId, firstBody.journey.id));
    expect(sessions.map(({ sessionIndex }) => sessionIndex)).toEqual([1]);
  });

  it('does not let another learner accept the offer or accept invalid time presets', async () => {
    const otherApp = createTestApp(otherUserId);
    const foreignResponse = await otherApp.request(`/learning/offers/${offerId}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetStudyDays: 7,
        dailyMinutes: 30,
        consent: true,
        goal: 'Learn photography',
        language: 'en'
      })
    });
    const invalidResponse = await createTestApp(ownerUserId).request(`/learning/offers/${offerId}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetStudyDays: 14,
        dailyMinutes: 45,
        consent: true,
        goal: 'Learn photography',
        language: 'en'
      })
    });

    expect(foreignResponse.status).toBe(404);
    expect(invalidResponse.status).toBe(400);
  });

  it('rejects generation after the daily limit without creating or queueing a course', async () => {
    redis.incr.mockResolvedValueOnce(4);
    enqueuePersonalLearningSession.mockClear();
    const response = await createTestApp(ownerUserId).request(`/learning/offers/${additionalOffers[2]}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetStudyDays: 7,
        dailyMinutes: 30,
        consent: true,
        goal: 'Learn photography',
        language: 'en'
      })
    });
    const conversations = await db
      .select({ id: schema.personalLearningConversation.id })
      .from(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.offerId, additionalOffers[2]));
    const journeys = await db
      .select()
      .from(schema.personalLearningJourney)
      .where(eq(schema.personalLearningJourney.conversationId, conversations[0].id));

    expect(response.status).toBe(429);
    expect((await response.json()).code).toBe('LEARNING_GENERATION_QUOTA_EXCEEDED');
    expect(journeys).toHaveLength(0);
    expect(enqueuePersonalLearningSession).not.toHaveBeenCalled();
  });

  it('keeps a committed queued session recoverable when enqueue fails', async () => {
    enqueuePersonalLearningSession.mockRejectedValueOnce(new Error('Redis unavailable'));
    const response = await createTestApp(ownerUserId).request(`/learning/offers/${additionalOffers[3]}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetStudyDays: 1,
        dailyMinutes: 30,
        consent: true,
        goal: 'Learn photography',
        language: 'en'
      })
    });
    const result = await response.json();
    const recoverableSessions = await recoverPersonalLearningSessions(10);

    expect(response.status).toBe(202);
    expect(result.session.status).toBe('queued');
    expect(recoverableSessions).toContainEqual({ sessionId: result.session.id, journeyId: result.journey.id });
  });

  it('keeps the legacy organization course-creation route behind org-admin authorization', async () => {
    const routeSource = readFileSync(new URL('../routes/course/course.ts', import.meta.url), 'utf8');

    expect(routeSource).toContain(".post('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZCourseCreate)");
  });
});
