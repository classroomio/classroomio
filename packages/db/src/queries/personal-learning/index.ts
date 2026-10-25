import * as schema from '@db/schema';
import { db, type DbOrTxClient } from '@db/drizzle';
import { ROLE } from '@cio/utils/constants';
import { generateSlug } from '@cio/utils/functions/slug';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';

import type { PersonalLearningMessage, PersonalLearningOfferPayload } from '@db/schema';

export type CreateJourneyFromOfferInput = {
  ownerUserId: string;
  offerId: string;
  courseId: string;
  goal: string;
  language: string;
  targetStudyDays: 1 | 7 | 30;
  dailyMinutes: 30 | 60 | 120;
};

export type AcceptPersonalLearningOfferInput = Omit<CreateJourneyFromOfferInput, 'courseId'>;

export async function getPersonalLearningJourneyForOffer(ownerUserId: string, offerId: string) {
  const [journey] = await db
    .select({ journey: schema.personalLearningJourney, session: schema.personalLearningSession })
    .from(schema.personalLearningConversation)
    .innerJoin(
      schema.personalLearningJourney,
      eq(schema.personalLearningJourney.conversationId, schema.personalLearningConversation.id)
    )
    .innerJoin(
      schema.personalLearningSession,
      eq(schema.personalLearningSession.journeyId, schema.personalLearningJourney.id)
    )
    .where(
      and(
        eq(schema.personalLearningConversation.ownerUserId, ownerUserId),
        eq(schema.personalLearningConversation.offerId, offerId),
        eq(schema.personalLearningSession.sessionIndex, 1)
      )
    )
    .limit(1);

  return journey ?? null;
}

export async function acceptPersonalLearningOffer(input: AcceptPersonalLearningOfferInput) {
  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .select()
      .from(schema.personalLearningConversation)
      .where(
        and(
          eq(schema.personalLearningConversation.ownerUserId, input.ownerUserId),
          eq(schema.personalLearningConversation.offerId, input.offerId)
        )
      )
      .for('update')
      .limit(1);

    if (!conversation) return null;

    const [existingJourney] = await tx
      .select({ journey: schema.personalLearningJourney, session: schema.personalLearningSession })
      .from(schema.personalLearningJourney)
      .innerJoin(
        schema.personalLearningSession,
        eq(schema.personalLearningSession.journeyId, schema.personalLearningJourney.id)
      )
      .where(
        and(
          eq(schema.personalLearningJourney.conversationId, conversation.id),
          eq(schema.personalLearningSession.sessionIndex, 1)
        )
      )
      .limit(1);

    if (existingJourney) return existingJourney;
    if (conversation.offerStatus !== 'offered') return null;

    const title = input.goal.trim().slice(0, 160);
    const [createdGroup] = await tx
      .insert(schema.group)
      .values({ name: title, description: input.goal, organizationId: null })
      .returning();
    const [createdCourse] = await tx
      .insert(schema.course)
      .values({
        title,
        description: input.goal,
        groupId: createdGroup.id,
        isPublished: false,
        isTemplate: false,
        metadata: { goals: input.goal, description: input.goal, requirements: '', allowSelfEnrollment: false }
      })
      .returning();

    await tx.insert(schema.groupmember).values({
      groupId: createdGroup.id,
      roleId: ROLE.STUDENT,
      profileId: input.ownerUserId
    });

    const [journey] = await tx
      .insert(schema.personalLearningJourney)
      .values({
        ownerUserId: input.ownerUserId,
        organizationId: null,
        courseId: createdCourse.id,
        conversationId: conversation.id,
        goal: input.goal,
        language: input.language,
        targetStudyDays: input.targetStudyDays,
        dailyMinutes: input.dailyMinutes
      })
      .returning();
    const [session] = await tx
      .insert(schema.personalLearningSession)
      .values({ journeyId: journey.id, sessionIndex: 1, status: 'queued' })
      .returning();

    await tx
      .update(schema.personalLearningConversation)
      .set({ offerStatus: 'accepted' })
      .where(eq(schema.personalLearningConversation.id, conversation.id));

    return { journey, session };
  });
}

