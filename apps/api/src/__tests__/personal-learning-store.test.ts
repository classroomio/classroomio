import { randomUUID } from 'node:crypto';

import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { createJourneyFromOffer, getJourneyForOwner, reserveSession } from '@cio/db/queries/personal-learning';

const ownerUserId = randomUUID();
const otherUserId = randomUUID();
const conversationId = randomUUID();
const offerId = randomUUID();
const courseId = randomUUID();
let journeyId: string | undefined;

describe('personal learning store', () => {
  beforeAll(async () => {
    for (const [userId, label] of [
      [ownerUserId, 'owner'],
      [otherUserId, 'other']
    ] as const) {
      await db.insert(schema.user).values({
        id: userId,
        name: `Personal learning ${label}`,
        email: `personal-learning-${label}-${userId}@example.test`
      });
      await db.insert(schema.profile).values({
        id: userId,
        fullname: `Personal learning ${label}`,
        username: `pl_${userId.replaceAll('-', '')}`,
        welcomeEmailPending: false
      });
    }

    await db.insert(schema.course).values({
      id: courseId,
      title: 'Private learning course',
      description: 'Personal course fixture',
      groupId: null,
      isTemplate: false,
      isPublished: false,
      metadata: { allowSelfEnrollment: false }
    });

    await db.insert(schema.personalLearningConversation).values({
      id: conversationId,
      ownerUserId,
      messages: [{ role: 'user', content: 'Explain linear regression.' }],
      offerId,
      offerPayload: {
        suggestedStudyDays: 7,
        reason: 'The topic benefits from short practice over several days.'
      },
      offerStatus: 'offered'
    });
  });

  afterAll(async () => {
    if (journeyId) {
      await db.delete(schema.personalLearningSession).where(eq(schema.personalLearningSession.journeyId, journeyId));
      await db.delete(schema.personalLearningJourney).where(eq(schema.personalLearningJourney.id, journeyId));
    }

    await db
      .delete(schema.personalLearningConversation)
      .where(eq(schema.personalLearningConversation.id, conversationId));
    await db.delete(schema.course).where(eq(schema.course.id, courseId));
    await db.delete(schema.profile).where(inArray(schema.profile.id, [ownerUserId, otherUserId]));
    await db.delete(schema.user).where(inArray(schema.user.id, [ownerUserId, otherUserId]));
  });

  it('enforces owner access, idempotent offer acceptance, unique sessions, and schedule presets', async () => {
    const journey = await createJourneyFromOffer({
      ownerUserId,
      offerId,
      courseId,
      goal: 'Understand linear regression',
      language: 'en',
      targetStudyDays: 7,
      dailyMinutes: 30
    });
    if (!journey) throw new Error('Journey should be created from the owned offer');

    journeyId = journey.id;

    const duplicateJourney = await createJourneyFromOffer({
      ownerUserId,
      offerId,
      courseId,
      goal: 'Understand linear regression',
      language: 'en',
      targetStudyDays: 7,
      dailyMinutes: 30
    });
    if (!duplicateJourney) throw new Error('Repeated acceptance should return the existing journey');

    expect(duplicateJourney.id).toBe(journey.id);
    expect(await getJourneyForOwner(ownerUserId, journey.id)).toMatchObject({ id: journey.id });
    expect(await getJourneyForOwner(otherUserId, journey.id)).toBeNull();

    const firstSession = await reserveSession(journey.id, 1);
    const retriedSession = await reserveSession(journey.id, 1);
    expect(retriedSession.id).toBe(firstSession.id);

    await expect(
      db.insert(schema.personalLearningSession).values({
        journeyId: journey.id,
        sessionIndex: 1,
        status: 'queued'
      })
    ).rejects.toThrow();

    await expect(
      db
        .update(schema.personalLearningJourney)
        .set({ targetStudyDays: 2 as never })
        .where(
          and(
            eq(schema.personalLearningJourney.id, journey.id),
            eq(schema.personalLearningJourney.ownerUserId, ownerUserId)
          )
        )
    ).rejects.toThrow();

    await expect(
      db
        .update(schema.personalLearningJourney)
        .set({ dailyMinutes: 45 as never })
        .where(eq(schema.personalLearningJourney.id, journey.id))
    ).rejects.toThrow();

    const sessions = await db
      .select({ id: schema.personalLearningSession.id })
      .from(schema.personalLearningSession)
      .where(eq(schema.personalLearningSession.journeyId, journey.id));
    expect(sessions).toHaveLength(1);
  });
});
