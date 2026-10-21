import { answerLearningQuestion, dismissLearningOffer } from '@api/services/learning/conversation';
import { acceptLearningOffer } from '@api/services/learning/accept-offer';
import {
  answerPersonalLearningJourneyQuestion,
  getPersonalLearningJourneyStatus,
  retryPersonalLearningJourney
} from '@api/services/learning/journey';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const ZLearningChatBody = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000)
});

const ZLearningOfferParams = z.object({ offerId: z.string().uuid() });
const ZPersonalLearningJourneyParams = z.object({ journeyId: z.string().uuid() });
const ZPersonalLearningJourneyChatBody = z.object({
  message: z.string().trim().min(1).max(4000)
});
const ZPersonalLearningRetryBody = z.object({
  sourceUrls: z.array(z.string().url().max(2048)).min(1).max(5)
});
const ZAcceptLearningOfferBody = z.object({
  consent: z.literal(true),
  goal: z.string().trim().min(1).max(2000),
  language: z.string().trim().min(2).max(16).default('en'),
  targetStudyDays: z.union([z.literal(1), z.literal(7), z.literal(30)]),
  dailyMinutes: z.union([z.literal(30), z.literal(60), z.literal(120)])
});

export const learningRouter = new Hono()
  .get('/journeys/:journeyId', authMiddleware, zValidator('param', ZPersonalLearningJourneyParams), async (c) => {
    try {
      const user = c.get('user')!;
      const { journeyId } = c.req.valid('param');
      const result = await getPersonalLearningJourneyStatus(user.id, journeyId);

      return c.json({ success: true, ...result });
    } catch (error) {
      return handleError(c, error, 'Failed to load personal learning journey');
    }
  })
  .post(
    '/journeys/:journeyId/chat',
    authMiddleware,
    zValidator('param', ZPersonalLearningJourneyParams),
    zValidator('json', ZPersonalLearningJourneyChatBody),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { journeyId } = c.req.valid('param');
        const result = await answerPersonalLearningJourneyQuestion({
          ownerUserId: user.id,
          journeyId,
          ...c.req.valid('json')
        });

        return c.json({ success: true, ...result });
      } catch (error) {
        return handleError(c, error, 'Failed to answer personal learning question');
      }
    }
  )
  .post(
    '/journeys/:journeyId/retry',
    authMiddleware,
    zValidator('param', ZPersonalLearningJourneyParams),
    zValidator('json', ZPersonalLearningRetryBody),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { journeyId } = c.req.valid('param');
        const result = await retryPersonalLearningJourney({ ownerUserId: user.id, journeyId, ...c.req.valid('json') });

        return c.json({ success: true, ...result }, 202);
      } catch (error) {
        return handleError(c, error, 'Failed to retry personal learning session');
      }
    }
  )
  .post('/chat', authMiddleware, zValidator('json', ZLearningChatBody), async (c) => {
    try {
      const user = c.get('user')!;
      const result = await answerLearningQuestion({ ownerUserId: user.id, ...c.req.valid('json') });

      return c.json({ success: true, ...result });
    } catch (error) {
      return handleError(c, error, 'Failed to answer learning question');
    }
  })
  .post('/offers/:offerId/dismiss', authMiddleware, zValidator('param', ZLearningOfferParams), async (c) => {
    try {
      const user = c.get('user')!;
      const { offerId } = c.req.valid('param');
      const result = await dismissLearningOffer(user.id, offerId);

      return c.json({ success: true, ...result });
    } catch (error) {
      return handleError(c, error, 'Failed to dismiss learning offer');
    }
  })
  .post(
    '/offers/:offerId/accept',
    authMiddleware,
    zValidator('param', ZLearningOfferParams),
    zValidator('json', ZAcceptLearningOfferBody),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { offerId } = c.req.valid('param');
        const result = await acceptLearningOffer({ ownerUserId: user.id, offerId, ...c.req.valid('json') });

        return c.json({ success: true, ...result }, 202);
      } catch (error) {
        return handleError(c, error, 'Failed to accept learning offer');
      }
    }
  );
