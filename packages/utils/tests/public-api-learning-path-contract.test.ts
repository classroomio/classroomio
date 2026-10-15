import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  ZPublicApiEnrolledItem,
  ZPublicApiEnrolledListResponse,
  ZPublicApiLearningPath,
  ZPublicApiLearningPathDetailResponse,
  ZPublicApiLearningPathListResponse,
  ZPublicApiPagination,
  ZPublicApiPathCourse,
  ZPublicApiPathMember,
  ZPublicApiPathMembersResponse
} from '../src/validation/public-api/learning-path-responses';

const PATH = {
  id: '22222222-2222-4222-8222-222222222222',
  publicId: 'AbC123Xy',
  organizationId: '11111111-1111-4111-8111-111111111111',
  name: 'Path One',
  slug: 'path-one',
  description: 'Learn things',
  coverImage: null,
  isPublished: true,
  cost: 0,
  currency: 'USD',
  sequentialUnlock: true,
  selfEnrollment: true,
  status: 'ACTIVE',
  courseCount: 2,
  memberCount: 10,
  completionsCount: 3,
  completionRate: 30,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z'
};

const COURSE = {
  id: '33333333-3333-4333-8333-333333333333',
  learningPathId: '22222222-2222-4222-8222-222222222222',
  courseId: '44444444-4444-4444-8444-444444444444',
  order: 0,
  title: 'First'
};

const MEMBER = {
  id: '55555555-5555-4555-8555-555555555555',
  profileId: '66666666-6666-4666-8666-666666666666',
  email: 'ada@test.dev',
  roleId: 3,
  status: 'IN_PROGRESS',
  enrolledAt: '2026-01-01T00:00:00.000Z'
};

describe('public API learning path contracts', () => {
  it('accepts a representative path, course, member and pagination payload', () => {
    expect(ZPublicApiLearningPath.parse(PATH)).toMatchObject({ id: PATH.id, name: 'Path One' });
    expect(ZPublicApiPathCourse.parse(COURSE)).toMatchObject({ courseId: COURSE.courseId });
    expect(ZPublicApiPathMember.parse(MEMBER)).toMatchObject({ roleId: 3 });
    expect(ZPublicApiPagination.parse({ page: 1, limit: 20, total: 0, totalPages: 0 })).toMatchObject({ page: 1 });
  });

  it('accepts list, detail, members and enrolled envelopes', () => {
    expect(
      ZPublicApiLearningPathListResponse.parse({
        success: true,
        data: [PATH],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      })
    ).toMatchObject({ success: true });
    expect(
      ZPublicApiLearningPathDetailResponse.parse({
        success: true,
        data: { ...PATH, courseIds: [COURSE.courseId], courses: [COURSE] }
      })
    ).toMatchObject({ success: true });
    expect(
      ZPublicApiPathMembersResponse.parse({
        success: true,
        data: [MEMBER],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      })
    ).toMatchObject({ success: true });
    expect(
      ZPublicApiEnrolledListResponse.parse({
        success: true,
        data: [
          { kind: 'course', data: { id: 'c-1', title: 'Excel' } },
          { kind: 'learning_path', data: { id: 'p-1', name: 'Basics' } }
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
        counts: { inProgress: 1, completed: 1 }
      })
    ).toMatchObject({ success: true });
  });

  it('rejects an enrolled item with an unknown kind', () => {
    expect(() => ZPublicApiEnrolledItem.parse({ kind: 'program', data: {} })).toThrow();
  });

  it('snapshots the generated JSON schemas', () => {
    expect(z.toJSONSchema(ZPublicApiLearningPathListResponse)).toMatchSnapshot();
    expect(z.toJSONSchema(ZPublicApiLearningPathDetailResponse)).toMatchSnapshot();
    expect(z.toJSONSchema(ZPublicApiPathMembersResponse)).toMatchSnapshot();
    expect(z.toJSONSchema(ZPublicApiEnrolledListResponse)).toMatchSnapshot();
  });
});
