import { answerLearningQuestion, dismissLearningOffer } from '@api/services/learning/conversation';
import { acceptLearningOffer } from '@api/services/learning/accept-offer';
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
const ZAcceptLearningOfferBody = z.object({
  consent: z.literal(true),
  goal: z.string().trim().min(1).max(2000),
  language: z.string().trim().min(2).max(16).default('en'),
  targetStudyDays: z.union([z.literal(1), z.literal(7), z.literal(30)]),
  dailyMinutes: z.union([z.literal(30), z.literal(60), z.literal(120)])
});

export const learningRouter = new Hono()
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
