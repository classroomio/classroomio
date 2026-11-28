import type { TOrganizationInvite } from '@cio/db/types';
import type { TOrganizationInviteAcceptRow } from '@cio/db/queries/organization';
import { AppError, ErrorCodes, membershipConflictError } from '@api/utils/errors';
import {
  claimPendingOrganizationInvite,
  createOrganizationInvite,
  createOrganizationMembers,
  createLinkInvite,
  getActivePendingOrgInviteForEmail,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  getOrganizationInviteByTokenHash,
  lockOrganizationForUpdate,
  getOrgLinkInvite,
  getOrgLinkInviteWithOrg,
  revokeActiveOrganizationInvitesByEmails,
  selectOrganizationInviteWithOrgByInviteId,
  selectOrganizationInviteWithOrgByTokenHash,
  setLinkInviteRevoked
} from '@cio/db/queries/organization';
import { scheduleCourseRoleReconcile } from '@cio/core/services/organization/course-roles';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { emitOrganizationMemberWebhookEvent } from '@cio/core/services/webhook/emit';
import {
  enrollOrganizationInviteUserCore,
  type TInviteEnrollment
} from '@cio/core/services/organization/invite-enrollment';

import { ROLE } from '@cio/utils/constants';
import { STUDENT_HOME_ENTRY_PATH } from '@cio/utils/lms';
import crypto from 'node:crypto';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import {
  parseCourseIdsFromInviteMetadata,
  parseCohortIdsFromInviteMetadata,
  parseFullnameFromInviteMetadata
} from '@api/utils/org';
import {
  getProfileById,
  markUserAndProfileEmailVerified,
  setProfileFullnameIfUnset
} from '@cio/db/queries/auth/profile';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { buildEmailBranding, buildEmailFromName, sanitizeEmailSubject } from '@cio/email';
import { ensureComplianceEnrollmentRecordsForProfiles } from '../course/compliance';
import { captureLearnersEnrolled } from '@api/services/product-events';
import { recordOrganizationInviteAudit, recordOrganizationInviteAudits } from './invite-audit';
import {
  bindProfileInOrg,
  buildFulfilledSummary,
  emitCourseMembersAdded,
  emitInviteEnrollmentEvents,
  recordCourseInviteAccepted,
  runBindingSideEffects,
  type TInviteFulfilment
} from './invite-binding';

export { recordOrganizationInviteAudits };

type OrganizationInviteStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED';

const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface TInviteRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface TAuthUser {
  id: string;
  email?: string | null;
  emailVerified?: boolean | null;
}

/** Applies the name an admin entered at import time to the accepting profile; a name the person chose is kept. */
async function applyInvitedFullname(tx: DbOrTxClient, profileId: string, inviteMetadata: unknown): Promise<void> {
  const invitedFullname = parseFullnameFromInviteMetadata(inviteMetadata);
  if (!invitedFullname) {
    return;
  }

  await setProfileFullnameIfUnset(profileId, invitedFullname, tx);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function normalizeEmails(emails: string[]): string[] {
  return [...new Set(emails.map((email) => email.toLowerCase().trim()).filter(Boolean))];
}

function buildTeamInviteLink(token: string): string {
  return `${getAppBaseUrl()}/invite/${encodeURIComponent(token)}`;
}

export function getRoleLabel(roleId: number): string {
  if (roleId === ROLE.ADMIN) return 'Admin';
  if (roleId === ROLE.TUTOR) return 'Tutor';
  if (roleId === ROLE.STUDENT) return 'Student';
  return `Role ${roleId}`;
}

function getInviteStatus(invite: {
  isRevoked: boolean;
  expiresAt: string;
  acceptedAt: string | null;
}): OrganizationInviteStatus {
  if (invite.isRevoked) {
    return 'REVOKED';
  }

  if (invite.acceptedAt) {
    return 'ACCEPTED';
  }

  if (new Date(invite.expiresAt).getTime() <= Date.now()) {
    return 'EXPIRED';
  }

  return 'ACTIVE';
}

function getExpiryLabel(expiresAtIso: string): string {
  return new Date(expiresAtIso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  });
}

/**
 * Returns the invite after locking its organization.
 */
