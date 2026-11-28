import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization/invite', () => ({
  getActivePendingOrgInvitesForEmail: vi.fn(),
  getActivePendingInvitesForEmail: vi.fn()
}));

vi.mock('@cio/db/queries/course/invite', () => ({
  getActivePendingCourseInvitesForEmail: vi.fn(),
  getUnjoinedPublishedCoursesByIds: vi.fn()
}));

vi.mock('@cio/db/queries/cohort', () => ({
  getUnjoinedCohortsByIds: vi.fn()
}));

vi.mock('@api/services/organization/invite', () => ({
  getRoleLabel: vi.fn((roleId: number) => (roleId === 3 ? 'Student' : 'Staff'))
}));

import { getActivePendingOrgInvitesForEmail } from '@cio/db/queries/organization/invite';
import { getActivePendingCourseInvitesForEmail, getUnjoinedPublishedCoursesByIds } from '@cio/db/queries/course/invite';
import { getUnjoinedCohortsByIds } from '@cio/db/queries/cohort';
import { listPendingInvitationsForAccount } from '@api/services/account/invites';

const USER = { id: 'user-1', email: 'Learner@Example.com', emailVerified: true };

function course(id: string, title: string, organizationId = 'org-1') {
  return { id, title, description: null, slug: id, organizationId };
}

function orgInviteWith(metadata: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
  return orgInviteRow({
    invite: {
      id: 'org-invite-1',
      email: 'learner@example.com',
      roleId: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-02-01T00:00:00.000Z',
      metadata
    },
    ...overrides
  });
}

function orgInviteRow(overrides: Record<string, unknown> = {}) {
  return {
    invite: {
      id: 'org-invite-1',
      email: 'learner@example.com',
      roleId: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-02-01T00:00:00.000Z',
      metadata: {}
    },
    organization: { id: 'org-1', name: 'Acme', siteName: 'acme', avatarUrl: null },
    ...overrides
  } as never;
}

function courseInviteRow(overrides: Record<string, unknown> = {}) {
  return {
    invite: {
      id: 'course-invite-1',
      createdAt: '2026-01-02T00:00:00.000Z',
      expiresAt: '2026-02-02T00:00:00.000Z'
    },
    course: { id: 'course-1', title: 'Intro', description: 'Desc', slug: 'intro' },
    organization: { id: 'org-1', name: 'Acme', siteName: 'acme', avatarUrl: null },
    ...overrides
  } as never;
}