export async function getPersonalLearningSessionContext(sessionId: string) {
  const [context] = await db
    .select({
      session: schema.personalLearningSession,
      journey: schema.personalLearningJourney,
      courseTitle: schema.course.title
    })
    .from(schema.personalLearningSession)
    .innerJoin(
      schema.personalLearningJourney,
      eq(schema.personalLearningJourney.id, schema.personalLearningSession.journeyId)
    )
    .innerJoin(schema.course, eq(schema.course.id, schema.personalLearningJourney.courseId))
    .where(eq(schema.personalLearningSession.id, sessionId))
    .limit(1);

  return context ?? null;
}

export async function getPersonalLearningJourneyStatusForOwner(ownerUserId: string, journeyId: string) {
  const [result] = await db
    .select({
      journey: schema.personalLearningJourney,
      session: schema.personalLearningSession,
      messages: schema.personalLearningConversation.messages
    })
    .from(schema.personalLearningJourney)
    .innerJoin(
      schema.personalLearningSession,
      and(
        eq(schema.personalLearningSession.journeyId, schema.personalLearningJourney.id),
        eq(schema.personalLearningSession.sessionIndex, 1)
      )
    )
    .innerJoin(
      schema.personalLearningConversation,
      eq(schema.personalLearningConversation.id, schema.personalLearningJourney.conversationId)
    )
    .where(
      and(eq(schema.personalLearningJourney.ownerUserId, ownerUserId), eq(schema.personalLearningJourney.id, journeyId))
    )
    .limit(1);

  if (!result) return null;

  return {
    journey: {
      id: result.journey.id,
      courseId: result.journey.courseId,
      conversationId: result.journey.conversationId,
      goal: result.journey.goal,
      language: result.journey.language,
      targetStudyDays: result.journey.targetStudyDays,
      dailyMinutes: result.journey.dailyMinutes
    },
    messages: result.messages,
    session: {
      sessionIndex: result.session.sessionIndex,
      status: result.session.status,
      lessonId: result.session.lessonId,
      failureCode: result.session.failureCode,
      sources: result.session.sourceManifest.map(({ url, title, accessedAt }) => ({ url, title, accessedAt }))
    }
  };
}

export async function isPersonalLearningCourseOwner(courseId: string, ownerUserId: string): Promise<boolean> {
  const [journey] = await db
    .select({ id: schema.personalLearningJourney.id })
    .from(schema.personalLearningJourney)
    .where(
      and(
        eq(schema.personalLearningJourney.courseId, courseId),
        eq(schema.personalLearningJourney.ownerUserId, ownerUserId)
      )
    )
    .limit(1);

  return Boolean(journey);
}

export async function getPersonalLearningTutorContextForOwner(ownerUserId: string, journeyId: string) {
  const [result] = await db
    .select({
      journey: schema.personalLearningJourney,
      session: schema.personalLearningSession,
      courseTitle: schema.course.title,
      messages: schema.personalLearningConversation.messages,
      lesson: schema.lesson
    })
    .from(schema.personalLearningJourney)
    .innerJoin(
      schema.personalLearningSession,
      and(
        eq(schema.personalLearningSession.journeyId, schema.personalLearningJourney.id),
        eq(schema.personalLearningSession.sessionIndex, 1)
      )
    )
    .innerJoin(
      schema.personalLearningConversation,
      eq(schema.personalLearningConversation.id, schema.personalLearningJourney.conversationId)
    )
    .innerJoin(schema.course, eq(schema.course.id, schema.personalLearningJourney.courseId))
    .innerJoin(schema.lesson, eq(schema.lesson.id, schema.personalLearningSession.lessonId))
    .where(
      and(
        eq(schema.personalLearningJourney.ownerUserId, ownerUserId),
        eq(schema.personalLearningJourney.id, journeyId),
        eq(schema.personalLearningSession.status, 'ready')
      )
    )
    .limit(1);

  if (!result) return null;

  const lessonLanguages = await db
    .select({ locale: schema.lessonLanguage.locale, content: schema.lessonLanguage.content })
    .from(schema.lessonLanguage)
    .where(eq(schema.lessonLanguage.lessonId, result.lesson.id));
  const lessonLocale = result.journey.language.slice(0, 2);
  const lessonContent =
    lessonLanguages.find(({ locale }) => locale === lessonLocale)?.content ??
    lessonLanguages.find(({ locale }) => locale === 'en')?.content;

  if (!lessonContent) return null;

  return {
    journey: {
      id: result.journey.id,
      goal: result.journey.goal,
      language: result.journey.language,
      dailyMinutes: result.journey.dailyMinutes
    },
    messages: result.messages,
    session: {
      sessionIndex: result.session.sessionIndex,
      sourceManifest: result.session.sourceManifest
    },
    courseTitle: result.courseTitle,
    lesson: { id: result.lesson.id, title: result.lesson.title, content: lessonContent }
  };
}

