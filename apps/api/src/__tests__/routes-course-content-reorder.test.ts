import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

vi.mock('@api/middlewares/course-team-member', () => ({
  courseTeamMemberMiddleware: async (_c: Context, next: Next) => next()
}));
vi.mock('@cio/core/services/course/content', () => ({
  reorderCourseContent: vi.fn(),
  updateCourseContent: vi.fn(),
  deleteCourseContent: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { reorderCourseContent } from '@cio/core/services/course/content';
import { contentRouter } from '@api/routes/course/content';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const payload = { items: [{ id: 'lesson-1', type: 'LESSON', order: 1 }] };

const appWith = (setContext: (c: Context) => void) =>
  new Hono()
    .use('*', async (c, next) => {
      setContext(c);
      await next();
    })
    .route('/course/:courseId/content', contentRouter);

const reorder = (app: ReturnType<typeof appWith>) =>
  app.request(`/course/${COURSE_ID}/content/reorder`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

describe('internal PUT /course/:courseId/content/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no longer accepts automation keys (they use the v1 route)', async () => {
    const response = await reorder(appWith((c) => c.set('automationKey', { type: 'mcp', scopes: ['course:write'] })));

    expect(response.status).toBe(401);
    expect(reorderCourseContent).not.toHaveBeenCalled();
  });

  it('still works for a signed-in course team member', async () => {
    vi.mocked(reorderCourseContent).mockResolvedValue({} as never);

    const response = await reorder(
      appWith((c) => {
        c.set('user', { id: 'user-1' });
        c.set('session', { id: 'session-1' });
      })
    );

    expect(response.status).toBe(200);
    expect(reorderCourseContent).toHaveBeenCalledWith(COURSE_ID, payload);
  });
});
