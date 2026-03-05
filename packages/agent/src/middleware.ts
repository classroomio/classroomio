import { type Context, type Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

export type AgentVariables = { user: User };

// ─── Auth middleware ──────────────────────────────────────────────────────────

/**
 * Validates the Bearer token using the Supabase anon-key client.
 * Sets `user` on the Hono context for downstream handlers.
 */
export function createAuthMiddleware(supabaseUrl: string, supabaseAnonKey: string) {
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  return async (c: Context<{ Variables: AgentVariables }>, next: Next) => {
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json({ success: false, message: 'No authorization header provided' }, 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return c.json({ success: false, message: 'Invalid authorization header format' }, 401);
    }

    const { data } = await authClient.auth.getUser(token);
    if (!data.user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    c.set('user', data.user);
    await next();
  };
}

// ─── Course team member middleware ────────────────────────────────────────────

/**
 * Verifies the authenticated user is an ADMIN (role 1) or TUTOR (role 2)
 * in the course identified by the `:courseId` path param.
 * Depends on `authMiddleware` having already set `user` on the context.
 */
export function createCourseTeamMemberMiddleware(supabaseUrl: string, supabaseServiceRoleKey: string) {
  const db = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });

  return async (c: Context<{ Variables: AgentVariables }>, next: Next) => {
    const courseId = c.req.param('courseId');
    const user = c.get('user');

    if (!courseId) return c.json({ success: false, message: 'Missing courseId' }, 400);
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const { data: course, error: courseErr } = await db
      .from('course')
      .select('group_id')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) {
      return c.json({ success: false, message: 'Course not found' }, 404);
    }

    const { data: membership } = await db
      .from('groupmember')
      .select('role_id')
      .eq('group_id', course.group_id)
      .eq('profile_id', user.id)
      .in('role_id', [1, 2])
      .maybeSingle();

    if (!membership) {
      return c.json({ success: false, message: 'You do not have permission to access this course' }, 403);
    }

    await next();
  };
}
