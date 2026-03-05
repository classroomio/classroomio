import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '$src/middlewares/auth';
import { courseTeamMemberMiddleware } from '$src/middlewares/course-team-member';
import { processAgentChat } from '$src/services/agent';
import { ZAgentChatPayload } from '$src/types/agent';
import { env } from '$src/config/env';
import type { User } from '@supabase/supabase-js';

type Variables = { user: User };

export const agentRouter = new Hono<{ Variables: Variables }>()
  .post(
    '/chat',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('json', ZAgentChatPayload),
    async (c) => {
      if (env.PUBLIC_IS_SELFHOSTED === 'true') {
        return c.json(
          { success: false, error: 'AI assistant is not available for self-hosted instances' },
          403
        );
      }

      if (!env.OPENAI_API_KEY) {
        return c.json(
          {
            success: false,
            error: 'AI assistant is not configured. Please set the OPENAI_API_KEY environment variable.'
          },
          503
        );
      }

      const courseId = c.req.param('courseId');
      const user = c.get('user');
      const payload = c.req.valid('json');

      try {
        const result = await processAgentChat(courseId, user.id, payload);
        return c.json({ success: true, data: result });
      } catch (error) {
        console.error('agent chat error:', error);
        return c.json(
          {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to process your request. Please try again.'
          },
          500
        );
      }
    }
  );