async function readInviteAfterOrganizationLock<T extends { invite: { organizationId: string } }>(
  tx: DbOrTxClient,
  loadInvite: (client: DbOrTxClient) => Promise<T | null>,
  missingMessage: string
): Promise<T> {
  const preview = await loadInvite(tx);
  if (!preview) {
    throw new AppError(missingMessage, ErrorCodes.NOT_FOUND, 404);
  }

  await lockOrganizationForUpdate(preview.invite.organizationId, tx);

  const lockedInvite = await loadInvite(tx);
  if (!lockedInvite) {
    throw new AppError(missingMessage, ErrorCodes.NOT_FOUND, 404);
  }

  return lockedInvite;
}

const MAX_SUPERSEDED_HOPS = 10;

function readSupersededBy(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;

  const supersededBy = (metadata as Record<string, unknown>).supersededBy;

  return typeof supersededBy === 'string' && supersededBy ? supersededBy : null;
}

/**
 * Follows `supersededBy` from a replaced invite to the invite that replaced it, so a link from an earlier email keeps
 * working. Returns the input row when it was not replaced.
 */
async function followSupersededInvite(
  client: DbOrTxClient,
  row: TOrganizationInviteAcceptRow
): Promise<TOrganizationInviteAcceptRow> {
  let current = row;
  for (let hop = 0; hop < MAX_SUPERSEDED_HOPS; hop++) {
    const successorId = current.invite.isRevoked ? readSupersededBy(current.invite.metadata) : null;
    if (!successorId) return current;

    const successor = await selectOrganizationInviteWithOrgByInviteId(client, successorId);
    if (!successor || successor.invite.organizationId !== row.invite.organizationId) return current;

    current = successor;
  }

  return current;
}

async function enrollOrganizationInviteUser(
  tx: DbOrTxClient,
  params: {
    courseIds: string[];
    cohortIds: string[];
    profileId: string;
    email: string;
    roleId: number;
  }
): Promise<TInviteEnrollment> {
  return enrollOrganizationInviteUserCore(tx, params, {
    ensureComplianceEnrollmentRecords: (courseIds, profileIds, dbClient) =>
      ensureComplianceEnrollmentRecordsForProfiles(courseIds, profileIds, dbClient ?? tx)
  });
}

type TOrgInviteAcceptOptions = {
  /** The token proves mailbox ownership; accept-by-id relies on the caller's verified email instead. */
  provesEmail: boolean;
};

/**
 * Accepts an organization invite for `user`: follows a replaced invite to its successor, binds the account in the
 * organization (applying the invite's role on first acceptance), enrols the invite's courses and cohorts, and
 * auto-accepts the person's other same-org student invites. Throws 403 for a revoked, foreign or other-email invite
 * and 400 for an expired one.
 */
