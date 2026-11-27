import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/db/queries/organization')>();

  return {
    ...original,
    getOrganizationById: vi.fn(),
    getStudentOrganizationMemberByOrgAndEmail: vi.fn(),
    listLiveStudentOrgInvitesForEmail: vi.fn()
  };
});

vi.mock('@cio/db/queries/course', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/db/queries/course')>();

  return {
    ...original,
    getOrgCourseGroups: vi.fn(async () => [])
  };
});

vi.mock('@cio/db/queries/cohort', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/db/queries/cohort')>();

  return {
    ...original,
    getCohortsByOrg: vi.fn(async () => [])
  };
});

vi.mock('@cio/core/services/webhook/emit', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/services/webhook/emit')>();

  return {
    ...original,
    emitCourseWebhookEvent: vi.fn(),
    emitWebhookEvent: vi.fn(),
    emitCohortMemberWebhookEvent: vi.fn()
  };
});

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

vi.mock('@api/services/organization/invite', () => ({
  getRoleLabel: vi.fn(() => 'Student'),
  recordOrganizationInviteAudits: vi.fn()
}));

vi.mock('@cio/core/services/organization/supersede-invites', () => ({
  supersedeStudentOrgInvites: vi.fn()
}));

vi.mock('@cio/db/drizzle', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/db/drizzle')>();

  return {
    ...original,
    db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run({})) }
  };
});

import {
  getOrganizationById,
  getStudentOrganizationMemberByOrgAndEmail,
  listLiveStudentOrgInvitesForEmail
} from '@cio/db/queries/organization';
import { emitCourseWebhookEvent } from '@cio/core/services/webhook/emit';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { supersedeStudentOrgInvites } from '@cio/core/services/organization/supersede-invites';
import { recordOrganizationInviteAudits } from '@api/services/organization/invite';
import { revokeAudienceInviteAccess } from '@api/services/organization/audience';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const COHORT_ID = 'cohort-1';
const ACTOR_ID = 'actor-1';
const EMAIL = 'pending@example.com';

function liveInvite(id: string, metadata: Record<string, unknown>) {
  return { id, email: EMAIL, roleId: 3, expiresAt: '2026-02-01T00:00:00.000Z', metadata } as never;
}

function supersedeResult(options: { successor: Record<string, unknown> | null; removedCourseIds?: string[] }) {
  const successor = options.successor
    ? { id: 'invite-2', email: EMAIL, expiresAt: '2026-02-01T00:00:00.000Z', ...options.successor }
    : null;

  return {
    revoked: [{ id: 'invite-1', email: EMAIL }],
    created: successor ? [successor] : [],
    unchanged: [],
    inviteByEmail: new Map(successor ? [[EMAIL, successor]] : []),
    tokenByEmail: new Map(successor ? [[EMAIL, 'token']] : []),
    addedCourseIdsByEmail: new Map(),
    removedCourseIdsByEmail: new Map(options.removedCourseIds ? [[EMAIL, options.removedCourseIds]] : []),
    skippedStaff: []
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrganizationById).mockResolvedValue({ id: ORG_ID, name: 'Acme', siteName: 'acme' } as never);
  vi.mocked(getStudentOrganizationMemberByOrgAndEmail).mockResolvedValue({
    id: 7,
    profileId: null,
    email: EMAIL
  } as never);
});

