import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { ROLE } from '@cio/utils/constants';

import type { Context, Next } from 'hono';

const mocks = vi.hoisted(() => ({
  getCourseById: vi.fn(),
  getCourseOrganizationId: vi.fn(),
  cloneCourse: vi.fn()
}));

vi.mock('@db/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@db/queries')>()),
  getCourseById: mocks.getCourseById,
  getCourseOrganizationId: mocks.getCourseOrganizationId
}));

vi.mock('@api/services/course/clone', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@api/services/course/clone')>()),
  cloneCourse: mocks.cloneCourse
}));

import { courseRouter } from '@api/routes/course/course';

const CALLER_ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const VICTIM_ORG_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const COURSE_ID = '9c4b1e2a-7d3f-4a8b-b6e5-1f2a3b4c5d6e';
const USER_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

function appAs(roleId: number) {
  const setContext = async (c: Context, next: Next) => {
    c.set('user', { id: USER_ID });
    c.set('session', { id: 'session' });
    c.set('orgRoles', { [CALLER_ORG_ID]: roleId });
    await next();
  };

  return new Hono().use(setContext).route('/course', courseRouter);
}

function cloneRequest(roleId: number, targetOrganizationId = CALLER_ORG_ID) {
  return appAs(roleId).request(`/course/${COURSE_ID}/clone`, {
    method: 'POST',
    headers: { 'cio-org-id': CALLER_ORG_ID, 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Copy', slug: 'copy', organizationId: targetOrganizationId })
  });
}

function givenSourceCourse(ownerOrgId: string, overrides: Record<string, unknown> = {}) {
  mocks.getCourseById.mockResolvedValue([{ id: COURSE_ID, status: 'ACTIVE', isTemplate: false, ...overrides }]);
  mocks.getCourseOrganizationId.mockResolvedValue(ownerOrgId);
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cloneCourse.mockResolvedValue({ id: 'new-course' });
});

describe('POST /course/:courseId/clone access', () => {
  it('clones a course owned by the caller org', async () => {
    givenSourceCourse(CALLER_ORG_ID);

    const response = await cloneRequest(ROLE.ADMIN);

    expect(response.status).toBe(200);
    expect(mocks.cloneCourse).toHaveBeenCalledWith(
      COURSE_ID,
      expect.objectContaining({ organizationId: CALLER_ORG_ID, userId: USER_ID })
    );
  });

  it('returns 404 for a course owned by another org', async () => {
    givenSourceCourse(VICTIM_ORG_ID);

    const response = await cloneRequest(ROLE.ADMIN);

    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe(ErrorCodes.COURSE_NOT_FOUND);
    expect(mocks.cloneCourse).not.toHaveBeenCalled();
  });

  it('returns 404 when the copy targets another org', async () => {
    givenSourceCourse(CALLER_ORG_ID);

    const response = await cloneRequest(ROLE.ADMIN, VICTIM_ORG_ID);

    expect(response.status).toBe(404);
    expect(mocks.cloneCourse).not.toHaveBeenCalled();
  });

  it('returns 404 for a deleted course', async () => {
    givenSourceCourse(CALLER_ORG_ID, { status: 'DELETED' });

    const response = await cloneRequest(ROLE.ADMIN);

    expect(response.status).toBe(404);
    expect(mocks.cloneCourse).not.toHaveBeenCalled();
  });

  it('rejects a student of the caller org', async () => {
    givenSourceCourse(CALLER_ORG_ID);

    const response = await cloneRequest(ROLE.STUDENT);

    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe(ErrorCodes.ORG_TEAM_NOT_AUTHORIZED);
    expect(mocks.cloneCourse).not.toHaveBeenCalled();
  });
});
