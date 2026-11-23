import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((callback: (tx: unknown) => unknown) => callback({})) }
}));
vi.mock('@cio/db/queries/group', () => ({ insertGroupMembersOnConflictDoNothing: vi.fn() }));
vi.mock('@cio/db/queries/organization', () => ({
  getOrgMembersByProfileIds: vi.fn(),
  insertOrganizationMembersOnConflictDoNothing: vi.fn()
}));
vi.mock('@cio/db/queries/learning-path/learning-path', () => ({
  insertLearningPathMembersOnConflictDoNothing: vi.fn(),
  getLearningPathById: vi.fn(),
  getLearningPathMemberByProfile: vi.fn(),
  listLearningPathCourses: vi.fn(),
  listProfileCourseProgress: vi.fn(),
  listEnrolledLearningPaths: vi.fn(),
  listExplorableLearningPaths: vi.fn(),
  listPathMembershipsForCourse: vi.fn(),
  markLearningPathMemberCompleted: vi.fn()
}));
vi.mock('@cio/core/services/webhook/emit', () => ({
  buildMemberSource: vi.fn((method: string) => ({ method })),
  emitCourseMemberAddedWebhookEvent: vi.fn(),
  emitOrganizationMemberWebhookEvent: vi.fn()
}));
vi.mock('@cio/core/services/notification/course-events', () => ({ notifyCourseEnrollment: vi.fn() }));
vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@api/services/product-events', () => ({ captureLearnersEnrolled: vi.fn() }));
vi.mock('@api/services/course/compliance', () => ({ ensureComplianceEnrollmentRecordsForProfiles: vi.fn() }));
vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn(),
  notifyStudentMilestone: vi.fn()
}));

import { insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import { getOrgMembersByProfileIds, insertOrganizationMembersOnConflictDoNothing } from '@cio/db/queries/organization';
import {
  getLearningPathById,
  getLearningPathMemberByProfile,
  insertLearningPathMembersOnConflictDoNothing,
  listLearningPathCourses,
  listProfileCourseProgress,
  type TLearningPathCourseRow
} from '@cio/db/queries/learning-path/learning-path';
import type { TLearningPath, TLearningPathMember } from '@cio/db/types';
import { notifyCourseEnrollment } from '@cio/core/services/notification/course-events';
import { ROLE } from '@cio/utils/constants';
import { assertStudentCapacityOrThrow } from '@api/services/organization/student-limit';
import { enrollStudentsInPath } from '@api/services/learning-path/enrollment';
import { enrollInLearningPathService } from '@api/services/learning-path/learner';

const ORG_ID = 'org-1';
const PATH_ID = 'path-1';
const PROFILE_ID = 'profile-1';

const path = {
  id: PATH_ID,
  organizationId: ORG_ID,
  name: 'Frontend path',
  slug: 'frontend-path',
  description: null,
  coverImage: null,
  status: 'ACTIVE',
  cost: 0,
  currency: 'USD',
  sequentialUnlock: true,
  selfEnrollment: true,
  autoEnroll: true
} as TLearningPath;

const courseRow = (courseId: string, overrides: Partial<TLearningPathCourseRow> = {}) =>
  ({
    courseId,
    groupId: `group-${courseId}`,
    title: courseId,
    isPublished: true,
    status: 'ACTIVE',
    cost: 0,
    metadata: {},
    ...overrides
  }) as TLearningPathCourseRow;

describe('enrollStudentsInPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(insertOrganizationMembersOnConflictDoNothing).mockResolvedValue([]);
    vi.mocked(insertLearningPathMembersOnConflictDoNothing).mockResolvedValue([]);
    vi.mocked(insertGroupMembersOnConflictDoNothing).mockResolvedValue([]);
  });

  it('counts only people new to the organization against the student limit', async () => {
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'existing', email: null, roleId: ROLE.STUDENT }
    ]);

    await enrollStudentsInPath({
      organizationId: ORG_ID,
      pathId: PATH_ID,
      profileIds: ['existing', 'new', 'new'],
      courseGroups: [{ courseId: 'a', groupId: 'group-a' }],
      method: 'admin',
      source: 'dashboard',
      actorProfileId: 'admin'
    });

    expect(assertStudentCapacityOrThrow).toHaveBeenCalledWith(ORG_ID, 1, expect.anything(), {
      deferNotification: true
    });
    expect(insertGroupMembersOnConflictDoNothing).toHaveBeenCalledWith(
      [
        { groupId: 'group-a', profileId: 'existing', roleId: ROLE.STUDENT },
        { groupId: 'group-a', profileId: 'new', roleId: ROLE.STUDENT }
      ],
      expect.anything()
    );
  });

  it('sends enrollment notifications only for course memberships it created', async () => {
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([]);
    vi.mocked(insertGroupMembersOnConflictDoNothing).mockResolvedValue([]);

    await enrollStudentsInPath({
      organizationId: ORG_ID,
      pathId: PATH_ID,
      profileIds: [PROFILE_ID],
      courseGroups: [{ courseId: 'a', groupId: 'group-a' }],
      method: 'self_enroll',
      source: 'dashboard',
      actorProfileId: PROFILE_ID
    });

    expect(notifyCourseEnrollment).not.toHaveBeenCalled();
  });
});

