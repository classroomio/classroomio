import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getOrgAudience: vi.fn(),
  getOrgAudienceMember: vi.fn(),
  removeAudienceMember: vi.fn()
}));

vi.mock('@api/services/organization/audience', () => ({
  assignAudienceToCourses: vi.fn(),
  importAudienceMembers: vi.fn(),
  updatePendingAudienceMemberEmail: vi.fn()
}));

vi.mock('@api/services/account/profile', () => ({
  updateUser: vi.fn()
}));

import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getOrgAudience, getOrgAudienceMember, removeAudienceMember } from '@api/services/organization';
import {
  assignAudienceToCourses,
  importAudienceMembers,
  updatePendingAudienceMemberEmail
} from '@api/services/organization/audience';
import { updateUser } from '@api/services/account/profile';
import {
  assignAudienceCoursesService,
  createAudienceService,
  getAudienceMemberService,
  listAudienceService,
  removeAudienceService,
  updateAudienceService
} from '@api/services/v1/audience';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const MEMBER_ID = 42;
const PROFILE_ID = 'profile-9';

const joined = { id: MEMBER_ID, profileId: PROFILE_ID, name: 'Sam Student', email: 'sam@example.com' };
const pending = { id: MEMBER_ID, profileId: null, name: '', email: 'sam@example.com' };

const assignPayload = { profileIds: [PROFILE_ID], courseIds: ['course-1'], sendEmail: true };