describe('listPendingInvitationsForAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getActivePendingOrgInvitesForEmail).mockResolvedValue([]);
    vi.mocked(getActivePendingCourseInvitesForEmail).mockResolvedValue([]);
    vi.mocked(getUnjoinedPublishedCoursesByIds).mockResolvedValue([]);
    vi.mocked(getUnjoinedCohortsByIds).mockResolvedValue([]);
  });

  it('returns nothing for an unverified email', async () => {
    const result = await listPendingInvitationsForAccount({ id: 'u1', email: 'a@x.com', emailVerified: false });

    expect(result).toEqual([]);
    expect(getActivePendingOrgInvitesForEmail).not.toHaveBeenCalled();
  });

  it('groups an org invite with its courses and cohorts', async () => {
    vi.mocked(getActivePendingOrgInvitesForEmail).mockResolvedValue([
      orgInviteRow({
        invite: {
          id: 'org-invite-1',
          email: 'learner@example.com',
          roleId: 3,
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2026-02-01T00:00:00.000Z',
          metadata: { courseIds: ['course-9'], cohortIds: ['cohort-9'] }
        }
      })
    ]);
    vi.mocked(getUnjoinedPublishedCoursesByIds).mockResolvedValue([course('course-9', 'Advanced')] as never);
    vi.mocked(getUnjoinedCohortsByIds).mockResolvedValue([
      { id: 'cohort-9', name: 'Cohort A', organizationId: 'org-1' }
    ] as never);

    const [group] = await listPendingInvitationsForAccount(USER);

    expect(group.organization).toMatchObject({ id: 'org-1', name: 'Acme' });
    expect(group.orgInvite).toMatchObject({ id: 'org-invite-1', roleId: 3, roleLabel: 'Student' });
    expect(group.courses).toEqual([
      expect.objectContaining({ inviteId: null, courseId: 'course-9', title: 'Advanced' })
    ]);
    expect(group.cohorts).toEqual([{ cohortId: 'cohort-9', name: 'Cohort A' }]);
  });

  it('dedupes a course emailed directly and carried on the org invite, keeping the live invite', async () => {
    vi.mocked(getActivePendingOrgInvitesForEmail).mockResolvedValue([
      orgInviteRow({
        invite: {
          id: 'org-invite-1',
          email: 'learner@example.com',
          roleId: 3,
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2026-02-01T00:00:00.000Z',
          metadata: { courseIds: ['course-1'] }
        }
      })
    ]);
    vi.mocked(getUnjoinedPublishedCoursesByIds).mockResolvedValue([course('course-1', 'Intro')] as never);
    vi.mocked(getActivePendingCourseInvitesForEmail).mockResolvedValue([
      courseInviteRow(),
      courseInviteRow({
        invite: { id: 'older-invite', createdAt: '2026-01-01T00:00:00.000Z', expiresAt: '2026-02-01T00:00:00.000Z' }
      })
    ]);

    const [group] = await listPendingInvitationsForAccount(USER);

    expect(group.courses).toHaveLength(1);
    expect(group.courses[0]).toMatchObject({ inviteId: 'course-invite-1', courseId: 'course-1' });
  });

  it('lists a course-only group with no org invite', async () => {
    vi.mocked(getActivePendingCourseInvitesForEmail).mockResolvedValue([courseInviteRow()]);

    const [group] = await listPendingInvitationsForAccount(USER);

    expect(group.orgInvite).toBeNull();
    expect(group.courses).toHaveLength(1);
    expect(group.cohorts).toEqual([]);
  });

  it('sorts groups by organization name', async () => {
    vi.mocked(getActivePendingCourseInvitesForEmail).mockResolvedValue([
      courseInviteRow({
        organization: { id: 'org-b', name: 'Beta', siteName: 'beta', avatarUrl: null }
      }),
      courseInviteRow({
        invite: { id: 'course-invite-a', createdAt: '2026-01-02T00:00:00.000Z', expiresAt: '2026-02-02T00:00:00.000Z' },
        course: { id: 'course-a', title: 'A', description: 'd', slug: 'a' },
        organization: { id: 'org-a', name: 'Acme', siteName: 'acme', avatarUrl: null }
      })
    ]);

    const groups = await listPendingInvitationsForAccount(USER);

    expect(groups.map((group) => group.organization.name)).toEqual(['Acme', 'Beta']);
  });

  it('looks up carried courses and cohorts in one batch per kind for the normalized email', async () => {
    vi.mocked(getActivePendingOrgInvitesForEmail).mockResolvedValue([
      orgInviteWith({ courseIds: ['course-1', 'course-2'], cohortIds: ['cohort-1'] }),
      orgInviteWith(
        { courseIds: ['course-2', 'course-3'], cohortIds: ['cohort-1', 'cohort-2'] },
        { organization: { id: 'org-2', name: 'Beta', siteName: 'beta', avatarUrl: null } }
      )
    ]);

    await listPendingInvitationsForAccount(USER);

    expect(getActivePendingOrgInvitesForEmail).toHaveBeenCalledWith('learner@example.com');
    expect(getActivePendingCourseInvitesForEmail).toHaveBeenCalledWith('learner@example.com', USER.id);
    expect(getUnjoinedPublishedCoursesByIds).toHaveBeenCalledTimes(1);
    expect(getUnjoinedPublishedCoursesByIds).toHaveBeenCalledWith(['course-1', 'course-2', 'course-3'], USER.id);
    expect(getUnjoinedCohortsByIds).toHaveBeenCalledTimes(1);
    expect(getUnjoinedCohortsByIds).toHaveBeenCalledWith(['cohort-1', 'cohort-2'], USER.id);
  });

  it('drops carried courses and cohorts the profile joined, that are unpublished, or that belong to another organization', async () => {
    vi.mocked(getActivePendingOrgInvitesForEmail).mockResolvedValue([
      orgInviteWith({
        courseIds: ['course-live', 'course-joined', 'course-foreign'],
        cohortIds: ['cohort-live', 'cohort-joined', 'cohort-foreign']
      })
    ]);
    vi.mocked(getUnjoinedPublishedCoursesByIds).mockResolvedValue([
      course('course-live', 'Live'),
      course('course-foreign', 'Foreign', 'org-other')
    ] as never);
    vi.mocked(getUnjoinedCohortsByIds).mockResolvedValue([
      { id: 'cohort-live', name: 'Live cohort', organizationId: 'org-1' },
      { id: 'cohort-foreign', name: 'Foreign cohort', organizationId: 'org-other' }
    ] as never);

    const [group] = await listPendingInvitationsForAccount(USER);

    expect(group.courses.map((entry) => entry.courseId)).toEqual(['course-live']);
    expect(group.cohorts).toEqual([{ cohortId: 'cohort-live', name: 'Live cohort' }]);
  });

  it('keeps the org invitation when every carried course was dropped', async () => {
    vi.mocked(getActivePendingOrgInvitesForEmail).mockResolvedValue([orgInviteWith({ courseIds: ['course-joined'] })]);

    const [group] = await listPendingInvitationsForAccount(USER);

    expect(group.orgInvite).toMatchObject({ id: 'org-invite-1' });
    expect(group.courses).toEqual([]);
  });

  it('keeps the first org invitation for an organization and merges cohorts without duplicates', async () => {
    vi.mocked(getActivePendingOrgInvitesForEmail).mockResolvedValue([
      orgInviteWith({ cohortIds: ['cohort-1'] }),
      orgInviteRow({
        invite: {
          id: 'org-invite-2',
          email: 'learner@example.com',
          roleId: 2,
          createdAt: '2026-01-03T00:00:00.000Z',
          expiresAt: '2026-02-03T00:00:00.000Z',
          metadata: { cohortIds: ['cohort-1'] }
        }
      })
    ]);
    vi.mocked(getUnjoinedCohortsByIds).mockResolvedValue([
      { id: 'cohort-1', name: 'Cohort A', organizationId: 'org-1' }
    ] as never);

    const groups = await listPendingInvitationsForAccount(USER);

    expect(groups).toHaveLength(1);
    expect(groups[0].orgInvite?.id).toBe('org-invite-1');
    expect(groups[0].cohorts).toEqual([{ cohortId: 'cohort-1', name: 'Cohort A' }]);
  });

  it('returns nothing without an email', async () => {
    await expect(listPendingInvitationsForAccount({ id: 'u1', email: null, emailVerified: true })).resolves.toEqual([]);
    expect(getActivePendingCourseInvitesForEmail).not.toHaveBeenCalled();
  });
});