async function acceptOrganizationInviteWith(
  loadRow: (client: DbOrTxClient) => Promise<TOrganizationInviteAcceptRow | null>,
  user: TAuthUser,
  context: TInviteRequestContext,
  options: TOrgInviteAcceptOptions
): Promise<{
  organizationId: string;
  roleId: number;
  alreadyAccepted: boolean;
  redirectTo: string;
  fulfilled: TInviteFulfilment;
}> {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  const identityProven = options.provesEmail || user.emailVerified === true;

  const result = await db.transaction(async (tx) => {
    const loaded = await readInviteAfterOrganizationLock(tx, loadRow, 'Invalid invite');
    const row = await followSupersededInvite(tx, loaded);

    const status = getInviteStatus(row.invite);
    if (status === 'REVOKED') {
      throw new AppError('This invite has been revoked', ErrorCodes.UNAUTHORIZED, 403);
    }
    if (status === 'EXPIRED') {
      throw new AppError('This invite has expired', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const inviteEmail = row.invite.email ?? '';
    if (inviteEmail.toLowerCase().trim() !== normalizedEmail) {
      throw new AppError('This invite is for a different email address', ErrorCodes.UNAUTHORIZED, 403);
    }

    const alreadyAccepted = status === 'ACCEPTED';
    const binding = await bindProfileInOrg(tx, {
      orgId: row.invite.organizationId,
      profileId: user.id,
      email: normalizedEmail,
      trigger: 'org-invite',
      identityProven,
      roleForNewMember: row.invite.roleId,
      inviteRoleId: alreadyAccepted ? undefined : row.invite.roleId,
      skipInviteIds: [row.invite.id]
    });

    if (!alreadyAccepted) {
      const acceptedInvite = await claimPendingOrganizationInvite(tx, row.invite.id, user.id);

      if (!acceptedInvite) {
        throw new AppError('Invite is no longer available', ErrorCodes.VALIDATION_ERROR, 409);
      }

      await applyInvitedFullname(tx, user.id, row.invite.metadata);
    }

    if (options.provesEmail) {
      await markUserAndProfileEmailVerified(user.id, tx);
    }

    const courseIds = parseCourseIdsFromInviteMetadata(row.invite.metadata);
    const cohortIds = parseCohortIdsFromInviteMetadata(row.invite.metadata);
    const enrollment = await enrollOrganizationInviteUser(tx, {
      courseIds,
      cohortIds,
      profileId: user.id,
      email: normalizedEmail,
      roleId: row.invite.roleId
    });

    return {
      organization: row.organization,
      invite: row.invite,
      alreadyAccepted,
      binding,
      enrollment,
      courseIds,
      cohortIds
    };
  });

  const organizationId = result.organization.id;

  await runBindingSideEffects(result.binding, {
    orgId: organizationId,
    profileId: user.id,
    email: normalizedEmail,
    trigger: 'org-invite',
    context
  });
  await emitCourseMembersAdded(result.enrollment.enrolledMembers, {
    inviteId: result.invite.id,
    actorProfileId: user.id
  });
  await emitInviteEnrollmentEvents(organizationId, user.id, result.enrollment);

  if (!result.alreadyAccepted) {
    await scheduleCourseRoleReconcile(organizationId, user.id);
    await recordOrganizationInviteAudit(result.invite.id, organizationId, 'ACCEPTED', {
      actorProfileId: user.id,
      targetEmail: normalizedEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { alreadyAccepted: false }
    });

    for (const courseId of result.courseIds) {
      await recordCourseInviteAccepted({
        inviteId: result.invite.id,
        courseId,
        profileId: user.id,
        email: normalizedEmail,
        metadata: {},
        courseInviteRow: false
      });
    }
  }

  if (result.enrollment.enrolledMembers.length > 0 && result.invite.roleId === ROLE.STUDENT) {
    await invalidateOrgStats(organizationId);
    captureLearnersEnrolled(result.enrollment.enrolledMembers, 'org_invite');
  }

  const fulfilledCourseIds = [...new Set([...result.courseIds, ...result.binding.fulfilled.courseIds])];
  const fulfilledCohortIds = [...new Set([...result.cohortIds, ...result.binding.fulfilled.cohortIds])];
  const fulfilledByThisInvite = {
    ...result.binding.fulfilled,
    courseIds: fulfilledCourseIds,
    cohortIds: fulfilledCohortIds
  };
  const fulfilled = await buildFulfilledSummary(organizationId, {
    ...result.binding,
    fulfilled: fulfilledByThisInvite
  });
  const siteName = result.organization.siteName || '';
  const redirectTo =
    result.invite.roleId === ROLE.STUDENT ? STUDENT_HOME_ENTRY_PATH : siteName ? `/org/${siteName}` : '/org';

  return {
    organizationId,
    roleId: result.invite.roleId,
    alreadyAccepted: result.alreadyAccepted,
    redirectTo,
    fulfilled
  };
}

type TeamInviteResult = {
  requiresConfirmation: boolean;
  studentEmails: string[];
  existingTeamMembers: { email: string; roleId: number }[];
  queuedCount: number;
  failedEmails: string[];
};

export async function inviteTeamMembers(
  orgId: string,
  emails: string[],
  roleId: number,
  invitedByProfileId: string,
  confirmedStudentEmails: string[] = []
): Promise<TeamInviteResult> {
  if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
    throw new AppError('Invalid organization role for invite', ErrorCodes.VALIDATION_ERROR, 400, 'roleId');
  }

  const organization = await getOrganizationById(orgId);
  if (!organization || !organization.siteName) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const normalizedEmails = normalizeEmails(emails);
  const existingMembers = await getOrganizationMembersByNormalizedEmails(orgId, normalizedEmails);
  const membersByEmail = new Map(existingMembers.map((member) => [member.normalizedEmail, member]));
  const studentEmails = normalizedEmails.filter((email) => membersByEmail.get(email)?.roleId === ROLE.STUDENT);
  const existingTeamMembers = normalizedEmails.flatMap((email) => {
    const member = membersByEmail.get(email);
    if (!member || member.roleId === ROLE.STUDENT) return [];

    return [{ email, roleId: member.roleId }];
  });
  const confirmedStudents = new Set(normalizeEmails(confirmedStudentEmails));
  const requiresConfirmation = studentEmails.some((email) => !confirmedStudents.has(email));

  if (existingTeamMembers.length > 0 || requiresConfirmation) {
    return { requiresConfirmation, studentEmails, existingTeamMembers, queuedCount: 0, failedEmails: [] };
  }

  const newEmails = normalizedEmails.filter((email) => !membersByEmail.has(email));
  if (newEmails.length > 0) {
    const newMembers = newEmails.map((email) => ({ organizationId: orgId, email, roleId, verified: false }));
    let createdMembers;
    try {
      createdMembers = await createOrganizationMembers(newMembers);
    } catch (error) {
      const conflict = membershipConflictError(error);
      if (conflict) throw conflict;
      throw error;
    }

    for (const createdMember of createdMembers) {
      await emitOrganizationMemberWebhookEvent('organization.member.added', orgId, createdMember, invitedByProfileId);
    }
  }

  const emailsToInvite = normalizedEmails;
  const revokedInvites = await revokeActiveOrganizationInvitesByEmails(orgId, emailsToInvite, invitedByProfileId);
  await Promise.all(
    revokedInvites.map((invite) =>
      recordOrganizationInviteAudit(invite.id, orgId, 'REVOKED', {
        actorProfileId: invitedByProfileId,
        targetEmail: invite.email,
        metadata: { reason: 'superseded_by_new_invite' }
      })
    )
  );

  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();
  const roleName = getRoleLabel(roleId);
  const inviterProfile = invitedByProfileId ? await getProfileById(invitedByProfileId) : null;
  const inviterName = inviterProfile?.fullname?.trim() || undefined;
  const expiryLabel = getExpiryLabel(expiresAt);
  const branding = buildEmailBranding(organization);
  const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);
  const subject = sanitizeEmailSubject(`You have been invited to join ${organization.name} on ClassroomIO`);
  const failedEmails = new Set<string>();
  let queuedCount = 0;

  for (const email of emailsToInvite) {
    let emailQueued = false;
    try {
      const token = generateToken();
      const tokenHash = hashToken(token);
      const previousRoleId = membersByEmail.get(email)?.roleId ?? null;

      const invite = await createOrganizationInvite({
        organizationId: orgId,
        roleId,
        email,
        tokenHash,
        createdByProfileId: invitedByProfileId,
        expiresAt,
        isRevoked: false,
        metadata: {
          source: 'ORG_SETTINGS_TEAM_INVITE',
          previousRoleId
        }
      });

      await recordOrganizationInviteAudit(invite.id, orgId, 'CREATED', {
        actorProfileId: invitedByProfileId,
        targetEmail: email,
        metadata: {
          roleId,
          previousRoleId,
          roleName,
          expiresAt
        }
      });

      const inviteLink = buildTeamInviteLink(token);

      try {
        await enqueueTransactionalEmail('inviteTeacher', {
          to: email,
          fields: {
            email,
            orgName: organization.name,
            orgSiteName: organization.siteName,
            roleName,
            inviterName,
            expiresAt: expiryLabel,
            inviteLink,
            branding
          },
          from,
          subject,
          idempotencyKey: `org-invite-teacher:${invite.id}`
        });

        emailQueued = true;
        queuedCount += 1;

        // Record EMAIL_SENT optimistically — the worker retries up to 5 times,
        // and a final failure flips the email_delivery row to `failed` for
        // operator follow-up. EMAIL_FAILED here only means the enqueue itself
        // failed (DB outbox write or transient validation error).
        await recordOrganizationInviteAudit(invite.id, orgId, 'EMAIL_SENT', {
          actorProfileId: invitedByProfileId,
          targetEmail: email
        });
      } catch (emailError) {
        if (emailQueued) {
          console.error(`Failed to audit queued org invite for ${email}:`, emailError);
          continue;
        }

        failedEmails.add(email);
        const message = emailError instanceof Error ? emailError.message : 'Unknown email error';

        await recordOrganizationInviteAudit(invite.id, orgId, 'EMAIL_FAILED', {
          actorProfileId: invitedByProfileId,
          targetEmail: email,
          metadata: { error: message }
        });
      }
    } catch (error) {
      console.error(`Failed to create org invite for ${email}:`, error);
      if (!emailQueued) failedEmails.add(email);
    }
  }

  const failedEmailList = [...failedEmails];
  return {
    requiresConfirmation: false,
    studentEmails,
    existingTeamMembers,
    queuedCount,
    failedEmails: failedEmailList
  };
}