export async function appendPersonalLearningJourneyMessages(
  ownerUserId: string,
  journeyId: string,
  userMessage: string,
  assistantMessage: string
) {
  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .select({ id: schema.personalLearningConversation.id, messages: schema.personalLearningConversation.messages })
      .from(schema.personalLearningConversation)
      .innerJoin(
        schema.personalLearningJourney,
        eq(schema.personalLearningJourney.conversationId, schema.personalLearningConversation.id)
      )
      .where(
        and(
          eq(schema.personalLearningConversation.ownerUserId, ownerUserId),
          eq(schema.personalLearningJourney.id, journeyId)
        )
      )
      .for('update')
      .limit(1);

    if (!conversation) return null;

    const messages = [
      ...conversation.messages,
      { role: 'user' as const, content: userMessage },
      { role: 'assistant' as const, content: assistantMessage }
    ].slice(-50);
    const [updatedConversation] = await tx
      .update(schema.personalLearningConversation)
      .set({ messages })
      .where(eq(schema.personalLearningConversation.id, conversation.id))
      .returning();

    return updatedConversation?.messages ?? null;
  });
}

export async function retryPersonalLearningSessionForOwner(
  ownerUserId: string,
  journeyId: string,
  sourceUrls: string[]
) {
  return db.transaction(async (tx) => {
    const [result] = await tx
      .select({ journey: schema.personalLearningJourney, session: schema.personalLearningSession })
      .from(schema.personalLearningJourney)
      .innerJoin(
        schema.personalLearningSession,
        and(
          eq(schema.personalLearningSession.journeyId, schema.personalLearningJourney.id),
          eq(schema.personalLearningSession.sessionIndex, 1)
        )
      )
      .where(
        and(
          eq(schema.personalLearningJourney.ownerUserId, ownerUserId),
          eq(schema.personalLearningJourney.id, journeyId)
        )
      )
      .for('update')
      .limit(1);

    if (!result || result.session.status !== 'failed') return null;

    const [journey] = await tx
      .update(schema.personalLearningJourney)
      .set({ sourceUrls })
      .where(eq(schema.personalLearningJourney.id, journeyId))
      .returning();
    const [session] = await tx
      .update(schema.personalLearningSession)
      .set({
        status: 'queued',
        failureCode: null,
        attempt: sql`${schema.personalLearningSession.attempt} + 1`,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(schema.personalLearningSession.id, result.session.id),
          eq(schema.personalLearningSession.status, 'failed')
        )
      )
      .returning();

    if (!session) return null;

    return { journey, session };
  });
}

export async function claimPersonalLearningSession(sessionId: string) {
  const [session] = await db
    .update(schema.personalLearningSession)
    .set({
      status: 'sourcing',
      attempt: sql`${schema.personalLearningSession.attempt} + 1`,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(schema.personalLearningSession.id, sessionId), eq(schema.personalLearningSession.status, 'queued')))
    .returning();

  return session ?? null;
}

export async function markPersonalLearningSessionGenerating(sessionId: string) {
  const [session] = await db
    .update(schema.personalLearningSession)
    .set({ status: 'generating', updatedAt: new Date().toISOString() })
    .where(and(eq(schema.personalLearningSession.id, sessionId), eq(schema.personalLearningSession.status, 'sourcing')))
    .returning();

  return session ?? null;
}

export async function markPersonalLearningSessionFailed(sessionId: string, failureCode: string, finalAttempt: boolean) {
  const [session] = await db
    .update(schema.personalLearningSession)
    .set({
      status: finalAttempt ? 'failed' : 'queued',
      failureCode: failureCode.slice(0, 64),
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.personalLearningSession.id, sessionId))
    .returning();

  return session ?? null;
}

