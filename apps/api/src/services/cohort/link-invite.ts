import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createCohortLinkInvite,
  getCohortById,
  getCohortLinkInvite,
  getCohortLinkInviteWithCohort,
  incrementCohortInviteJoinCount,
  setCohortLinkInviteRevoked
} from '@cio/db/queries/cohort';
import { createOrganizationMember, getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { markUserAndProfileEmailVerified } from '@cio/db/queries/auth/profile';

import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { generateInviteToken, hashInviteToken } from '@api/utils/invite-token';
import { assertStudentCapacityOrThrow } from '@api/services/organization/student-limit';
import { assignAudienceToCourses } from '@api/services/organization/audience';

interface TInviteRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface TAuthUser {
  id: string;
  email?: string | null;
}

type CohortLinkInviteResponse = {
  id: string;
  token: string;
  isRevoked: boolean;
  joinCount: number;
  lastUsedAt: string | null;
};

function toLinkInviteResponse(invite: {
  id: string;
  token: string;
  isRevoked: boolean;
  joinCount: number;
  lastUsedAt: string | null;
}): CohortLinkInviteResponse {
  return {
    id: invite.id,
    token: invite.token,
    isRevoked: invite.isRevoked,
    joinCount: invite.joinCount,
    lastUsedAt: invite.lastUsedAt
  };
}

/**
 * Returns the cohort's share link, creating it on first request. Idempotent — the
 * same link is returned forever so staff can re-copy it, and there is exactly one
 * per cohort (enforced by a unique constraint on `cohort_invite.cohort_id`).
 */
export async function getOrCreateCohortLinkInvite(
  cohortId: string,
  createdByProfileId: string
): Promise<CohortLinkInviteResponse> {
  const cohort = await getCohortById(cohortId);
  if (!cohort) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }

  const existing = await getCohortLinkInvite(cohortId);
  if (existing) {
    return toLinkInviteResponse(existing);
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);

  const created = await createCohortLinkInvite({
    cohortId,
    roleId: ROLE.STUDENT,
    token,
    tokenHash,
    createdByProfileId
  });

  return toLinkInviteResponse(created);
}

/**
 * Returns the cohort's share link without creating one. `null` means the cohort
 * has no link yet.
 */
export async function fetchCohortLinkInvite(cohortId: string): Promise<CohortLinkInviteResponse | null> {
  const invite = await getCohortLinkInvite(cohortId);

  if (!invite) return null;

  return toLinkInviteResponse(invite);
}

/** Disables or re-enables the cohort's share link without destroying it. */
export async function toggleCohortLinkInvite(
  cohortId: string,
  isRevoked: boolean,
  profileId: string
): Promise<CohortLinkInviteResponse> {
  const updated = await setCohortLinkInviteRevoked(cohortId, isRevoked, profileId);

  if (!updated) {
    throw new AppError('Cohort invite link not found', ErrorCodes.NOT_FOUND, 404);
  }

  return toLinkInviteResponse(updated);
}

/**
 * Server-only preview for the join page (API-key protected at the route layer).
 * Never returns the raw token — the caller already holds it.
 */
export async function previewCohortLinkInvite(token: string) {
  const tokenHash = hashInviteToken(token);
  const data = await getCohortLinkInviteWithCohort(db, tokenHash);

  if (!data) {
    throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
  }

  return {
    invite: {
      id: data.invite.id,
      isRevoked: data.invite.isRevoked
    },
    cohort: {
      id: data.cohort.id,
      name: data.cohort.name,
      description: data.cohort.description,
      coverImage: data.cohort.coverImage,
      isActive: data.cohort.status === 'ACTIVE'
    },
    organization: data.organization
  };
}

/**
 * Joins the authenticated user to the cohort as a student.
 *
 * The link is never consumed — it is permanent and reusable, so anyone holding it
 * can join until it is revoked. Joining is idempotent: an existing member simply
 * has their enrollment re-synced.
 */
export async function acceptCohortLinkInvite(token: string, user: TAuthUser, context: TInviteRequestContext = {}) {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  const tokenHash = hashInviteToken(token);

  const invitePreview = await getCohortLinkInviteWithCohort(db, tokenHash);

  if (!invitePreview) {
    throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
  }

  if (invitePreview.invite.isRevoked) {
    throw new AppError('This invite link has been disabled', ErrorCodes.UNAUTHORIZED, 403);
  }

  if (invitePreview.cohort.status !== 'ACTIVE') {
    throw new AppError('This cohort is no longer accepting new members', ErrorCodes.VALIDATION_ERROR, 403);
  }

  const organizationId = invitePreview.organization.id;
  const inviteId = invitePreview.invite.id;

  // Org membership must be committed before the cohort fan-out runs: the shared
  // enrollment path only assigns profiles that are already STUDENT members of the org.
  const wasAlreadyOrgMember = await db.transaction(async (tx) => {
    const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(organizationId, user.id, tx);

    if (!orgMemberId) {
      await assertStudentCapacityOrThrow(organizationId, 1);

      await createOrganizationMember(
        {
          organizationId,
          roleId: ROLE.STUDENT,
          profileId: user.id,
          email: normalizedEmail,
          verified: true
        },
        tx
      );
    }

    await markUserAndProfileEmailVerified(user.id, tx);
    await incrementCohortInviteJoinCount(tx, inviteId);

    return Boolean(orgMemberId);
  });

  // Creates the cohort_member row, enrolls the profile in every course attached to
  // the cohort, writes compliance records and sends the cohort welcome email.
  await assignAudienceToCourses(organizationId, {
    profileIds: [user.id],
    cohortIds: [invitePreview.cohort.id],
    sendEmail: true
  });

  console.info('acceptCohortLinkInvite joined', {
    cohortId: invitePreview.cohort.id,
    inviteId,
    profileId: user.id,
    wasAlreadyOrgMember,
    userAgent: context.userAgent ?? null
  });

  return {
    cohortId: invitePreview.cohort.id,
    cohortName: invitePreview.cohort.name,
    organizationId,
    redirectTo: '/lms'
  };
}
