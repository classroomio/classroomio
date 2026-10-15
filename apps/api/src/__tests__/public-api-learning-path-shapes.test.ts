import { describe, expect, it } from 'vitest';

import type {
  addCoursesToPublicApiLearningPathService,
  getLearningPathService,
  listLearningPathsService,
  listPublicApiLearningPathMembersService,
  removeCourseFromPublicApiPathService,
  reorderPublicApiPathCoursesService,
  updatePublicApiLearningPathService
} from '@api/services/v1/learning-paths';
import type { listEnrolledService } from '@api/services/v1/enrolled';
import {
  ZPublicApiEnrolledListResponse,
  ZPublicApiLearningPathDetailResponse,
  ZPublicApiLearningPathListResponse,
  ZPublicApiLearningPathResponse,
  ZPublicApiPathCourseLinkResponse,
  ZPublicApiPathCourseLinksResponse,
  ZPublicApiPathMembersResponse,
  ZPublicApiReorderPathCoursesResponse
} from '@cio/utils/validation/public-api';
import type { TLearningPath } from '@cio/db/types';

/**
 * Every v1 learning-path / enrolled response schema must accept what the
 * route actually returns. Fixtures are typed with `satisfies` against each
 * service's real return type, so a service shape change fails the typecheck
 * and a schema that rejects the real shape fails here.
 */

type Result<TFn extends (...args: never[]) => unknown> = Awaited<ReturnType<TFn>>;

const PATH_ID = '22222222-2222-4222-8222-222222222222';
const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '44444444-4444-4444-8444-444444444444';
const AT = '2026-01-01T00:00:00.000Z';

const PATH_ROW = {
  id: PATH_ID,
  publicId: 'AbC123Xy',
  organizationId: ORG_ID,
  name: 'Path One',
  slug: 'path-one',
  status: 'ACTIVE',
  description: 'Learn things',
  coverImage: null,
  isPublished: true,
  cost: 0,
  currency: 'USD',
  sequentialUnlock: true,
  selfEnrollment: true,
  certificate: {},
  welcomeEmailMessage: null,
  landingPage: {},
  courseOrderSetAt: null,
  createdByProfileId: null,
  createdAt: AT,
  updatedAt: AT
} satisfies TLearningPath;

const COURSE_LINK = {
  id: '33333333-3333-4333-8333-333333333333',
  learningPathId: PATH_ID,
  courseId: COURSE_ID,
  order: 0,
  addedAt: AT,
  removedAt: null
};

const PAGINATION = { page: 1, limit: 20, total: 1, totalPages: 1 };

describe('v1 learning-path responses match the routes', () => {
  it('create, update and delete return a plain path row', () => {
    const data = PATH_ROW satisfies Result<typeof updatePublicApiLearningPathService>;

    expect(ZPublicApiLearningPathResponse.parse({ success: true, data })).toBeTruthy();
  });

  it('list returns path rows with counts and pagination', () => {
    const result = {
      data: [{ ...PATH_ROW, courseCount: 1, memberCount: 2, completionsCount: 1, completionRate: 50 }],
      pagination: PAGINATION
    } satisfies Result<typeof listLearningPathsService>;

    expect(
      ZPublicApiLearningPathListResponse.parse({ success: true, data: result.data, pagination: result.pagination })
    ).toBeTruthy();
  });

  it('detail returns the path with ordered course ids and titled courses', () => {
    const course = {
      ...COURSE_LINK,
      title: 'First',
      description: 'Course one',
      cost: 0,
      currency: 'USD',
      coverImage: null,
      lessonsCount: 2,
      exercisesCount: 1
    };
    const data = {
      ...PATH_ROW,
      courseIds: [COURSE_ID],
      courses: [course]
    } satisfies Partial<Result<typeof getLearningPathService>>;

    expect(ZPublicApiLearningPathDetailResponse.parse({ success: true, data })).toBeTruthy();
  });

  it('add courses returns untitled link rows', () => {
    const data = [COURSE_LINK] satisfies Result<typeof addCoursesToPublicApiLearningPathService>;

    expect(ZPublicApiPathCourseLinksResponse.parse({ success: true, data })).toBeTruthy();
  });

  it('remove course returns the soft-deleted link row', () => {
    const data = { ...COURSE_LINK, removedAt: AT } satisfies Result<typeof removeCourseFromPublicApiPathService>;

    expect(ZPublicApiPathCourseLinkResponse.parse({ success: true, data })).toBeTruthy();
  });

  it('reorder returns an acknowledgement', () => {
    const data = { reordered: true } satisfies Result<typeof reorderPublicApiPathCoursesService>;

    expect(ZPublicApiReorderPathCoursesResponse.parse({ success: true, data })).toBeTruthy();
  });

  it('members returns member rows with pagination', () => {
    const member = {
      id: '55555555-5555-4555-8555-555555555555',
      profileId: '66666666-6666-4666-8666-666666666666',
      email: 'ada@test.dev',
      roleId: 3,
      status: 'IN_PROGRESS',
      enrolledAt: AT
    } satisfies Partial<Result<typeof listPublicApiLearningPathMembersService>['data'][number]>;

    expect(ZPublicApiPathMembersResponse.parse({ success: true, data: [member], pagination: PAGINATION })).toBeTruthy();
  });

  it('enrolled returns kind-tagged items with pagination and counts', () => {
    const result = {
      data: [],
      pagination: PAGINATION,
      counts: { inProgress: 0, completed: 0 }
    } satisfies Partial<Result<typeof listEnrolledService>>;

    expect(ZPublicApiEnrolledListResponse.parse({ success: true, ...result })).toBeTruthy();
  });
});
