import * as schema from '@db/schema';
import { db, type DbOrTxClient } from '@db/drizzle';
import { and, eq } from 'drizzle-orm';

export type CreateJourneyFromOfferInput = {
  ownerUserId: string;
  offerId: string;
  courseId: string;
  goal: string;
  language: string;
  targetStudyDays: 1 | 7 | 30;
  dailyMinutes: 30 | 60 | 120;
};

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
