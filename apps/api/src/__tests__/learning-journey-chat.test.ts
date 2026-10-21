import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const {
  generateText,
  getPersonalLearningJourneyStatusForOwner,
  retryPersonalLearningSessionForOwner,
  enqueuePersonalLearningSession,
  redis
} = vi.hoisted(() => ({
  generateText: vi.fn(),
  getPersonalLearningJourneyStatusForOwner: vi.fn(),
  retryPersonalLearningSessionForOwner: vi.fn(),
  enqueuePersonalLearningSession: vi.fn(),
  redis: { isReady: true, incr: vi.fn(), expire: vi.fn() }
}));

vi.mock('ai', async (importOriginal) => ({ ...(await importOriginal<typeof import('ai')>()), generateText }));
vi.mock('@cio/ai-assistant/providers', () => ({
  createModel: vi.fn(() => ({})),
  pickAnyConfiguredProvider: vi.fn(() => ({ provider: 'openai', apiKey: 'test-key' }))
}));
vi.mock('@cio/core/utils/redis/redis', () => ({ redis }));
vi.mock('@cio/jobs/enqueue/personal-learning', () => ({ enqueuePersonalLearningSession }));
vi.mock('@cio/db/queries/personal-learning', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/queries/personal-learning')>()),
  getPersonalLearningJourneyStatusForOwner,
  retryPersonalLearningSessionForOwner
}));

import { Hono } from '@api/utils/hono';
import { learningRouter } from '@api/routes/learning/learning';
import { count, eq } from 'drizzle-orm';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';

const ownerUserId = randomUUID();
const otherUserId = randomUUID();
const journeyId = randomUUID();
const groupId = randomUUID();
const courseId = randomUUID();
const conversationId = randomUUID();
const lessonId = randomUUID();
const sessionId = randomUUID();

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

