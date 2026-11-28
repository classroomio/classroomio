import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn()
}));

vi.mock('@api/services/course/member-progress', () => ({
  getCourseMemberProgressSummaries: vi.fn().mockResolvedValue(new Map())
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseGroupId: vi.fn(),
  getPaginatedCourseMembers: vi.fn(),
  getPaginatedInvitedCourseMembers: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseWithOrgData: vi.fn(),
  getOrgIdByCourseId: vi.fn()
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@cio/db/queries/auth', () => ({ getProfileById: vi.fn() }));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));
vi.mock('@api/services/course/session-invite', () => ({ getWelcomeSessionIcs: vi.fn() }));
vi.mock('@api/services/product-events', () => ({ captureLearnersEnrolled: vi.fn() }));
vi.mock('@cio/core/config/dashboard-url', () => ({ getDashboardBaseUrl: vi.fn() }));
vi.mock('@cio/core/services/webhook/emit', () => ({
  buildMemberSource: vi.fn(),
  emitCourseMemberAddedWebhookEvent: vi.fn(),
  emitCourseMemberRemovedWebhookEvent: vi.fn(),
  emitCourseWebhookEvent: vi.fn()
}));

import { getInvitedPersonStatus } from '@cio/utils/functions/invite-metadata';
import {
  getCourseGroupId,
  getPaginatedCourseMembers,
  getPaginatedInvitedCourseMembers
} from '@cio/db/queries/course/people';
import { listPaginatedCourseMembers } from '@api/services/course/people';

const NOW = Date.parse('2026-11-27T12:00:00.000Z');

function invitedRow(overrides: Record<string, unknown>) {
  return {
    kind: 'org_invite',
    email: 'pending@example.com',
    groupMemberId: null,
    orgInviteId: 'org-invite-1',
    courseInviteId: null,
    roleId: 3,
    memberCreatedAt: null,
    inviteCreatedAt: '2026-11-20T12:00:00.000Z',
    inviteExpiresAt: '2026-12-04T12:00:00.000Z',
    courseIds: ['course-1'],
    cohortIds: [],
    ...overrides
  };
}

describe('getInvitedPersonStatus', () => {
  it('is pending before the expiry and expired from the expiry on', () => {
    expect(getInvitedPersonStatus('2026-11-27T12:00:01.000Z', NOW)).toBe('pending');
    expect(getInvitedPersonStatus('2026-11-27T12:00:00.000Z', NOW)).toBe('expired');
    expect(getInvitedPersonStatus('2026-11-01T00:00:00.000Z', NOW)).toBe('expired');
  });

  it('treats a row without an expiry as pending', () => {
    expect(getInvitedPersonStatus(null, NOW)).toBe('pending');
  });
});

describe('listPaginatedCourseMembers (invited)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.mocked(getCourseGroupId).mockResolvedValue('group-1');
  });

  it('marks each invited row pending or expired from its invite expiry', async () => {
    vi.mocked(getPaginatedInvitedCourseMembers).mockResolvedValue({
      items: [
        invitedRow({}),
        invitedRow({
          email: 'expired@example.com',
          orgInviteId: 'org-invite-2',
          inviteExpiresAt: '2026-11-26T12:00:00.000Z'
        }),
        invitedRow({
          kind: 'email_only_member',
          email: 'legacy@example.com',
          orgInviteId: null,
          groupMemberId: 'group-member-1',
          inviteExpiresAt: null,
          memberCreatedAt: '2026-10-01T00:00:00.000Z'
        })
      ],
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1
    } as never);

    const result = await listPaginatedCourseMembers('course-1', { page: 1, limit: 20, membership: 'invited' } as never);
    const statusByEmail = Object.fromEntries(result.items.map((item) => [item.email, item.invitation?.status ?? null]));

    expect(statusByEmail).toEqual({
      'pending@example.com': 'pending',
      'expired@example.com': 'expired',
      'legacy@example.com': 'pending'
    });

    vi.useRealTimers();
  });
});

describe('listPaginatedCourseMembers (all, team view)', () => {
  const joinedMember = {
    id: 'member-1',
    groupId: 'group-1',
    profileId: 'profile-1',
    roleId: 3,
    email: 'joined@example.com',
    createdAt: '2026-11-01T00:00:00.000Z',
    assignedStudentId: null,
    completedAt: null,
    certificateEarnedAt: null,
    certificationEmailSentAt: null,
    profile: null,
    progressPercent: 0,
    progressBucket: null,
    lastLoginAt: null,
    enrolledAt: '2026-11-01T00:00:00.000Z',
    membership: 'joined',
    invitation: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseGroupId).mockResolvedValue('group-1');
    vi.mocked(getPaginatedCourseMembers).mockResolvedValue({
      items: [joinedMember],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1
    } as never);
    vi.mocked(getPaginatedInvitedCourseMembers).mockResolvedValue({
      items: [invitedRow({})],
      page: 1,
      limit: 19,
      total: 1,
      totalPages: 1
    } as never);
  });

  it('lists invited people after the joined members and counts both', async () => {
    const result = await listPaginatedCourseMembers('course-1', {
      page: 1,
      limit: 20,
      roleId: 3,
      search: 'example'
    } as never);

    expect(result.items.map((item) => [item.email, item.membership])).toEqual([
      ['joined@example.com', 'joined'],
      ['pending@example.com', 'invited']
    ]);
    expect(result).toMatchObject({ total: 2, totalPages: 1 });
    expect(getPaginatedCourseMembers).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ membership: 'joined', offset: 0, limit: 20 })
    );
    expect(getPaginatedInvitedCourseMembers).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ offset: 0, limit: 19, search: 'example', roleId: 3 })
    );
  });

  it('leaves invited people out when a filter only joined members can match is set', async () => {
    await listPaginatedCourseMembers('course-1', { page: 1, limit: 20, progress: 'completed' } as never);

    expect(getPaginatedInvitedCourseMembers).not.toHaveBeenCalled();
  });

  it('lists only joined members when asked for them', async () => {
    await listPaginatedCourseMembers('course-1', { page: 1, limit: 20, membership: 'joined' } as never);

    expect(getPaginatedInvitedCourseMembers).not.toHaveBeenCalled();
    expect(getPaginatedCourseMembers).toHaveBeenCalledWith('course-1', { page: 1, limit: 20, membership: 'joined' });
  });
});