/**
 * Server-only invite preview by token (API-key protected at route layer).
 */
export async function previewOrganizationInvite(token: string, context: TInviteRequestContext = {}) {
  const tokenHash = hashToken(token);
  const data = await getOrganizationInviteByTokenHash(tokenHash);

  if (!data) {
    throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
  }

  const { invite } = await followSupersededInvite(db, { invite: data.invite, organization: data.organization });

  await recordOrganizationInviteAudit(invite.id, invite.organizationId, 'PREVIEWED', {
    targetEmail: invite.email,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return {
    invite: {
      id: invite.id,
      roleId: invite.roleId,
      roleLabel: getRoleLabel(invite.roleId),
      email: invite.email,
      expiresAt: invite.expiresAt,
      status: getInviteStatus(invite)
    },
    organization: data.organization
  };
}

/**
 * Authenticated acceptance for organization role invites.
 */
export async function acceptOrganizationInvite(token: string, user: TAuthUser, context: TInviteRequestContext = {}) {
  const tokenHash = hashToken(token);

  return acceptOrganizationInviteWith(
    (client) => selectOrganizationInviteWithOrgByTokenHash(client, tokenHash),
    user,
    context,
    { provesEmail: true }
  );
}

// ─── Link Invite ────────────────────────────────────────────────────────────

const LINK_INVITE_FAR_FUTURE_MS = 100 * 365 * 24 * 60 * 60 * 1000;

/**
 * Returns a reusable link for the requested organization role.
 */
export async function getOrCreateLinkInvite(orgId: string, roleId: number, profileId: string) {
  if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
    throw new AppError('Invalid organization role for link invite', ErrorCodes.VALIDATION_ERROR, 400, 'roleId');
  }

  let wasCreated = false;
  const invite = await db.transaction(async (transaction) => {
    await lockOrganizationForUpdate(orgId, transaction);

    const existing = await getOrgLinkInvite(orgId, roleId, transaction);
    if (existing) return existing;

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + LINK_INVITE_FAR_FUTURE_MS).toISOString();

    const created = await createLinkInvite(
      {
        organizationId: orgId,
        roleId,
        tokenHash,
        createdByProfileId: profileId,
        expiresAt,
        metadata: { token, source: 'ORG_SETTINGS_LINK_INVITE' }
      },
      transaction
    );
    wasCreated = true;
    return created;
  });

  if (wasCreated) {
    await recordOrganizationInviteAudit(invite.id, orgId, 'CREATED', {
      actorProfileId: profileId,
      metadata: { roleId, type: 'LINK' }
    });
  }

  const token = (invite.metadata as Record<string, unknown>)?.token as string | undefined;
  return { id: invite.id, token: token ?? '', roleId: invite.roleId, isRevoked: invite.isRevoked };
}

