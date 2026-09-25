import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseMember: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn()
}));

vi.mock('@api/services/course/people', () => ({
  listPaginatedCourseMembers: vi.fn(),
  addMembers: vi.fn(),
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
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseMember } from '@cio/db/queries/course/people';
import {
  getOrganizationMemberIdByOrgAndProfile,
  getOrganizationMembersByNormalizedEmails
} from '@cio/db/queries/organization';
import {
  addMembers,
  deleteMember,
  listPaginatedCourseMembers,
  resetMemberCourseProgress,
  updateMember
} from '@api/services/course/people';
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
const ACTOR_ID = 'actor-1';

const courseParams = { courseId: COURSE_ID };
const memberParams = { courseId: COURSE_ID, memberId: MEMBER_ID };
const firstPage = { page: 1, limit: 20 };

describe('services/v1/course-member', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'a@example.com', profileId: 'profile-1', roleId: ROLE.STUDENT }
    ]);
  });

  it('throws 404 when the course does not belong to the organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

    await expect(listCourseMembersService(ORG_ID, ACTOR_ID, courseParams, firstPage)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(listPaginatedCourseMembers).not.toHaveBeenCalled();
  });

  it('rejects reads and writes when the actor is not a course tutor/admin or org admin, like the dashboard', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(listCourseMembersService(ORG_ID, ACTOR_ID, courseParams, firstPage)).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(
      addCourseMemberService(ORG_ID, ACTOR_ID, courseParams, { roleId: ROLE.STUDENT, email: 'a@example.com' })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(deleteCourseMemberService(ORG_ID, ACTOR_ID, memberParams)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith(COURSE_ID, ACTOR_ID);
    expect(listPaginatedCourseMembers).not.toHaveBeenCalled();
    expect(addMembers).not.toHaveBeenCalled();
    expect(deleteMember).not.toHaveBeenCalled();
  });

  it('rejects every call with no automation actor', async () => {
    await expect(listCourseMembersService(ORG_ID, null, courseParams, firstPage)).rejects.toMatchObject({
      statusCode: 401
    });
    await expect(getCourseMemberService(ORG_ID, null, memberParams)).rejects.toMatchObject({ statusCode: 401 });
    expect(isCourseTeamMemberOrOrgAdmin).not.toHaveBeenCalled();
  });

  it('listCourseMembersService delegates once the actor passes the team check', async () => {
    vi.mocked(listPaginatedCourseMembers).mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    } as Awaited<ReturnType<typeof listPaginatedCourseMembers>>);

    await listCourseMembersService(ORG_ID, ACTOR_ID, courseParams, firstPage);

    expect(listPaginatedCourseMembers).toHaveBeenCalledWith(COURSE_ID, firstPage);
  });

  it('addCourseMemberService adds an org member by email, linked to their profile, and returns the single member', async () => {
    const payload = { roleId: ROLE.STUDENT, email: 'a@example.com' };
    vi.mocked(addMembers).mockResolvedValue([{ id: MEMBER_ID }] as Awaited<ReturnType<typeof addMembers>>);

    const result = await addCourseMemberService(ORG_ID, ACTOR_ID, courseParams, payload);

    expect(getOrganizationMembersByNormalizedEmails).toHaveBeenCalledWith(ORG_ID, ['a@example.com']);
    expect(addMembers).toHaveBeenCalledWith(COURSE_ID, [{ ...payload, profileId: 'profile-1' }]);
    expect(result).toEqual({ id: MEMBER_ID });
  });

  it('addCourseMemberService keeps a pending org member (no profile yet) as an email-only member', async () => {
    const payload = { roleId: ROLE.STUDENT, email: 'pending@example.com' };
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'pending@example.com', profileId: null, roleId: ROLE.STUDENT }
    ]);
    vi.mocked(addMembers).mockResolvedValue([{ id: MEMBER_ID }] as Awaited<ReturnType<typeof addMembers>>);

    await addCourseMemberService(ORG_ID, ACTOR_ID, courseParams, payload);

    expect(addMembers).toHaveBeenCalledWith(COURSE_ID, [payload]);
  });

  it('addCourseMemberService returns 404 when the email does not belong to this organization', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([]);

    await expect(
      addCourseMemberService(ORG_ID, ACTOR_ID, courseParams, { roleId: ROLE.STUDENT, email: 'outsider@example.com' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(addMembers).not.toHaveBeenCalled();
  });

  it('addCourseMemberService returns 404 when the profileId does not belong to this organization', async () => {
    const payload = { roleId: ROLE.STUDENT, profileId: 'other-org-profile' };
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null);

    await expect(addCourseMemberService(ORG_ID, ACTOR_ID, courseParams, payload)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(getOrganizationMemberIdByOrgAndProfile).toHaveBeenCalledWith(ORG_ID, 'other-org-profile');
    expect(addMembers).not.toHaveBeenCalled();
  });

  it('addCourseMemberService passes a 409 through when the person is already a member', async () => {
    vi.mocked(addMembers).mockRejectedValue(new AppError('Already a member of this course', 'CONFLICT', 409));

    await expect(
      addCourseMemberService(ORG_ID, ACTOR_ID, courseParams, { roleId: ROLE.STUDENT, email: 'a@example.com' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('getCourseMemberService returns 404 when the member is missing or in another course', async () => {
    vi.mocked(getCourseMember).mockResolvedValue(null);

    await expect(getCourseMemberService(ORG_ID, ACTOR_ID, memberParams)).rejects.toMatchObject({ statusCode: 404 });
    expect(getCourseMember).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID);
  });

  it('getCourseMemberService returns the member when found', async () => {
    const member = { id: MEMBER_ID, roleId: ROLE.STUDENT, profileId: 'profile-1' };
    vi.mocked(getCourseMember).mockResolvedValue(member as Awaited<ReturnType<typeof getCourseMember>>);

    const result = await getCourseMemberService(ORG_ID, ACTOR_ID, memberParams);

    expect(result).toEqual(member);
  });

  it('updateCourseMemberService delegates to updateMember', async () => {
    const payload = { roleId: ROLE.TUTOR };
    vi.mocked(updateMember).mockResolvedValue({ id: MEMBER_ID } as Awaited<ReturnType<typeof updateMember>>);

    await updateCourseMemberService(ORG_ID, ACTOR_ID, memberParams, payload);

    expect(updateMember).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID, payload);
  });

  it('deleteCourseMemberService delegates to deleteMember', async () => {
    vi.mocked(deleteMember).mockResolvedValue({ id: MEMBER_ID } as Awaited<ReturnType<typeof deleteMember>>);

    await deleteCourseMemberService(ORG_ID, ACTOR_ID, memberParams);

    expect(deleteMember).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID);
  });

  it('update and delete pass a 404 through for a member from another course', async () => {
    const notFound = new AppError('Course member not found', 'NOT_FOUND', 404);
    vi.mocked(updateMember).mockRejectedValue(notFound);
    vi.mocked(deleteMember).mockRejectedValue(notFound);

    await expect(
      updateCourseMemberService(ORG_ID, ACTOR_ID, memberParams, { roleId: ROLE.TUTOR })
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(deleteCourseMemberService(ORG_ID, ACTOR_ID, memberParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(updateMember).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID, { roleId: ROLE.TUTOR });
    expect(deleteMember).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID);
  });

  it('resetCourseMemberProgressService requires an actor', async () => {
    await expect(resetCourseMemberProgressService(ORG_ID, null, memberParams)).rejects.toMatchObject({
      statusCode: 401
    });
    expect(resetMemberCourseProgress).not.toHaveBeenCalled();
  });

  it('resetCourseMemberProgressService delegates with the actor id', async () => {
    vi.mocked(resetMemberCourseProgress).mockResolvedValue({} as Awaited<ReturnType<typeof resetMemberCourseProgress>>);

    await resetCourseMemberProgressService(ORG_ID, ACTOR_ID, memberParams);

    expect(resetMemberCourseProgress).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID, ACTOR_ID);
  });

  it('getCourseMemberAnalyticsService returns 404 when the member has no profileId', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({
      id: MEMBER_ID,
      roleId: ROLE.STUDENT,
      profileId: null
    } as Awaited<ReturnType<typeof getCourseMember>>);

    await expect(
      getCourseMemberAnalyticsService(ORG_ID, ACTOR_ID, memberParams, { includeProgressImpact: false })
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
      getCourseMemberAnalyticsService(ORG_ID, ACTOR_ID, memberParams, { includeProgressImpact: false })
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

    const result = await getCourseMemberAnalyticsService(ORG_ID, ACTOR_ID, memberParams, {
      includeProgressImpact: true
    });

    expect(getUserCourseAnalytics).toHaveBeenCalledWith(COURSE_ID, 'profile-1', { includeProgressImpact: true });
    expect(result).toEqual({ some: 'analytics' });
  });
});
