import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn(),
  getCohortMemberRole: vi.fn(),
  isCohortMember: vi.fn(),
  isOrgAdminByCohortId: vi.fn(),
  getCohortMemberByProfileId: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@api/services/cohort/invite', () => ({
  inviteStudentsToCohort: vi.fn(),
  assignExistingStudentsToCohort: vi.fn()
}));

vi.mock('@api/services/invite-link', () => ({
  fetchInviteLinkForResource: vi.fn(),
  getOrCreateInviteLinkForResource: vi.fn(),
  toggleInviteLinkForResource: vi.fn()
}));

import { getCohortMemberRole, getCohortOrganizationId, isOrgAdminByCohortId } from '@cio/db/queries/cohort';
import { assignExistingStudentsToCohort, inviteStudentsToCohort } from '@api/services/cohort/invite';
import {
  fetchInviteLinkForResource,
  getOrCreateInviteLinkForResource,
  toggleInviteLinkForResource
} from '@api/services/invite-link';
import { ROLE } from '@cio/utils/constants';
import {
  assignPublicApiCohortStudentsService,
  createPublicApiCohortInviteLinkService,
  getPublicApiCohortInviteLinkService,
  invitePublicApiCohortStudentsService,
  setPublicApiCohortInviteLinkRevokedService
} from '@api/services/v1/cohort-invite';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const COHORT_ID = 'cohort-1';
const ACTOR_ID = 'actor-1';

const cohortParams = { cohortId: COHORT_ID };

describe('v1 cohort invite service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
  });

  it('invites by email as the automation actor, passing sendEmail through', async () => {
    vi.mocked(inviteStudentsToCohort).mockResolvedValue({ imported: 1 } as Awaited<
      ReturnType<typeof inviteStudentsToCohort>
    >);

    await invitePublicApiCohortStudentsService(ORG_ID, ACTOR_ID, cohortParams, {
      recipientCsv: 'email\nnew@test.dev',
      sendEmail: false
    });

    expect(inviteStudentsToCohort).toHaveBeenCalledWith(
      COHORT_ID,
      { recipientCsv: 'email\nnew@test.dev', sendEmail: false },
      ACTOR_ID
    );
  });

  it('assigns existing students; profiles outside the org are left to the audience service to skip', async () => {
    vi.mocked(assignExistingStudentsToCohort).mockResolvedValue({ assigned: 1, alreadyEnrolled: 0, emailsSent: 1 });
    const payload = { profileIds: ['11111111-1111-4111-8111-111111111111'], sendEmail: true };

    await assignPublicApiCohortStudentsService(ORG_ID, ACTOR_ID, cohortParams, payload);

    expect(assignExistingStudentsToCohort).toHaveBeenCalledWith(COHORT_ID, payload);
  });

  it('gets, creates, and revokes the invite link, recording the actor on writes', async () => {
    await getPublicApiCohortInviteLinkService(ORG_ID, ACTOR_ID, cohortParams);
    await createPublicApiCohortInviteLinkService(ORG_ID, ACTOR_ID, cohortParams);
    await setPublicApiCohortInviteLinkRevokedService(ORG_ID, ACTOR_ID, cohortParams, { isRevoked: true });

    expect(fetchInviteLinkForResource).toHaveBeenCalledWith('COHORT', COHORT_ID);
    expect(getOrCreateInviteLinkForResource).toHaveBeenCalledWith('COHORT', COHORT_ID, ACTOR_ID);
    expect(toggleInviteLinkForResource).toHaveBeenCalledWith('COHORT', COHORT_ID, true, ACTOR_ID);
  });

  it('refuses every invite action for a student in the cohort', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);

    await expect(
      invitePublicApiCohortStudentsService(ORG_ID, ACTOR_ID, cohortParams, { recipientCsv: 'a', sendEmail: true })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      assignPublicApiCohortStudentsService(ORG_ID, ACTOR_ID, cohortParams, { profileIds: ['p'], sendEmail: true })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(getPublicApiCohortInviteLinkService(ORG_ID, ACTOR_ID, cohortParams)).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(createPublicApiCohortInviteLinkService(ORG_ID, ACTOR_ID, cohortParams)).rejects.toMatchObject({
      statusCode: 403
    });

    expect(inviteStudentsToCohort).not.toHaveBeenCalled();
    expect(assignExistingStudentsToCohort).not.toHaveBeenCalled();
    expect(fetchInviteLinkForResource).not.toHaveBeenCalled();
    expect(getOrCreateInviteLinkForResource).not.toHaveBeenCalled();
  });

  it('allows an org admin who has no cohort role', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(null);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(true);

    await createPublicApiCohortInviteLinkService(ORG_ID, ACTOR_ID, cohortParams);

    expect(getOrCreateInviteLinkForResource).toHaveBeenCalled();
  });

  it('404s on a cohort from another organization before reaching the invite-link service, which has no org check', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(getPublicApiCohortInviteLinkService(ORG_ID, ACTOR_ID, cohortParams)).rejects.toMatchObject({
      statusCode: 404
    });
    await expect(
      setPublicApiCohortInviteLinkRevokedService(ORG_ID, ACTOR_ID, cohortParams, { isRevoked: true })
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      invitePublicApiCohortStudentsService(ORG_ID, ACTOR_ID, cohortParams, { recipientCsv: 'a', sendEmail: true })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(fetchInviteLinkForResource).not.toHaveBeenCalled();
    expect(toggleInviteLinkForResource).not.toHaveBeenCalled();
    expect(inviteStudentsToCohort).not.toHaveBeenCalled();
  });

  it('rejects invite writes with no automation actor', async () => {
    await expect(
      invitePublicApiCohortStudentsService(ORG_ID, null, cohortParams, { recipientCsv: 'a', sendEmail: true })
    ).rejects.toMatchObject({ statusCode: 401 });
    await expect(createPublicApiCohortInviteLinkService(ORG_ID, null, cohortParams)).rejects.toMatchObject({
      statusCode: 401
    });
  });
});
