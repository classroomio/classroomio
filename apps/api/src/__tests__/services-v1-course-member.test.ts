import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseMember: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn()
}));

vi.mock('@api/services/course/people', () => ({
  listPaginatedCourseMembers: vi.fn(),
  addMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  resetMemberCourseProgress: vi.fn()
}));

vi.mock('@cio/core/services/course/course', () => ({
  getUserCourseAnalytics: vi.fn()
}));

import { AppError } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getCourseMember } from '@cio/db/queries/course/people';
import { getProfileById } from '@cio/db/queries/auth';
import { addMember, deleteMember, listPaginatedCourseMembers, resetMemberCourseProgress, updateMember } from '@api/services/course/people';
import { getUserCourseAnalytics } from '@cio/core/services/course/course';
import {
  addCourseMemberService,
  deleteCourseMemberService,
  getCourseMemberAnalyticsService,
  getCourseMemberService,
  listCourseMembersService,
  resetCourseMemberProgressService,
  updateCourseMemberService
} from '@api/services/v1/course-member';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const MEMBER_ID = 'member-1';

describe('services/v1/course-member', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  });

  it('throws 404 when the course does not belong to the organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

    await expect(
      listCourseMembersService(ORG_ID, { courseId: COURSE_ID }, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(listPaginatedCourseMembers).not.toHaveBeenCalled();
  });

  it('listCourseMembersService delegates after the org check', async () => {
    vi.mocked(listPaginatedCourseMembers).mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    } as Awaited<ReturnType<typeof listPaginatedCourseMembers>>);

    const query = { page: 1, limit: 20 };
    await listCourseMembersService(ORG_ID, { courseId: COURSE_ID }, query);

    expect(listPaginatedCourseMembers).toHaveBeenCalledWith(COURSE_ID, query);
  });

  it('addCourseMemberService delegates to the singular addMember (email, no profile lookup needed)', async () => {
    const payload = { roleId: ROLE.STUDENT, email: 'student@example.com' };
    vi.mocked(addMember).mockResolvedValue({ id: MEMBER_ID } as Awaited<ReturnType<typeof addMember>>);

    await addCourseMemberService(ORG_ID, { courseId: COURSE_ID }, payload);

    expect(getProfileById).not.toHaveBeenCalled();
    expect(addMember).toHaveBeenCalledWith(COURSE_ID, payload);
  });

  it('addCourseMemberService returns 404 for a well-formed but nonexistent profileId', async () => {
    const payload = { roleId: ROLE.STUDENT, profileId: 'missing-profile' };
    vi.mocked(getProfileById).mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof getProfileById>>);

    await expect(addCourseMemberService(ORG_ID, { courseId: COURSE_ID }, payload)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(addMember).not.toHaveBeenCalled();
  });

  it('addCourseMemberService delegates once the profileId is confirmed to exist', async () => {
    const payload = { roleId: ROLE.STUDENT, profileId: 'profile-1' };
    vi.mocked(getProfileById).mockResolvedValue({ id: 'profile-1' } as Awaited<ReturnType<typeof getProfileById>>);
    vi.mocked(addMember).mockResolvedValue({ id: MEMBER_ID } as Awaited<ReturnType<typeof addMember>>);

    await addCourseMemberService(ORG_ID, { courseId: COURSE_ID }, payload);

    expect(addMember).toHaveBeenCalledWith(COURSE_ID, payload);
  });

  it('getCourseMemberService returns 404 when the member is missing', async () => {
    vi.mocked(getCourseMember).mockResolvedValue(null);

    await expect(getCourseMemberService(ORG_ID, { courseId: COURSE_ID, memberId: MEMBER_ID })).rejects.toBeInstanceOf(
      AppError
    );
  });

  it('getCourseMemberService returns the member when found', async () => {
    const member = { id: MEMBER_ID, roleId: ROLE.STUDENT, profileId: 'profile-1' };
    vi.mocked(getCourseMember).mockResolvedValue(member as Awaited<ReturnType<typeof getCourseMember>>);

    const result = await getCourseMemberService(ORG_ID, { courseId: COURSE_ID, memberId: MEMBER_ID });

    expect(result).toEqual(member);
  });

  it('updateCourseMemberService delegates to updateMember', async () => {
    const payload = { roleId: ROLE.TUTOR };
    vi.mocked(updateMember).mockResolvedValue({ id: MEMBER_ID } as Awaited<ReturnType<typeof updateMember>>);

    await updateCourseMemberService(ORG_ID, { courseId: COURSE_ID, memberId: MEMBER_ID }, payload);

    expect(updateMember).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID, payload);
  });

  it('deleteCourseMemberService delegates to deleteMember', async () => {
    vi.mocked(deleteMember).mockResolvedValue({ id: MEMBER_ID } as Awaited<ReturnType<typeof deleteMember>>);

    await deleteCourseMemberService(ORG_ID, { courseId: COURSE_ID, memberId: MEMBER_ID });

    expect(deleteMember).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID);
  });

  it('resetCourseMemberProgressService requires an actor', async () => {
    await expect(
      resetCourseMemberProgressService(ORG_ID, null, { courseId: COURSE_ID, memberId: MEMBER_ID })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(resetMemberCourseProgress).not.toHaveBeenCalled();
  });

  it('resetCourseMemberProgressService delegates with the actor id', async () => {
    vi.mocked(resetMemberCourseProgress).mockResolvedValue({} as Awaited<ReturnType<typeof resetMemberCourseProgress>>);

    await resetCourseMemberProgressService(ORG_ID, 'actor-1', { courseId: COURSE_ID, memberId: MEMBER_ID });

    expect(resetMemberCourseProgress).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID, 'actor-1');
  });

  it('getCourseMemberAnalyticsService returns 404 when the member has no profileId', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({
      id: MEMBER_ID,
      roleId: ROLE.STUDENT,
      profileId: null
    } as Awaited<ReturnType<typeof getCourseMember>>);

    await expect(
      getCourseMemberAnalyticsService(ORG_ID, { courseId: COURSE_ID, memberId: MEMBER_ID }, { includeProgressImpact: false })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(getUserCourseAnalytics).not.toHaveBeenCalled();
  });

  it('getCourseMemberAnalyticsService returns 400 for a non-student member', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({
      id: MEMBER_ID,
      roleId: ROLE.TUTOR,
      profileId: 'profile-1'
    } as Awaited<ReturnType<typeof getCourseMember>>);

    await expect(
      getCourseMemberAnalyticsService(ORG_ID, { courseId: COURSE_ID, memberId: MEMBER_ID }, { includeProgressImpact: false })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(getUserCourseAnalytics).not.toHaveBeenCalled();
  });

  it('getCourseMemberAnalyticsService resolves memberId to profileId before calling getUserCourseAnalytics', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({
      id: MEMBER_ID,
      roleId: ROLE.STUDENT,
      profileId: 'profile-1'
    } as Awaited<ReturnType<typeof getCourseMember>>);
    vi.mocked(getUserCourseAnalytics).mockResolvedValue({ some: 'analytics' } as unknown as Awaited<
      ReturnType<typeof getUserCourseAnalytics>
    >);

    const result = await getCourseMemberAnalyticsService(
      ORG_ID,
      { courseId: COURSE_ID, memberId: MEMBER_ID },
      { includeProgressImpact: true }
    );

    expect(getUserCourseAnalytics).toHaveBeenCalledWith(COURSE_ID, 'profile-1', { includeProgressImpact: true });
    expect(result).toEqual({ some: 'analytics' });
  });
});
