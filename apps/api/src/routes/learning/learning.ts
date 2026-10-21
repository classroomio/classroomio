import { answerLearningQuestion, dismissLearningOffer } from '@api/services/learning/conversation';
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
  });
