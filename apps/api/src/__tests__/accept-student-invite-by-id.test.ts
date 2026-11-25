import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn(async (run: (tx: object) => unknown) => run({})) }
}));

vi.mock('@cio/db/queries/course/invite', () => ({
  countInviteDistinctPreviewIps: vi.fn(),
  createCourseInviteAudit: vi.fn(),
  getActivePendingCourseInvitesForEmail: vi.fn(),
  selectCourseInviteAcceptBundleByInviteId: vi.fn(),
  selectCourseInviteAcceptBundleByTokenHash: vi.fn(),
  optimisticIncrementCourseInviteUsedCount: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  addGroupMember: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  createOrganizationMember: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));
vi.mock('@cio/core/services/webhook/emit', () => ({
  buildMemberSource: vi.fn(),
  emitCourseMemberAddedWebhookEvent: vi.fn(),
  emitCourseWebhookEvent: vi.fn(),
  emitOrganizationMemberWebhookEvent: vi.fn()
}));

import {
  countInviteDistinctPreviewIps,
  getActivePendingCourseInvitesForEmail,
  selectCourseInviteAcceptBundleByInviteId
} from '@cio/db/queries/course/invite';
import { getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import { listPendingCourseInvitesForAccount } from '@api/services/account/invites';
import { acceptStudentInviteById } from '@api/services/course/invite';

const INVITE_ID = '22222222-2222-4222-8222-222222222222';

function bundleWith(allowedEmails: string[] | null) {
  return {
    invite: {
      id: INVITE_ID,
      courseId: 'course-1',
      roleId: 3,
      allowedEmails,
      allowedDomains: null,
      isRevoked: false,
      expiresAt: '2999-01-01T00:00:00.000Z',
      usedCount: 0,
      maxUses: 1
    },
    course: {
      id: 'course-1',
      title: 'Course',
      status: 'ACTIVE',
      isPublished: true,
      metadata: null,
      groupId: 'group-1'
    },
    organization: { id: 'org-1', name: 'Org', siteName: 'org' }
  } as never;
}

describe('acceptStudentInviteById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(countInviteDistinctPreviewIps).mockResolvedValue(0);
    vi.mocked(getGroupMemberIdByGroupAndProfile).mockResolvedValue(null);
  });

  it('refuses an account whose email is not verified, before reading the invite', async () => {
    await expect(
      acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: false })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(selectCourseInviteAcceptBundleByInviteId).not.toHaveBeenCalled();
  });

  it('refuses an invite that is not bound to any email', async () => {
    vi.mocked(selectCourseInviteAcceptBundleByInviteId).mockResolvedValue(bundleWith(null));

    await expect(
      acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: true })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('refuses an invite addressed to a different email', async () => {
    vi.mocked(selectCourseInviteAcceptBundleByInviteId).mockResolvedValue(bundleWith(['someone@x.com']));

    await expect(
      acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: true })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('listPendingCourseInvitesForAccount', () => {
  it('returns nothing without querying when the email is unverified', async () => {
    const invites = await listPendingCourseInvitesForAccount({ id: 'u1', email: 'a@x.com', emailVerified: false });

    expect(invites).toEqual([]);
    expect(getActivePendingCourseInvitesForEmail).not.toHaveBeenCalled();
  });
});