describe('enrollInLearningPathService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLearningPathById).mockResolvedValue(path);
    vi.mocked(listLearningPathCourses).mockResolvedValue([courseRow('a'), courseRow('b')]);
    vi.mocked(listProfileCourseProgress).mockResolvedValue([]);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: PROFILE_ID, email: null, roleId: ROLE.STUDENT }
    ]);
    vi.mocked(insertOrganizationMembersOnConflictDoNothing).mockResolvedValue([]);
    vi.mocked(insertLearningPathMembersOnConflictDoNothing).mockResolvedValue([]);
    vi.mocked(insertGroupMembersOnConflictDoNothing).mockResolvedValue([]);
  });

  it('enrolls a new learner in the path and every course', async () => {
    vi.mocked(getLearningPathMemberByProfile)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 'member-1', enrolledAt: '2026-03-01', completedAt: null } as TLearningPathMember);

    const result = await enrollInLearningPathService(ORG_ID, PATH_ID, PROFILE_ID);

    expect(insertLearningPathMembersOnConflictDoNothing).toHaveBeenCalledWith(
      [{ pathId: PATH_ID, profileId: PROFILE_ID, roleId: ROLE.STUDENT }],
      expect.anything()
    );
    expect(vi.mocked(insertGroupMembersOnConflictDoNothing).mock.calls[0][0]).toHaveLength(2);
    expect(result.isMember).toBe(true);
  });

  it('changes nothing when the learner is already a member', async () => {
    vi.mocked(getLearningPathMemberByProfile).mockResolvedValue({
      id: 'member-1',
      enrolledAt: '2026-03-01',
      completedAt: null
    } as TLearningPathMember);

    await enrollInLearningPathService(ORG_ID, PATH_ID, PROFILE_ID);

    expect(insertLearningPathMembersOnConflictDoNothing).not.toHaveBeenCalled();
    expect(insertGroupMembersOnConflictDoNothing).not.toHaveBeenCalled();
  });

  it('refuses a paid path', async () => {
    vi.mocked(getLearningPathById).mockResolvedValue({ ...path, cost: 4900 });
    vi.mocked(getLearningPathMemberByProfile).mockResolvedValue(null);

    await expect(enrollInLearningPathService(ORG_ID, PATH_ID, PROFILE_ID)).rejects.toMatchObject({
      code: 'LEARNING_PATH_NOT_ENROLLABLE'
    });
  });

  it('refuses a path that contains a paid course', async () => {
    vi.mocked(listLearningPathCourses).mockResolvedValue([courseRow('a'), courseRow('b', { cost: 4900 })]);
    vi.mocked(getLearningPathMemberByProfile).mockResolvedValue(null);

    await expect(enrollInLearningPathService(ORG_ID, PATH_ID, PROFILE_ID)).rejects.toMatchObject({
      code: 'LEARNING_PATH_NOT_ENROLLABLE'
    });
    expect(insertLearningPathMembersOnConflictDoNothing).not.toHaveBeenCalled();
  });

  it('refuses a path that contains a course closed to self-enrollment', async () => {
    vi.mocked(listLearningPathCourses).mockResolvedValue([
      courseRow('a'),
      courseRow('b', { metadata: { allowSelfEnrollment: false } as TLearningPathCourseRow['metadata'] })
    ]);
    vi.mocked(getLearningPathMemberByProfile).mockResolvedValue(null);

    await expect(enrollInLearningPathService(ORG_ID, PATH_ID, PROFILE_ID)).rejects.toMatchObject({
      code: 'LEARNING_PATH_NOT_ENROLLABLE'
    });
  });

  it('leaves deleted courses out of the courses it enrolls the learner in', async () => {
    vi.mocked(listLearningPathCourses).mockResolvedValue([
      courseRow('a'),
      courseRow('b', { status: 'DELETED', cost: 4900 })
    ]);
    vi.mocked(getLearningPathMemberByProfile)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 'member-1', enrolledAt: '2026-03-01', completedAt: null } as TLearningPathMember);

    await enrollInLearningPathService(ORG_ID, PATH_ID, PROFILE_ID);

    expect(vi.mocked(insertGroupMembersOnConflictDoNothing).mock.calls[0][0]).toEqual([
      { groupId: 'group-a', profileId: PROFILE_ID, roleId: ROLE.STUDENT }
    ]);
  });

  it('refuses a path from another organization', async () => {
    vi.mocked(getLearningPathById).mockResolvedValue({ ...path, organizationId: 'other-org' });

    await expect(enrollInLearningPathService(ORG_ID, PATH_ID, PROFILE_ID)).rejects.toMatchObject({
      code: 'LEARNING_PATH_NOT_FOUND'
    });
  });
});
