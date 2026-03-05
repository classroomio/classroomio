import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { initDb } from './db.js';
import { initLlm } from './llm.js';
import { processAgentChat } from './service.js';
import { ZAgentChatPayload } from './types.js';
import { SUPPORTED_MODELS } from './models.js';
import { createAuthMiddleware, createCourseTeamMemberMiddleware, type AgentVariables } from './middleware.js';
import type { User } from '@supabase/supabase-js';

export interface AgentRouterConfig {
  /** Supabase project URL */
  supabaseUrl: string;
  /** Service role key — used for course membership checks and DB mutations */
  supabaseServiceRoleKey: string;
  /** Anon/public key — used for auth token validation */
  supabaseAnonKey: string;
  /** OpenRouter API key */
  openrouterApiKey?: string;
  /** Set to true to disable the agent (self-hosted instances) */
  isSelfHosted?: boolean;
}

/**
 * Returns a self-contained Hono router for the AI agent.
 * Mount it under `/:courseId/agent` in your course router.
 *
 * Enterprise gating: pass `isSelfHosted: true` or omit `openrouterApiKey`
 * to block all agent endpoints with a 403/503.
 */
export function createAgentRouter(config: AgentRouterConfig): Hono<{ Variables: { user: User } }> {
  // Initialise package-internal singletons once per process
  initDb(config.supabaseUrl, config.supabaseServiceRoleKey);
  if (config.openrouterApiKey) initLlm(config.openrouterApiKey);

  const authMiddleware = createAuthMiddleware(config.supabaseUrl, config.supabaseAnonKey);
  const courseTeamMemberMiddleware = createCourseTeamMemberMiddleware(
    config.supabaseUrl,
    config.supabaseServiceRoleKey
  );

  const router = new Hono<{ Variables: AgentVariables }>();

  // ── GET /models — public, no auth ─────────────────────────────────────────
  router.get('/models', (c) => {
    if (config.isSelfHosted) {
      return c.json({ success: false, error: 'AI assistant is not available in self-hosted mode' }, 403);
    }
    return c.json({ success: true, data: SUPPORTED_MODELS });
  });

  // ── POST /chat ─────────────────────────────────────────────────────────────
  router.post(
    '/chat',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('json', ZAgentChatPayload),
    async (c) => {
      if (config.isSelfHosted) {
        return c.json({ success: false, error: 'AI assistant is not available in self-hosted mode' }, 403);
      }

      if (!config.openrouterApiKey) {
        return c.json(
          { success: false, error: 'AI assistant is not configured. Set OPENROUTER_API_KEY.' },
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
        console.error('[agent] chat error:', error);
        return c.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process your request.'
          },
          500
        );
      }
    }
  );

  return router;
}