describe('revokeAudienceInviteAccess for a course', () => {
  it('supersedes the invite without the course, keeps other courses and sends no email', async () => {
    vi.mocked(listLiveStudentOrgInvitesForEmail).mockResolvedValue([
      liveInvite('invite-1', { courseIds: [COURSE_ID, 'course-2'] })
    ]);
    vi.mocked(supersedeStudentOrgInvites).mockResolvedValue(
      supersedeResult({ successor: { metadata: { courseIds: ['course-2'] } }, removedCourseIds: [COURSE_ID] })
    );

    const result = await revokeAudienceInviteAccess(ORG_ID, { email: EMAIL, courseId: COURSE_ID }, ACTOR_ID);

    expect(supersedeStudentOrgInvites).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        orgId: ORG_ID,
        emails: [EMAIL],
        removeCourseIds: [COURSE_ID],
        removeCohortIds: [],
        source: 'AUDIENCE_REVOKE_COURSE'
      })
    );
    expect(recordOrganizationInviteAudits).toHaveBeenCalledWith([
      expect.objectContaining({
        inviteId: 'invite-1',
        eventType: 'REVOKED',
        metadata: { reason: 'superseded', supersededBy: 'invite-2', revokedCourseId: COURSE_ID }
      })
    ]);
    expect(emitCourseWebhookEvent).toHaveBeenCalledWith(
      COURSE_ID,
      'course.invite.revoked',
      expect.objectContaining({ inviteId: 'invite-1', email: EMAIL })
    );
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ revoked: true, inviteRevoked: false, inviteId: 'invite-2' });
  });

  it('revokes the invite outright when no courses or cohorts remain', async () => {
    vi.mocked(listLiveStudentOrgInvitesForEmail).mockResolvedValue([
      liveInvite('invite-1', { courseIds: [COURSE_ID] })
    ]);
    vi.mocked(supersedeStudentOrgInvites).mockResolvedValue(
      supersedeResult({ successor: null, removedCourseIds: [COURSE_ID] })
    );

    const result = await revokeAudienceInviteAccess(ORG_ID, { email: EMAIL, courseId: COURSE_ID }, ACTOR_ID);

    expect(recordOrganizationInviteAudits).toHaveBeenCalledWith([
      expect.objectContaining({
        inviteId: 'invite-1',
        eventType: 'REVOKED',
        metadata: { reason: 'revoked_for_access', revokedCourseId: COURSE_ID }
      })
    ]);
    expect(emitCourseWebhookEvent).toHaveBeenCalledWith(
      COURSE_ID,
      'course.invite.revoked',
      expect.objectContaining({ inviteId: 'invite-1' })
    );
    expect(result).toEqual({ revoked: true, inviteRevoked: true, inviteId: null });
  });

  it('404s when no live invite covers the course', async () => {
    vi.mocked(listLiveStudentOrgInvitesForEmail).mockResolvedValue([liveInvite('invite-1', { courseIds: ['other'] })]);

    await expect(
      revokeAudienceInviteAccess(ORG_ID, { email: EMAIL, courseId: COURSE_ID }, ACTOR_ID)
    ).rejects.toMatchObject({ statusCode: 404, field: 'courseId' });
    expect(supersedeStudentOrgInvites).not.toHaveBeenCalled();
  });

  it('refuses joined members', async () => {
    vi.mocked(getStudentOrganizationMemberByOrgAndEmail).mockResolvedValue({
      id: 7,
      profileId: 'profile-1',
      email: EMAIL
    } as never);

    await expect(
      revokeAudienceInviteAccess(ORG_ID, { email: EMAIL, courseId: COURSE_ID }, ACTOR_ID)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(listLiveStudentOrgInvitesForEmail).not.toHaveBeenCalled();
  });

  it('404s for an unknown organization', async () => {
    vi.mocked(getOrganizationById).mockResolvedValue(null);

    await expect(
      revokeAudienceInviteAccess(ORG_ID, { email: EMAIL, courseId: COURSE_ID }, ACTOR_ID)
    ).rejects.toMatchObject({ statusCode: 404, code: 'ORGANIZATION_NOT_FOUND' });
    expect(getStudentOrganizationMemberByOrgAndEmail).not.toHaveBeenCalled();
  });
});

describe('revokeAudienceInviteAccess for a cohort', () => {
  it('removes the cohort from the invite and records the revoked cohort', async () => {
    vi.mocked(listLiveStudentOrgInvitesForEmail).mockResolvedValue([
      liveInvite('invite-1', { courseIds: [COURSE_ID], cohortIds: [COHORT_ID] })
    ]);
    vi.mocked(supersedeStudentOrgInvites).mockResolvedValue(
      supersedeResult({ successor: { metadata: { courseIds: [COURSE_ID] } } })
    );

    const result = await revokeAudienceInviteAccess(ORG_ID, { email: EMAIL, cohortId: COHORT_ID }, ACTOR_ID);

    expect(supersedeStudentOrgInvites).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ removeCourseIds: [], removeCohortIds: [COHORT_ID], source: 'AUDIENCE_REVOKE_COHORT' })
    );
    expect(recordOrganizationInviteAudits).toHaveBeenCalledWith([
      expect.objectContaining({
        metadata: { reason: 'superseded', supersededBy: 'invite-2', revokedCohortId: COHORT_ID }
      })
    ]);
    expect(result).toEqual({ revoked: true, inviteRevoked: false, inviteId: 'invite-2' });
  });

  it('404s when no live invite covers the cohort', async () => {
    vi.mocked(listLiveStudentOrgInvitesForEmail).mockResolvedValue([
      liveInvite('invite-1', { courseIds: [COURSE_ID] })
    ]);

    await expect(
      revokeAudienceInviteAccess(ORG_ID, { email: EMAIL, cohortId: COHORT_ID }, ACTOR_ID)
    ).rejects.toMatchObject({ statusCode: 404, field: 'cohortId' });
  });
});