export async function completePersonalLearningSession(input: {
  sessionId: string;
  title: string;
  content: string;
  sourceManifest: schema.PersonalLearningSource[];
  generationMeta: schema.PersonalLearningGenerationMeta;
}) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.id, input.sessionId))
      .for('update')
      .limit(1);
    if (!session) return null;
    if (session.status === 'ready' && session.lessonId) return { session, lessonId: session.lessonId };
    if (session.status !== 'generating') return null;

    const [journey] = await tx
      .select()
      .from(schema.personalLearningJourney)
      .where(eq(schema.personalLearningJourney.id, session.journeyId))
      .limit(1);
    if (!journey) return null;

    const lessonLanguage = ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da'].find(
      (supportedLocale) => supportedLocale === journey.language.slice(0, 2)
    ) as 'en' | 'hi' | 'fr' | 'pt' | 'de' | 'vi' | 'ru' | 'es' | 'pl' | 'da' | undefined;

    const [lesson] = await tx
      .insert(schema.lesson)
      .values({
        courseId: journey.courseId,
        title: input.title,
        slug: `${generateSlug(input.title)}-${session.sessionIndex}`,
        order: session.sessionIndex,
        isUnlocked: true
      })
      .returning();
    await tx.insert(schema.lessonLanguage).values({
      lessonId: lesson.id,
      locale: lessonLanguage ?? 'en',
      content: input.content
    });

    const [updatedSession] = await tx
      .update(schema.personalLearningSession)
      .set({
        lessonId: lesson.id,
        sourceManifest: input.sourceManifest,
        generationMeta: input.generationMeta,
        status: 'ready',
        failureCode: null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.personalLearningSession.id, input.sessionId))
      .returning();

    return { session: updatedSession, lessonId: lesson.id };
  });
}

export async function recoverPersonalLearningSessions(staleAfterMinutes: number, limit = 100) {
  const staleBefore = new Date(Date.now() - staleAfterMinutes * 60_000).toISOString();
  await db
    .update(schema.personalLearningSession)
    .set({ status: 'queued', updatedAt: new Date().toISOString() })
    .where(
      and(
        inArray(schema.personalLearningSession.status, ['sourcing', 'generating']),
        lt(schema.personalLearningSession.updatedAt, staleBefore)
      )
    );

  return db
    .select({
      sessionId: schema.personalLearningSession.id,
      journeyId: schema.personalLearningSession.journeyId,
      attempt: schema.personalLearningSession.attempt
    })
    .from(schema.personalLearningSession)
    .where(eq(schema.personalLearningSession.status, 'queued'))
    .limit(limit);
}

async function insertJourneyFromOffer(input: CreateJourneyFromOfferInput, dbClient: DbOrTxClient) {
  const [conversation] = await dbClient
    .select({
      id: schema.personalLearningConversation.id,
      organizationId: schema.personalLearningConversation.organizationId
    })
    .from(schema.personalLearningConversation)
    .where(
      and(
        eq(schema.personalLearningConversation.ownerUserId, input.ownerUserId),
        eq(schema.personalLearningConversation.offerId, input.offerId)
      )
    )
    .limit(1);

  if (!conversation) return null;

  const [existingJourney] = await dbClient
    .select()
    .from(schema.personalLearningJourney)
    .where(
      and(
        eq(schema.personalLearningJourney.conversationId, conversation.id),
        eq(schema.personalLearningJourney.ownerUserId, input.ownerUserId)
      )
    )
    .limit(1);

  if (existingJourney) return existingJourney;

  const [createdJourney] = await dbClient
    .insert(schema.personalLearningJourney)
    .values({
      ownerUserId: input.ownerUserId,
      organizationId: conversation.organizationId,
      courseId: input.courseId,
      conversationId: conversation.id,
      goal: input.goal,
      language: input.language,
      targetStudyDays: input.targetStudyDays,
      dailyMinutes: input.dailyMinutes
    })
    .onConflictDoNothing({ target: schema.personalLearningJourney.conversationId })
    .returning();

  if (createdJourney) return createdJourney;

  const [racedJourney] = await dbClient
    .select()
    .from(schema.personalLearningJourney)
    .where(
      and(
        eq(schema.personalLearningJourney.conversationId, conversation.id),
        eq(schema.personalLearningJourney.ownerUserId, input.ownerUserId)
      )
    )
    .limit(1);

  return racedJourney ?? null;
}

