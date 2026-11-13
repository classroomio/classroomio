import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/v1/audience', () => ({
  listAudienceService: vi.fn(),
  createAudienceService: vi.fn(),
  getAudienceMemberService: vi.fn(),
  assignAudienceCoursesService: vi.fn(),
  bulkUpdateAudienceStatusService: vi.fn(),
  removeAudienceService: vi.fn(),
  updateAudienceService: vi.fn()
}));

vi.mock('@api/services/v1/audience/analytics', () => ({
  getPublicApiStudentAnalyticsService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getAudienceMemberService } from '@api/services/v1/audience';
import { getPublicApiStudentAnalyticsService } from '@api/services/v1/audience/analytics';
import { v1AudienceRouter } from '@api/routes/v1/audience';

const PROFILE_ID = '22222222-2222-4222-8222-222222222222';
const STUDENT_ANALYTICS = {
  user: { id: PROFILE_ID },
  overallCourseProgress: 50,
  overallAverageGrade: null,
  courses: []
};

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/audience', v1AudienceRouter);

describe('GET /audience/:profileId/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the student analytics with a no-store cache header', async () => {
    vi.mocked(getPublicApiStudentAnalyticsService).mockResolvedValue(STUDENT_ANALYTICS as never);

    const response = await app.request(`/audience/${PROFILE_ID}/analytics`);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: STUDENT_ANALYTICS });
    expect(getPublicApiStudentAnalyticsService).toHaveBeenCalledWith('org-1', 'actor-1', { profileId: PROFILE_ID });
    expect(getAudienceMemberService).not.toHaveBeenCalled();
  });

  it('rejects a non-uuid profileId, such as a numeric memberId, with 400', async () => {
    const response = await app.request('/audience/7/analytics');

    expect(response.status).toBe(400);
    expect(getPublicApiStudentAnalyticsService).not.toHaveBeenCalled();
  });

  it('maps a profile outside the organization to 404', async () => {
    vi.mocked(getPublicApiStudentAnalyticsService).mockRejectedValue(
      new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404)
    );

    const response = await app.request(`/audience/${PROFILE_ID}/analytics`);

    expect(response.status).toBe(404);
  });

  it('maps a non-team actor to 403', async () => {
    vi.mocked(getPublicApiStudentAnalyticsService).mockRejectedValue(
      new AppError('Automation actor must be an organization admin or tutor', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    const response = await app.request(`/audience/${PROFILE_ID}/analytics`);

    expect(response.status).toBe(403);
  });
});