describe('personal learning journey tutor chat', () => {
  beforeAll(async () => {
    await db
      .insert(schema.role)
      .values({ id: 3, type: 'STUDENT', description: 'Personal learning chat test' })
      .onConflictDoNothing();
    await db
      .insert(schema.user)
      .values({ id: ownerUserId, name: 'Personal learner', email: `${ownerUserId}@example.test` });
    await db.insert(schema.profile).values({
      id: ownerUserId,
      fullname: 'Personal learner',
      username: `plchat_${ownerUserId.replaceAll('-', '')}`,
      welcomeEmailPending: false
    });
    await db
      .insert(schema.group)
      .values({ id: groupId, name: 'Personal course', description: 'Private', organizationId: null });
    await db.insert(schema.course).values({
      id: courseId,
      title: 'Learn derivatives',
      description: 'Learn derivatives',
      groupId,
      isPublished: false,
      isTemplate: false,
      metadata: {
        goals: 'Learn derivatives',
        description: 'Learn derivatives',
        requirements: '',
        allowSelfEnrollment: false
      }
    });
    await db.insert(schema.groupmember).values({ groupId, roleId: 3, profileId: ownerUserId });
    await db.insert(schema.personalLearningConversation).values({
      id: conversationId,
      ownerUserId,
      messages: [
        { role: 'user', content: 'Teach me derivatives.' },
        { role: 'assistant', content: 'A derivative describes a rate of change.' }
      ],
      offerStatus: 'accepted'
    });
    await db.insert(schema.personalLearningJourney).values({
      id: journeyId,
      ownerUserId,
      organizationId: null,
      courseId,
      conversationId,
      goal: 'Learn derivatives',
      language: 'en',
      targetStudyDays: 7,
      dailyMinutes: 30
    });
    await db.insert(schema.lesson).values({
      id: lessonId,
      courseId,
      title: 'What a derivative measures',
      slug: 'what-a-derivative-measures-1',
      order: 1,
      isUnlocked: true
    });
    await db.insert(schema.lessonLanguage).values({ lessonId, locale: 'en', content: '<p>Rate of change.</p>' });
    await db.insert(schema.personalLearningSession).values({
      id: sessionId,
      journeyId,
      sessionIndex: 1,
      lessonId,
      status: 'ready',
      sourceManifest: [
        {
          url: 'https://math.example.edu/calculus',
          title: 'Calculus notes',
          accessedAt: '2026-10-22',
          content: 'A derivative measures a rate of change.'
        }
      ]
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await db.delete(schema.personalLearningJourney).where(eq(schema.personalLearningJourney.id, journeyId));
    await db.delete(schema.lessonLanguage).where(eq(schema.lessonLanguage.lessonId, lessonId));
    await db.delete(schema.lesson).where(eq(schema.lesson.id, lessonId));
    await db.delete(schema.course).where(eq(schema.course.id, courseId));
    await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, groupId));
    await db.delete(schema.group).where(eq(schema.group.id, groupId));
    await db
      .delete(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.id, conversationId));
    await db.delete(schema.profile).where(eq(schema.profile.id, ownerUserId));
    await db.delete(schema.user).where(eq(schema.user.id, ownerUserId));
  });

  it('answers against the owned ready lesson with read-only tools and creates no extra course or session', async () => {
    generateText.mockResolvedValue({ text: 'A derivative describes how quickly a value changes.' });
    const [coursesBefore] = await db
      .select({ value: count() })
      .from(schema.course)
      .where(eq(schema.course.id, courseId));
    const [sessionsBefore] = await db
      .select({ value: count() })
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.journeyId, journeyId));

    const response = await ownerApp.request(`/learning/journeys/${journeyId}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'What does a derivative mean?' })
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    const modelRequest = generateText.mock.calls[0]?.[0];

    expect(body.answer).toContain('derivative');
    expect(Object.keys(modelRequest.tools)).toEqual(['read_lesson_content', 'read_verified_sources']);
    expect(await modelRequest.tools.read_lesson_content.execute({})).toMatchObject({
      title: 'What a derivative measures',
      content: '<p>Rate of change.</p>'
    });
    expect(await modelRequest.tools.read_verified_sources.execute({})).toEqual([
      expect.objectContaining({ url: 'https://math.example.edu/calculus' })
    ]);

    const [conversation] = await db
      .select()
      .from(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.id, conversationId));
    const [coursesAfter] = await db
      .select({ value: count() })
      .from(schema.course)
      .where(eq(schema.course.id, courseId));
    const [sessionsAfter] = await db
      .select({ value: count() })
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.journeyId, journeyId));

    expect(conversation.messages.slice(-2)).toEqual([
      { role: 'user', content: 'What does a derivative mean?' },
      { role: 'assistant', content: 'A derivative describes how quickly a value changes.' }
    ]);
    expect(coursesAfter.value).toBe(coursesBefore.value);
    expect(sessionsAfter.value).toBe(sessionsBefore.value);
  });

  it('does not invoke the model when another user asks about the journey', async () => {
    const response = await createTestApp(otherUserId).request(`/learning/journeys/${journeyId}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Can you explain the lesson?' })
    });

    expect(response.status).toBe(404);
    expect(generateText).not.toHaveBeenCalled();
  });

  it('returns the owner journey status with only session 1', async () => {
    getPersonalLearningJourneyStatusForOwner.mockResolvedValue({
      journey: { id: journeyId, courseId, targetStudyDays: 30, dailyMinutes: 60 },
      messages: [],
      session: { sessionIndex: 1, status: 'ready', lessonId, failureCode: null, sources: [] }
    });

    const response = await ownerApp.request(`/learning/journeys/${journeyId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].sessionIndex).toBe(1);
  });

  it('retries a failed first session with owner-provided public source URLs and a unique job id', async () => {
    getPersonalLearningJourneyStatusForOwner.mockResolvedValue({
      journey: { id: journeyId, ownerUserId, targetStudyDays: 7, dailyMinutes: 30 },
      messages: [],
      session: { sessionIndex: 1, status: 'failed', lessonId: null, failureCode: 'NO_VERIFIABLE_SOURCE', sources: [] }
    });
    retryPersonalLearningSessionForOwner.mockResolvedValue({
      journey: { id: journeyId, ownerUserId },
      session: {
        id: randomUUID(),
        journeyId,
        sessionIndex: 1,
        status: 'queued',
        lessonId: null,
        failureCode: null,
        attempt: 4
      }
    });
    redis.incr.mockResolvedValue(2);
    redis.expire.mockResolvedValue(1);

    const response = await ownerApp.request(`/learning/journeys/${journeyId}/retry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceUrls: ['https://math.example.edu/calculus'] })
    });
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(retryPersonalLearningSessionForOwner).toHaveBeenCalledWith(ownerUserId, journeyId, [
      'https://math.example.edu/calculus'
    ]);
    expect(enqueuePersonalLearningSession).toHaveBeenCalledWith(expect.objectContaining({ journeyId }), {
      jobId: `personal-session-${journeyId}-1-retry-4`
    });
    expect(body.session.status).toBe('queued');
  });

  it('rejects private source URLs before enqueueing a retry', async () => {
    getPersonalLearningJourneyStatusForOwner.mockResolvedValue({
      journey: { id: journeyId, ownerUserId },
      messages: [],
      session: { sessionIndex: 1, status: 'failed', lessonId: null, failureCode: 'NO_VERIFIABLE_SOURCE', sources: [] }
    });

    const response = await ownerApp.request(`/learning/journeys/${journeyId}/retry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceUrls: ['http://127.0.0.1/private'] })
    });

    expect(response.status).toBe(400);
    expect(retryPersonalLearningSessionForOwner).not.toHaveBeenCalled();
    expect(enqueuePersonalLearningSession).not.toHaveBeenCalled();
  });
});