describe('services/v1/audience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrgAudienceMember).mockResolvedValue(joined as never);
  });

  describe('who may call it', () => {
    const calls = {
      list: (actorId: string | null) => listAudienceService(ORG_ID, actorId, {} as never),
      create: (actorId: string | null) =>
        createAudienceService(ORG_ID, actorId, { email: 'new@example.com', sendEmail: true }),
      get: (actorId: string | null) => getAudienceMemberService(ORG_ID, actorId, { memberId: MEMBER_ID }),
      assign: (actorId: string | null) => assignAudienceCoursesService(ORG_ID, actorId, assignPayload),
      remove: (actorId: string | null) => removeAudienceService(ORG_ID, MEMBER_ID, actorId),
      update: (actorId: string | null) =>
        updateAudienceService(ORG_ID, MEMBER_ID, actorId, { name: 'Sam S', sendEmail: true })
    };

    const expectNothingRan = () => {
      expect(getOrgAudience).not.toHaveBeenCalled();
      expect(getOrgAudienceMember).not.toHaveBeenCalled();
      expect(importAudienceMembers).not.toHaveBeenCalled();
      expect(assignAudienceToCourses).not.toHaveBeenCalled();
      expect(removeAudienceMember).not.toHaveBeenCalled();
      expect(updatePendingAudienceMemberEmail).not.toHaveBeenCalled();
      expect(updateUser).not.toHaveBeenCalled();
    };

    it.each(Object.entries(calls))('%s rejects a key with no actor with 401', async (_name, call) => {
      await expect(call(null)).rejects.toMatchObject({ statusCode: 401 });
      expectNothingRan();
    });

    it.each(Object.entries(calls))('%s rejects a tutor with 403, as the dashboard does', async (_name, call) => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

      await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
      expectNothingRan();
    });

    it.each(Object.entries(calls))('%s rejects an actor from another organization with 403', async (_name, call) => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(null as never);

      await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, ACTOR_ID);
      expectNothingRan();
    });

    it.each(Object.entries(calls))('%s runs for an org admin', async (_name, call) => {
      await expect(call(ACTOR_ID)).resolves.not.toThrow();
    });
  });

  describe('createAudienceService', () => {
    it('sends a single email as before', async () => {
      await createAudienceService(ORG_ID, ACTOR_ID, { email: 'new@example.com', sendEmail: true });

      expect(importAudienceMembers).toHaveBeenCalledWith(
        ORG_ID,
        {
          recipientCsv: 'new@example.com',
          courseIds: undefined,
          allCourses: false,
          allCohorts: false,
          sendEmail: true
        },
        ACTOR_ID,
        'public_api'
      );
    });

    it('sends a list as one row per address, in order', async () => {
      await createAudienceService(ORG_ID, ACTOR_ID, {
        emails: ['a@example.com', 'not-an-email', 'a@example.com'],
        courseIds: ['course-1'],
        sendEmail: false
      });

      expect(importAudienceMembers).toHaveBeenCalledWith(
        ORG_ID,
        {
          recipients: [{ email: 'a@example.com' }, { email: 'not-an-email' }, { email: 'a@example.com' }],
          courseIds: ['course-1'],
          allCourses: false,
          allCohorts: false,
          sendEmail: false
        },
        ACTOR_ID,
        'public_api'
      );
    });
  });

  it('removes a member as the actor, so their invites are revoked', async () => {
    await removeAudienceService(ORG_ID, MEMBER_ID, ACTOR_ID);

    expect(removeAudienceMember).toHaveBeenCalledWith(ORG_ID, MEMBER_ID, ACTOR_ID);
  });

  describe('updateAudienceService', () => {
    it('renames a joined member on their profile', async () => {
      await updateAudienceService(ORG_ID, MEMBER_ID, ACTOR_ID, { name: 'Samuel Student', sendEmail: true });

      expect(updateUser).toHaveBeenCalledWith(PROFILE_ID, { fullname: 'Samuel Student' });
      expect(updatePendingAudienceMemberEmail).not.toHaveBeenCalled();
    });

    it('looks the member up in the key organization only', async () => {
      await updateAudienceService(ORG_ID, MEMBER_ID, ACTOR_ID, { name: 'Samuel Student', sendEmail: true });

      expect(getOrgAudienceMember).toHaveBeenCalledWith(ORG_ID, MEMBER_ID);
    });

    it('returns 404 for a member of another organization, or a team member, before any write', async () => {
      vi.mocked(getOrgAudienceMember).mockRejectedValue(
        new AppError('Audience member not found', ErrorCodes.NOT_FOUND, 404)
      );

      await expect(
        updateAudienceService(ORG_ID, MEMBER_ID, ACTOR_ID, { name: 'Samuel Student', sendEmail: true })
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(updateUser).not.toHaveBeenCalled();
    });

    it('refuses to rename a pending member', async () => {
      vi.mocked(getOrgAudienceMember).mockResolvedValue(pending as never);

      await expect(
        updateAudienceService(ORG_ID, MEMBER_ID, ACTOR_ID, { name: 'Samuel Student', sendEmail: true })
      ).rejects.toMatchObject({ statusCode: 400, field: 'name' });

      expect(updateUser).not.toHaveBeenCalled();
    });

    it('still corrects the email of a pending member, as before', async () => {
      vi.mocked(getOrgAudienceMember).mockResolvedValue(pending as never);

      await updateAudienceService(ORG_ID, MEMBER_ID, ACTOR_ID, { email: 'right@example.com', sendEmail: false });

      expect(updatePendingAudienceMemberEmail).toHaveBeenCalledWith(
        ORG_ID,
        MEMBER_ID,
        { email: 'right@example.com', sendEmail: false },
        ACTOR_ID
      );
      expect(updateUser).not.toHaveBeenCalled();
    });

    it('changes nothing when email and name are sent for a pending member', async () => {
      vi.mocked(getOrgAudienceMember).mockResolvedValue(pending as never);

      await expect(
        updateAudienceService(ORG_ID, MEMBER_ID, ACTOR_ID, {
          email: 'right@example.com',
          name: 'Sam S',
          sendEmail: true
        })
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(updatePendingAudienceMemberEmail).not.toHaveBeenCalled();
      expect(updateUser).not.toHaveBeenCalled();
    });

    it('does not rename a joined member whose email change was refused', async () => {
      vi.mocked(updatePendingAudienceMemberEmail).mockRejectedValue(
        new AppError(
          'Only pending audience members can be updated through this endpoint',
          ErrorCodes.VALIDATION_ERROR,
          400
        )
      );

      await expect(
        updateAudienceService(ORG_ID, MEMBER_ID, ACTOR_ID, {
          email: 'right@example.com',
          name: 'Sam S',
          sendEmail: true
        })
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(updateUser).not.toHaveBeenCalled();
    });
  });
});
