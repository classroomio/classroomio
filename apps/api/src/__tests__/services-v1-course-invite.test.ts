import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@api/services/course/invite', () => ({
  listPaginatedStudentInvites: vi.fn(),
  createStudentInvite: vi.fn(),
  revokeStudentInvite: vi.fn()
}));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { createStudentInvite, listPaginatedStudentInvites, revokeStudentInvite } from '@api/services/course/invite';
import {
  createCourseInviteService,
  listCourseInvitesService,
  revokeCourseInviteService
} from '@api/services/v1/course-invite';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const INVITE_ID = 'invite-1';

describe('services/v1/course-invite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  });

  it('throws 404 when the course does not belong to the organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

    await expect(
      listCourseInvitesService(ORG_ID, { courseId: COURSE_ID }, { page: 1, limit: 20 })
    ).rejects.toMatchObject({
      statusCode: 404
    });
    expect(listPaginatedStudentInvites).not.toHaveBeenCalled();
  });

  it('listCourseInvitesService delegates after the org check', async () => {
    vi.mocked(listPaginatedStudentInvites).mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    } as Awaited<ReturnType<typeof listPaginatedStudentInvites>>);

    const query = { page: 1, limit: 20 };
    await listCourseInvitesService(ORG_ID, { courseId: COURSE_ID }, query);

    expect(listPaginatedStudentInvites).toHaveBeenCalledWith(COURSE_ID, query);
  });

  it('createCourseInviteService requires an actor', async () => {
    const payload = { preset: 'MULTI_USE_30D', recipientEmails: ['a@example.com'], sendEmail: false } as Parameters<
      typeof createCourseInviteService
    >[3];

    await expect(createCourseInviteService(ORG_ID, null, { courseId: COURSE_ID }, payload)).rejects.toMatchObject({
      statusCode: 401
    });
    expect(createStudentInvite).not.toHaveBeenCalled();
  });

  it('createCourseInviteService delegates with the actor id', async () => {
    const payload = { preset: 'MULTI_USE_30D', recipientEmails: ['a@example.com'], sendEmail: false } as Parameters<
      typeof createCourseInviteService
    >[3];
    vi.mocked(createStudentInvite).mockResolvedValue({ id: INVITE_ID } as unknown as Awaited<
      ReturnType<typeof createStudentInvite>
    >);

    await createCourseInviteService(ORG_ID, 'actor-1', { courseId: COURSE_ID }, payload);

    expect(createStudentInvite).toHaveBeenCalledWith(COURSE_ID, 'actor-1', payload);
  });

  it('revokeCourseInviteService requires an actor', async () => {
    await expect(
      revokeCourseInviteService(ORG_ID, null, { courseId: COURSE_ID, inviteId: INVITE_ID })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(revokeStudentInvite).not.toHaveBeenCalled();
  });

  it('revokeCourseInviteService delegates with the actor id', async () => {
    vi.mocked(revokeStudentInvite).mockResolvedValue({ id: INVITE_ID } as Awaited<
      ReturnType<typeof revokeStudentInvite>
    >);

    await revokeCourseInviteService(ORG_ID, 'actor-1', { courseId: COURSE_ID, inviteId: INVITE_ID });

    expect(revokeStudentInvite).toHaveBeenCalledWith(COURSE_ID, INVITE_ID, 'actor-1');
  });
});
