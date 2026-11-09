import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/courses/enrollments', () => ({
  enrollCourseStudentService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { generateSpecs } from 'hono-openapi';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { enrollCourseStudentService } from '@api/services/v1/courses/enrollments';
import { v1CourseEnrollmentsRouter } from '@api/routes/v1/courses/enrollments';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const ACTOR_ID = '33333333-3333-4333-8333-333333333333';
const MEMBER_ID = '44444444-4444-4444-8444-444444444444';

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', ORG_ID);
    c.set('actorId', ACTOR_ID);
    c.set('automationKey', { id: 'key-1', scopes: ['course:member:write'] } as never);
    c.set('oauthClientId', 'client-1');
    await next();
  })
  .route('/:courseId/enrollments', v1CourseEnrollmentsRouter);

const postJson = (path: string, body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

describe('v1CourseEnrollmentsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enrolls a student and returns 200 with the enrollment status', async () => {
    vi.mocked(enrollCourseStudentService).mockResolvedValue({
      status: 'enrolled',
      memberId: MEMBER_ID,
      inviteId: null,
      email: 'student@example.com'
    });

    const response = await app.request(
      `/${COURSE_ID}/enrollments`,
      postJson(`/${COURSE_ID}/enrollments`, { email: 'student@example.com', sendEmail: true })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: {
        status: 'enrolled',
        memberId: MEMBER_ID,
        inviteId: null,
        email: 'student@example.com'
      }
    });
  });

  it('returns 400 when the email parameter is invalid', async () => {
    const response = await app.request(
      `/${COURSE_ID}/enrollments`,
      postJson(`/${COURSE_ID}/enrollments`, { email: 'not-an-email' })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toMatchObject({
      success: false
    });
  });

  it('returns 409 when the email belongs to an organization admin or tutor', async () => {
    vi.mocked(enrollCourseStudentService).mockRejectedValue(
      new AppError(
        'This email belongs to an admin or tutor. Add them to the course from the dashboard',
        ErrorCodes.STAFF_CANNOT_ENROLL,
        409,
        'email'
      )
    );

    const response = await app.request(
      `/${COURSE_ID}/enrollments`,
      postJson(`/${COURSE_ID}/enrollments`, { email: 'staff@example.com' })
    );
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json).toMatchObject({
      success: false,
      code: ErrorCodes.STAFF_CANNOT_ENROLL
    });
  });

  it('documents the route under the Course Members tag with its summary', async () => {
    const enrollmentApp = new Hono().route('/public-api/v1/courses/{courseId}/enrollments', v1CourseEnrollmentsRouter);
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(enrollmentApp)) as never) as {
      paths: Record<string, Record<string, { summary?: string; tags?: string[] }>>;
    };

    expect(spec.paths['/public-api/v1/courses/{courseId}/enrollments']?.post).toMatchObject({
      summary: 'Enroll a student by email',
      tags: ['Course Members']
    });
  });
});
