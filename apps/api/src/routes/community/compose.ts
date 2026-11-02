import { ZCommunityAnswerCreate, ZCommunityQuestionCreate, ZGetCommunity } from '@cio/utils/validation/community';
import { answerCommunityQuestion, askCommunityQuestion } from '@api/services/community-compose';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

export const communityComposeRouter = new Hono()
  /**
   * POST /community/compose/question
   * Asks a question as the signed-in user in a course of the active organization.
   */
  .post('/question', authMiddleware, orgMemberMiddleware, zValidator('json', ZCommunityQuestionCreate), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.get('orgId')!;
      const fields = c.req.valid('json');

      const result = await askCommunityQuestion(orgId, user.id, fields);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create community question');
    }
  })
  /**
   * POST /community/compose/question/:id/answer
   * Answers a question as the signed-in user.
   */
  .post(
    '/question/:id/answer',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZGetCommunity),
    zValidator('json', ZCommunityAnswerCreate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.get('orgId')!;
        const { id } = c.req.valid('param');
        const fields = c.req.valid('json');

        const result = await answerCommunityQuestion(orgId, user.id, id, fields);

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to submit answer');
      }
    }
  );