/**
 * Returns the active link for the requested organization role, if one exists.
 */
export async function fetchOrgLinkInvite(orgId: string, roleId: number) {
  const row = await getOrgLinkInvite(orgId, roleId);

  if (!row) return null;

  const token = (row.metadata as Record<string, unknown>)?.token as string | undefined;
  return { id: row.id, token: token ?? '', roleId: row.roleId, isRevoked: row.isRevoked };
}

/**
 * Enables or disables the org link invite (toggle isRevoked).
 */
export async function toggleOrgLinkInvite(orgId: string, roleId: number, isRevoked: boolean, profileId: string) {
  const updated = await db.transaction(async (transaction) => {
    await lockOrganizationForUpdate(orgId, transaction);

    return setLinkInviteRevoked(orgId, roleId, isRevoked, profileId, transaction);
  });

  if (!updated) {
    throw new AppError('Link invite not found', ErrorCodes.NOT_FOUND, 404);
  }

  const token = (updated.metadata as Record<string, unknown>)?.token as string | undefined;
  return { id: updated.id, token: token ?? '', roleId: updated.roleId, isRevoked: updated.isRevoked };
}

/**
 * Server-only preview for a link invite (API-key protected at route layer).
 */
export async function previewLinkInvite(token: string, context: TInviteRequestContext = {}) {
  const tokenHash = hashToken(token);
  const data = await getOrgLinkInviteWithOrg(db, tokenHash);

  if (!data) {
    throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
  }

  await recordOrganizationInviteAudit(data.invite.id, data.invite.organizationId, 'PREVIEWED', {
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return {
    invite: {
      id: data.invite.id,
      roleId: data.invite.roleId,
      roleLabel: getRoleLabel(data.invite.roleId),
      isRevoked: data.invite.isRevoked
    },
    organization: data.organization
  };
}

/**
 * Accepts a link invite — adds the authenticated user to the org.
 * The invite is NOT consumed (reusable). Anyone with the link can join.
 */
export async function acceptLinkInvite(token: string, user: TAuthUser, context: TInviteRequestContext = {}) {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  const tokenHash = hashToken(token);

  const result = await db.transaction(async (tx) => {
    const row = await readInviteAfterOrganizationLock(
      tx,
      (client) => getOrgLinkInviteWithOrg(client, tokenHash),
      'Invalid invite link'
    );

    if (row.invite.isRevoked) {
      throw new AppError('This invite link has been disabled', ErrorCodes.UNAUTHORIZED, 403);
    }

    const binding = await bindProfileInOrg(tx, {
      orgId: row.invite.organizationId,
      profileId: user.id,
      email: normalizedEmail,
      trigger: 'org-invite',
      identityProven: user.emailVerified === true,
      roleForNewMember: row.invite.roleId,
      inviteRoleId: row.invite.roleId
    });

    return { organization: row.organization, roleId: row.invite.roleId, inviteId: row.invite.id, binding };
  });

  await runBindingSideEffects(result.binding, {
    orgId: result.organization.id,
    profileId: user.id,
    email: normalizedEmail,
    trigger: 'org-invite',
    context
  });

  await scheduleCourseRoleReconcile(result.organization.id, user.id);

  await recordOrganizationInviteAudit(result.inviteId, result.organization.id, 'ACCEPTED', {
    actorProfileId: user.id,
    targetEmail: normalizedEmail,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { source: 'LINK_INVITE' }
  });

  const siteName = result.organization.siteName || '';
  const redirectTo = result.roleId === ROLE.STUDENT ? STUDENT_HOME_ENTRY_PATH : siteName ? `/org/${siteName}` : '/org';

  return { organizationId: result.organization.id, roleId: result.roleId, redirectTo };
}

// ─── End Link Invite ─────────────────────────────────────────────────────────

/**
 * Returns the pending org invite for the currently logged-in user, if one exists.
 * Used by the LMS dashboard to prompt the student to accept on first load.
 */
export async function getPendingOrgInviteForUser(orgId: string, email: string) {
  if (!orgId || !email) {
    return null;
  }

  const data = await getActivePendingOrgInviteForEmail(orgId, email);

  if (!data) {
    return null;
  }

  return {
    id: data.invite.id,
    email: data.invite.email,
    roleId: data.invite.roleId,
    roleLabel: getRoleLabel(data.invite.roleId),
    expiresAt: data.invite.expiresAt,
    organization: data.organization
  };
}

/**
 * Accepts an organization invite by id for a signed-in user whose verified email the invite names. Throws 403 for an
 * unverified email.
 */
export async function acceptOrganizationInviteById(
  inviteId: string,
  user: TAuthUser,
  context: TInviteRequestContext = {}
) {
  if (!user.emailVerified) {
    throw new AppError('Verify your email address to accept this invite', ErrorCodes.FORBIDDEN, 403);
  }

  return acceptOrganizationInviteWith(
    (client) => selectOrganizationInviteWithOrgByInviteId(client, inviteId),
    user,
    context,
    { provesEmail: false }
  );
}
