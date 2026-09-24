import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn()
}));

vi.mock('@api/services/course/invite', () => ({
  listPaginatedStudentInvites: vi.fn(),
  createStudentInvite: vi.fn(),
  revokeStudentInvite: vi.fn()
}));

import { AppError } from '@api/utils/errors';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { createStudentInvite, listPaginatedStudentInvites, revokeStudentInvite } from '@api/services/course/invite';
import {
  createCourseInviteService,
  listCourseInvitesService,
  revokeCourseInviteService
} from '@api/services/v1/course-invite';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const INVITE_ID = 'invite-1';
const ACTOR_ID = 'actor-1';

const courseParams = { courseId: COURSE_ID };
const invitePayload = { preset: 'MULTI_USE_30D', recipientEmails: ['a@example.com'], sendEmail: false } as Parameters<
  typeof createCourseInviteService
>[3];

describe('services/v1/course-invite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
  });

  it('throws 404 when the course does not belong to the organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

    await expect(
      listCourseInvitesService(ORG_ID, ACTOR_ID, courseParams, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(listPaginatedStudentInvites).not.toHaveBeenCalled();
  });

  it('rejects list, create and revoke when the actor is not a course tutor/admin or org admin', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(
      listCourseInvitesService(ORG_ID, ACTOR_ID, courseParams, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(createCourseInviteService(ORG_ID, ACTOR_ID, courseParams, invitePayload)).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(
      revokeCourseInviteService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID, inviteId: INVITE_ID })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(listPaginatedStudentInvites).not.toHaveBeenCalled();
    expect(createStudentInvite).not.toHaveBeenCalled();
    expect(revokeStudentInvite).not.toHaveBeenCalled();
  });

  it('listCourseInvitesService delegates once the actor passes the team check', async () => {
    vi.mocked(listPaginatedStudentInvites).mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    } as Awaited<ReturnType<typeof listPaginatedStudentInvites>>);

    const query = { page: 1, limit: 20 };
    await listCourseInvitesService(ORG_ID, ACTOR_ID, courseParams, query);

    expect(listPaginatedStudentInvites).toHaveBeenCalledWith(COURSE_ID, query);
  });

  it('createCourseInviteService requires an actor', async () => {
    await expect(createCourseInviteService(ORG_ID, null, courseParams, invitePayload)).rejects.toMatchObject({
      statusCode: 401
    });
    expect(createStudentInvite).not.toHaveBeenCalled();
  });

  it('createCourseInviteService delegates with the actor id', async () => {
    vi.mocked(createStudentInvite).mockResolvedValue({ id: INVITE_ID } as unknown as Awaited<
      ReturnType<typeof createStudentInvite>
    >);

    await createCourseInviteService(ORG_ID, ACTOR_ID, courseParams, invitePayload);

    expect(createStudentInvite).toHaveBeenCalledWith(COURSE_ID, ACTOR_ID, invitePayload);
  });

  it('revokeCourseInviteService requires an actor', async () => {
    await expect(
      revokeCourseInviteService(ORG_ID, null, { courseId: COURSE_ID, inviteId: INVITE_ID })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(revokeStudentInvite).not.toHaveBeenCalled();
  });

  it('revokeCourseInviteService passes a 404 through for an invite from another course', async () => {
    vi.mocked(revokeStudentInvite).mockRejectedValue(new AppError('Invite not found', 'NOT_FOUND', 404));

    await expect(
      revokeCourseInviteService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID, inviteId: INVITE_ID })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(revokeStudentInvite).toHaveBeenCalledWith(COURSE_ID, INVITE_ID, ACTOR_ID);
  });

  it('revokeCourseInviteService delegates with the actor id', async () => {
    vi.mocked(revokeStudentInvite).mockResolvedValue({ id: INVITE_ID } as Awaited<
      ReturnType<typeof revokeStudentInvite>
    >);

    await revokeCourseInviteService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID, inviteId: INVITE_ID });

    expect(revokeStudentInvite).toHaveBeenCalledWith(COURSE_ID, INVITE_ID, ACTOR_ID);
  });
});