export async function createJourneyFromOffer(input: CreateJourneyFromOfferInput, dbClient: DbOrTxClient = db) {
  if (dbClient === db) {
    return db.transaction((transaction) => insertJourneyFromOffer(input, transaction));
  }

  return insertJourneyFromOffer(input, dbClient);
}

export async function getJourneyForOwner(ownerUserId: string, journeyId: string, dbClient: DbOrTxClient = db) {
  const [journey] = await dbClient
    .select()
    .from(schema.personalLearningJourney)
    .where(
      and(eq(schema.personalLearningJourney.ownerUserId, ownerUserId), eq(schema.personalLearningJourney.id, journeyId))
    )
    .limit(1);

  return journey ?? null;
}

export async function reserveSession(journeyId: string, sessionIndex: number, dbClient: DbOrTxClient = db) {
  const [createdSession] = await dbClient
    .insert(schema.personalLearningSession)
    .values({ journeyId, sessionIndex, status: 'queued' })
    .onConflictDoNothing({
      target: [schema.personalLearningSession.journeyId, schema.personalLearningSession.sessionIndex]
    })
    .returning();

  if (createdSession) return createdSession;

  const [existingSession] = await dbClient
    .select()
    .from(schema.personalLearningSession)
    .where(
      and(
        eq(schema.personalLearningSession.journeyId, journeyId),
        eq(schema.personalLearningSession.sessionIndex, sessionIndex)
      )
    )
    .limit(1);

  return existingSession ?? null;
}

export async function savePersonalLearningConversation(input: {
  ownerUserId: string;
  conversationId?: string;
  userMessage: string;
  assistantMessage: string;
  offerId?: string;
  offerPayload?: PersonalLearningOfferPayload;
}) {
  const [existingConversation] = input.conversationId
    ? await db
        .select()
        .from(schema.personalLearningConversation)
        .where(
          and(
            eq(schema.personalLearningConversation.id, input.conversationId),
            eq(schema.personalLearningConversation.ownerUserId, input.ownerUserId)
          )
        )
        .limit(1)
    : [];

  if (input.conversationId && !existingConversation) return null;

  const messages: PersonalLearningMessage[] = [
    ...(existingConversation?.messages ?? []),
    { role: 'user', content: input.userMessage },
    { role: 'assistant', content: input.assistantMessage }
  ];
  const offerStatus = input.offerId ? 'offered' : 'active';

  if (existingConversation) {
    const [updatedConversation] = await db
      .update(schema.personalLearningConversation)
      .set({
        messages,
        offerId: input.offerId ?? null,
        offerPayload: input.offerPayload ?? null,
        offerStatus
      })
      .where(
        and(
          eq(schema.personalLearningConversation.id, existingConversation.id),
          eq(schema.personalLearningConversation.ownerUserId, input.ownerUserId)
        )
      )
      .returning();

    return updatedConversation ?? null;
  }

  const [conversation] = await db
    .insert(schema.personalLearningConversation)
    .values({
      ownerUserId: input.ownerUserId,
      messages,
      offerId: input.offerId ?? null,
      offerPayload: input.offerPayload ?? null,
      offerStatus
    })
    .returning();

  return conversation ?? null;
}

export async function getPersonalLearningConversationForOwner(ownerUserId: string, conversationId: string) {
  const [conversation] = await db
    .select()
    .from(schema.personalLearningConversation)
    .where(
      and(
        eq(schema.personalLearningConversation.id, conversationId),
        eq(schema.personalLearningConversation.ownerUserId, ownerUserId)
      )
    )
    .limit(1);

  return conversation ?? null;
}

export async function dismissPersonalLearningOffer(ownerUserId: string, offerId: string) {
  const [conversation] = await db
    .update(schema.personalLearningConversation)
    .set({ offerStatus: 'dismissed' })
    .where(
      and(
        eq(schema.personalLearningConversation.ownerUserId, ownerUserId),
        eq(schema.personalLearningConversation.offerId, offerId)
      )
    )
    .returning({
      id: schema.personalLearningConversation.id,
      offerStatus: schema.personalLearningConversation.offerStatus
    });

  return conversation ?? null;
}
