import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/cohort', () => ({
  listCohortsService: vi.fn(),
  createPublicApiCohortService: vi.fn(),
  getPublicApiCohortService: vi.fn(),
  updatePublicApiCohortService: vi.fn(),
  deletePublicApiCohortService: vi.fn()
}));

vi.mock('@api/services/v1/cohort-member', () => ({
  listPublicApiCohortMembersService: vi.fn(),
  addPublicApiCohortMembersService: vi.fn(),
  updatePublicApiCohortMemberService: vi.fn(),
  removePublicApiCohortMemberService: vi.fn()
}));

vi.mock('@api/services/v1/cohort-course', () => ({
  listPublicApiCohortCoursesService: vi.fn(),
  addPublicApiCohortCourseService: vi.fn(),
  removePublicApiCohortCourseService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  createPublicApiCohortService,
  deletePublicApiCohortService,
  getPublicApiCohortService,
  listCohortsService,
  updatePublicApiCohortService
} from '@api/services/v1/cohort';
import {
  addPublicApiCohortMembersService,
  listPublicApiCohortMembersService,
  removePublicApiCohortMemberService,
  updatePublicApiCohortMemberService
} from '@api/services/v1/cohort-member';
import {
  addPublicApiCohortCourseService,
  listPublicApiCohortCoursesService,
  removePublicApiCohortCourseService
} from '@api/services/v1/cohort-course';
import { v1CohortsRouter } from '@api/routes/v1/cohorts';

const COHORT_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CohortsRouter);

const jsonRequest = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

describe('v1CohortsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists cohorts for the org', async () => {
    vi.mocked(listCohortsService).mockResolvedValue([]);

    const response = await app.request('/');

    expect(response.status).toBe(200);
    expect(listCohortsService).toHaveBeenCalledWith('org-1');
  });

  it('creates a cohort using the automation actor', async () => {
    vi.mocked(createPublicApiCohortService).mockResolvedValue({ id: COHORT_ID } as Awaited<
      ReturnType<typeof createPublicApiCohortService>
    >);

    const response = await app.request('/', jsonRequest('POST', { name: 'Cohort A' }));

    expect(response.status).toBe(201);
    expect(createPublicApiCohortService).toHaveBeenCalledWith('org-1', 'actor-1', { name: 'Cohort A' });
  });

  it('gets, updates, and deletes a cohort by id', async () => {
    vi.mocked(getPublicApiCohortService).mockResolvedValue({ id: COHORT_ID } as Awaited<
      ReturnType<typeof getPublicApiCohortService>
    >);
    vi.mocked(updatePublicApiCohortService).mockResolvedValue({ id: COHORT_ID } as Awaited<
      ReturnType<typeof updatePublicApiCohortService>
    >);
    vi.mocked(deletePublicApiCohortService).mockResolvedValue({ id: COHORT_ID } as Awaited<
      ReturnType<typeof deletePublicApiCohortService>
    >);

    const got = await app.request(`/${COHORT_ID}`);
    const updated = await app.request(`/${COHORT_ID}`, jsonRequest('PUT', { name: 'Renamed' }));
    const deleted = await app.request(`/${COHORT_ID}`, { method: 'DELETE' });

    expect(got.status).toBe(200);
    expect(getPublicApiCohortService).toHaveBeenCalledWith('org-1', { cohortId: COHORT_ID });
    expect(updated.status).toBe(200);
    expect(updatePublicApiCohortService).toHaveBeenCalledWith('org-1', { cohortId: COHORT_ID }, { name: 'Renamed' });
    expect(deleted.status).toBe(200);
    expect(deletePublicApiCohortService).toHaveBeenCalledWith('org-1', { cohortId: COHORT_ID });
  });

  it('routes nested /members to the member router, not the /:cohortId handlers', async () => {
    vi.mocked(listPublicApiCohortMembersService).mockResolvedValue([]);

    const response = await app.request(`/${COHORT_ID}/members`);

    expect(response.status).toBe(200);
    expect(listPublicApiCohortMembersService).toHaveBeenCalledWith('org-1', { cohortId: COHORT_ID });
    expect(getPublicApiCohortService).not.toHaveBeenCalled();
  });

  it('adds, updates, and removes cohort members', async () => {
    vi.mocked(addPublicApiCohortMembersService).mockResolvedValue({ added: [], errors: [] });
    vi.mocked(updatePublicApiCohortMemberService).mockResolvedValue({ id: MEMBER_ID } as Awaited<
      ReturnType<typeof updatePublicApiCohortMemberService>
    >);
    vi.mocked(removePublicApiCohortMemberService).mockResolvedValue({ id: MEMBER_ID } as Awaited<
      ReturnType<typeof removePublicApiCohortMemberService>
    >);

    const added = await app.request(
      `/${COHORT_ID}/members`,
      jsonRequest('POST', { members: [{ email: 'student@example.com', roleId: 3 }] })
    );
    const updated = await app.request(`/${COHORT_ID}/members/${MEMBER_ID}`, jsonRequest('PUT', { roleId: 2 }));
    const removed = await app.request(`/${COHORT_ID}/members/${MEMBER_ID}`, { method: 'DELETE' });

    expect(added.status).toBe(201);
    expect(addPublicApiCohortMembersService).toHaveBeenCalledWith(
      'org-1',
      { cohortId: COHORT_ID },
      { members: [{ email: 'student@example.com', roleId: 3 }] }
    );
    expect(updated.status).toBe(200);
    expect(updatePublicApiCohortMemberService).toHaveBeenCalledWith(
      'org-1',
      { cohortId: COHORT_ID, memberId: MEMBER_ID },
      { roleId: 2 }
    );
    expect(removed.status).toBe(200);
    expect(removePublicApiCohortMemberService).toHaveBeenCalledWith('org-1', {
      cohortId: COHORT_ID,
      memberId: MEMBER_ID
    });
  });

  it('routes nested /courses to the course router, not the /:cohortId handlers', async () => {
    vi.mocked(listPublicApiCohortCoursesService).mockResolvedValue([]);

    const response = await app.request(`/${COHORT_ID}/courses`);

    expect(response.status).toBe(200);
    expect(listPublicApiCohortCoursesService).toHaveBeenCalledWith('org-1', { cohortId: COHORT_ID });
    expect(getPublicApiCohortService).not.toHaveBeenCalled();
  });

  it('adds and removes cohort courses', async () => {
    vi.mocked(addPublicApiCohortCourseService).mockResolvedValue({ courseId: COURSE_ID } as Awaited<
      ReturnType<typeof addPublicApiCohortCourseService>
    >);
    vi.mocked(removePublicApiCohortCourseService).mockResolvedValue({ courseId: COURSE_ID } as Awaited<
      ReturnType<typeof removePublicApiCohortCourseService>
    >);

    const added = await app.request(`/${COHORT_ID}/courses`, jsonRequest('POST', { courseId: COURSE_ID }));
    const removed = await app.request(`/${COHORT_ID}/courses/${COURSE_ID}`, { method: 'DELETE' });

    expect(added.status).toBe(201);
    expect(addPublicApiCohortCourseService).toHaveBeenCalledWith(
      'org-1',
      { cohortId: COHORT_ID },
      { courseId: COURSE_ID }
    );
    expect(removed.status).toBe(200);
    expect(removePublicApiCohortCourseService).toHaveBeenCalledWith('org-1', {
      cohortId: COHORT_ID,
      courseId: COURSE_ID
    });
  });
});
