import type { TCourseCompletionRecord, TGroupmember, TOrganizationmember } from '@cio/db/types';
import type { TCohortMember } from '@cio/db/queries/cohort';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  claimPendingOrganizationInvite,
  createOrganizationInvite,
  createOrganizationInviteAudit,
  createOrganizationInviteAudits,
  createOrganizationMember,
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
  selectOrganizationMemberByOrgAndNormalizedEmail,
  selectOrganizationMemberByOrgAndProfile,
  setLinkInviteRevoked,
  updateOrganizationMemberById
} from '@cio/db/queries/organization';
import { getCourseGroupIds } from '@cio/db/queries/course';
import { enrollUsersInCourseGroups } from '@cio/db/queries/group';
import { scheduleCourseRoleReconcile } from '@cio/core/services/organization/course-roles';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import {
  emitCohortMemberWebhookEvent,
  emitOrganizationMemberWebhookEvent,
  emitWebhookEvent
} from '@cio/core/services/webhook/emit';
import { addCohortMember, getCourseIdsByCohortIds, getExistingCohortMembers } from '@cio/db/queries/cohort';

import { ROLE } from '@cio/utils/constants';
import type { TNewOrganizationInviteAudit } from '@db/types';
import crypto from 'node:crypto';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { assertStudentCapacityOrThrow, notifyStudentMilestone } from './student-limit';
import type { StudentMilestoneNotification } from './student-limit';
import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import { parseCourseIdsFromInviteMetadata, parseCohortIdsFromInviteMetadata } from '@api/utils/org';
import { getProfileById, markUserAndProfileEmailVerified } from '@cio/db/queries/auth/profile';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { buildEmailBranding, buildEmailFromName, sanitizeEmailSubject } from '@cio/email';
import { emitComplianceEnrollmentEvents, ensureComplianceEnrollmentRecordsForProfiles } from '../course/compliance';
import { captureLearnersEnrolled } from '@api/services/product-events';

type OrganizationInviteStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED';

const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface TInviteRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface TAuthUser {
  id: string;
  email?: string | null;
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

async function syncOrgMemberForOrgInvite(
  tx: DbOrTxClient,
  params: { organizationId: string; roleId: number; normalizedEmail: string; userId: string }
): Promise<{
  studentMilestoneNotification: StudentMilestoneNotification | null;
  createdMember: TOrganizationmember | null;
}> {
  const orgMemberByEmail = await selectOrganizationMemberByOrgAndNormalizedEmail(
    tx,
    params.organizationId,
    params.normalizedEmail
  );

  if (orgMemberByEmail) {
    if (orgMemberByEmail.profileId && orgMemberByEmail.profileId !== params.userId) {
      throw new AppError('This invite is linked to another account', ErrorCodes.UNAUTHORIZED, 403);
    }

    await updateOrganizationMemberById(tx, orgMemberByEmail.id, {
      profileId: params.userId,
      roleId: params.roleId,
      email: params.normalizedEmail,
      verified: true
    });

    return { studentMilestoneNotification: null, createdMember: null };
  }

  const orgMemberByProfile = await selectOrganizationMemberByOrgAndProfile(tx, params.organizationId, params.userId);

  if (orgMemberByProfile) {
    await updateOrganizationMemberById(tx, orgMemberByProfile.id, {
      roleId: params.roleId,
      email: params.normalizedEmail,
      verified: true
    });

    return { studentMilestoneNotification: null, createdMember: null };
  }

  let studentMilestoneNotification: StudentMilestoneNotification | null = null;
  if (params.roleId === ROLE.STUDENT) {
    studentMilestoneNotification = await assertStudentCapacityOrThrow(params.organizationId, 1, tx, {
      deferNotification: true
    });
  }

  const createdMember = await createOrganizationMember(
    {
      organizationId: params.organizationId,
      roleId: params.roleId,
      profileId: params.userId,
      email: params.normalizedEmail,
      verified: true
    },
    tx
  );

  return { studentMilestoneNotification, createdMember };
}

const ORGANIZATION_INVITE_WEBHOOK_EVENTS: Partial<
  Record<
    TNewOrganizationInviteAudit['eventType'],
    'organization.invite.created' | 'organization.invite.accepted' | 'organization.invite.revoked'
  >
> = {
  CREATED: 'organization.invite.created',
  ACCEPTED: 'organization.invite.accepted',
  REVOKED: 'organization.invite.revoked'
};

async function recordOrganizationInviteAudit(
  inviteId: string,
  organizationId: string,
  eventType: TNewOrganizationInviteAudit['eventType'],
  context: {
    actorProfileId?: string | null;
    targetEmail?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  } = {}
) {
  await createOrganizationInviteAudit({
    inviteId,
    organizationId,
    eventType,
    actorProfileId: context.actorProfileId ?? null,
    targetEmail: context.targetEmail ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata: context.metadata ?? {}
  });

  const webhookEventType = ORGANIZATION_INVITE_WEBHOOK_EVENTS[eventType];

  if (webhookEventType) {
    await emitWebhookEvent(organizationId, webhookEventType, {
      inviteId,
      email: context.targetEmail ?? null,
      actorProfileId: context.actorProfileId ?? null,
      reason: typeof context.metadata?.reason === 'string' ? context.metadata.reason : null
    });
  }
}

export async function recordOrganizationInviteAudits(rows: TNewOrganizationInviteAudit[]) {
  await createOrganizationInviteAudits(rows);

  for (const row of rows) {
    const webhookEventType = ORGANIZATION_INVITE_WEBHOOK_EVENTS[row.eventType];

    if (!webhookEventType) continue;

    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const reason = typeof metadata.reason === 'string' ? metadata.reason : null;

    await emitWebhookEvent(row.organizationId, webhookEventType, {
      inviteId: row.inviteId,
      email: row.targetEmail ?? null,
      actorProfileId: row.actorProfileId ?? null,
      reason
    });
  }
}

type TInviteEnrollment = {
  enrolledMembers: TGroupmember[];
  complianceRecords: TCourseCompletionRecord[];
  cohortMembers: TCohortMember[];
};

async function emitInviteEnrollmentEvents(
  organizationId: string,
  actorProfileId: string,
  enrollment: TInviteEnrollment
) {
  await emitComplianceEnrollmentEvents(enrollment.complianceRecords);

  for (const cohortMember of enrollment.cohortMembers) {
    await emitCohortMemberWebhookEvent(
      'cohort.member.added',
      organizationId,
      cohortMember.cohortId,
      cohortMember,
      actorProfileId
    );
  }
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
  const enrolledMembers: TGroupmember[] = [];
  const complianceRecords: TCourseCompletionRecord[] = [];
  const cohortMembers: TCohortMember[] = [];

  if (params.courseIds.length > 0) {
    const courseGroupMappings = await getCourseGroupIds(params.courseIds, tx);
    const courseGroupIds = courseGroupMappings.map((mapping) => mapping.groupId).filter(Boolean) as string[];

    const courseMembers = await enrollUsersInCourseGroups(
      courseGroupIds,
      [{ profileId: params.profileId, email: params.email }],
      params.roleId,
      tx
    );
    enrolledMembers.push(...courseMembers);
    const enrollment = await ensureComplianceEnrollmentRecordsForProfiles(params.courseIds, [params.profileId], tx);
    complianceRecords.push(...enrollment.createdRecords);
  }

  if (params.cohortIds.length > 0) {
    const existingCohortMemberships = await getExistingCohortMembers(
      params.cohortIds.map((cohortId) => ({ cohortId, profileId: params.profileId })),
      tx
    );
    const cohortIdsToInsert = params.cohortIds.filter(
      (cohortId) => !existingCohortMemberships.has(`${cohortId}:${params.profileId}`)
    );

    for (const cohortId of cohortIdsToInsert) {
      const cohortMember = await addCohortMember(
        {
          cohortId,
          roleId: params.roleId,
          profileId: params.profileId,
          email: params.email
        },
        tx
      );
      cohortMembers.push(cohortMember);
    }

    const cohortCourseIds = await getCourseIdsByCohortIds(params.cohortIds, tx);
    const courseIdsToEnroll = cohortCourseIds.filter((courseId) => !params.courseIds.includes(courseId));

    if (courseIdsToEnroll.length > 0) {
      const cohortCourseGroups = await getCourseGroupIds(courseIdsToEnroll, tx);
      const cohortGroupIds = cohortCourseGroups.map((mapping) => mapping.groupId).filter(Boolean) as string[];

      const cohortCourseMembers = await enrollUsersInCourseGroups(
        cohortGroupIds,
        [{ profileId: params.profileId, email: params.email }],
        params.roleId,
        tx
      );
      enrolledMembers.push(...cohortCourseMembers);
      const enrollment = await ensureComplianceEnrollmentRecordsForProfiles(courseIdsToEnroll, [params.profileId], tx);
      complianceRecords.push(...enrollment.createdRecords);
    }
  }

  return { enrolledMembers, complianceRecords, cohortMembers };
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
    const createdMembers = await createOrganizationMembers(newMembers);

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

  await recordOrganizationInviteAudit(data.invite.id, data.invite.organizationId, 'PREVIEWED', {
    targetEmail: data.invite.email,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return {
    invite: {
      id: data.invite.id,
      roleId: data.invite.roleId,
      roleLabel: getRoleLabel(data.invite.roleId),
      email: data.invite.email,
      expiresAt: data.invite.expiresAt,
      status: getInviteStatus(data.invite)
    },
    organization: data.organization
  };
}

/**
 * Authenticated acceptance for organization role invites.
 */
export async function acceptOrganizationInvite(token: string, user: TAuthUser, context: TInviteRequestContext = {}) {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  const tokenHash = hashToken(token);

  const result = await db.transaction(async (tx) => {
    const row = await readInviteAfterOrganizationLock(
      tx,
      (client) => selectOrganizationInviteWithOrgByTokenHash(client, tokenHash),
      'Invalid invite link'
    );

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
    let studentMilestoneNotification: StudentMilestoneNotification | null = null;
    let createdMember: TOrganizationmember | null = null;

    if (!alreadyAccepted) {
      ({ studentMilestoneNotification, createdMember } = await syncOrgMemberForOrgInvite(tx, {
        organizationId: row.invite.organizationId,
        roleId: row.invite.roleId,
        normalizedEmail,
        userId: user.id
      }));

      const acceptedInvite = await claimPendingOrganizationInvite(tx, row.invite.id, user.id);

      if (!acceptedInvite) {
        throw new AppError('Invite is no longer available', ErrorCodes.VALIDATION_ERROR, 409);
      }
    }

    await markUserAndProfileEmailVerified(user.id, tx);

    const enrollment = await enrollOrganizationInviteUser(tx, {
      courseIds: parseCourseIdsFromInviteMetadata(row.invite.metadata),
      cohortIds: parseCohortIdsFromInviteMetadata(row.invite.metadata),
      profileId: user.id,
      email: normalizedEmail,
      roleId: row.invite.roleId
    });

    return {
      organization: row.organization,
      invite: row.invite,
      roleId: row.invite.roleId,
      alreadyAccepted,
      studentMilestoneNotification,
      createdMember,
      enrollment
    };
  });

  if (result.createdMember) {
    await emitOrganizationMemberWebhookEvent(
      'organization.member.added',
      result.organization.id,
      result.createdMember,
      user.id
    );
  }

  await emitInviteEnrollmentEvents(result.organization.id, user.id, result.enrollment);

  // Must run after commit: the reconcile reads the org role outside this transaction.
  if (!result.alreadyAccepted) {
    await scheduleCourseRoleReconcile(result.organization.id, user.id);
  }

  const siteName = result.organization.siteName || '';

  if (!result.alreadyAccepted) {
    await recordOrganizationInviteAudit(result.invite.id, result.invite.organizationId, 'ACCEPTED', {
      actorProfileId: user.id,
      targetEmail: normalizedEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { alreadyAccepted: false }
    });
  }

  if (result.enrollment.enrolledMembers.length > 0 && result.invite.roleId === ROLE.STUDENT) {
    await invalidateOrgStats(result.invite.organizationId);
    captureLearnersEnrolled(result.enrollment.enrolledMembers, 'org_invite');
  }

  if (result.studentMilestoneNotification) {
    notifyStudentMilestone(result.studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  const redirectTo = result.roleId === ROLE.STUDENT ? '/lms' : siteName ? `/org/${siteName}` : '/org';

  return {
    organizationId: result.organization.id,
    roleId: result.roleId,
    alreadyAccepted: result.alreadyAccepted,
    redirectTo
  };
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

    await syncOrgMemberForOrgInvite(tx, {
      organizationId: row.invite.organizationId,
      roleId: row.invite.roleId,
      normalizedEmail,
      userId: user.id
    });

    await markUserAndProfileEmailVerified(user.id, tx);

    return { organization: row.organization, roleId: row.invite.roleId, inviteId: row.invite.id };
  });

  // Must run after commit: the reconcile reads the org role outside this transaction.
  await scheduleCourseRoleReconcile(result.organization.id, user.id);

  await recordOrganizationInviteAudit(result.inviteId, result.organization.id, 'ACCEPTED', {
    actorProfileId: user.id,
    targetEmail: normalizedEmail,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { source: 'LINK_INVITE' }
  });

  const siteName = result.organization.siteName || '';
  const redirectTo = result.roleId === ROLE.STUDENT ? '/lms' : siteName ? `/org/${siteName}` : '/org';

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
 * Accepts an organization invite by invite ID (for logged-in students with a pending invite).
 * Replicates the acceptance logic of acceptOrganizationInvite but looks up by invite ID instead of token.
 */
export async function acceptOrganizationInviteById(
  inviteId: string,
  user: TAuthUser,
  context: TInviteRequestContext = {}
) {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const normalizedEmail = user.email.toLowerCase().trim();

  const result = await db.transaction(async (tx) => {
    const row = await readInviteAfterOrganizationLock(
      tx,
      (client) => selectOrganizationInviteWithOrgByInviteId(client, inviteId),
      'Invalid invite'
    );

    const status = getInviteStatus(row.invite);
    if (status === 'REVOKED') {
      throw new AppError('This invite has been revoked', ErrorCodes.UNAUTHORIZED, 403);
    }

    if (status === 'EXPIRED') {
      throw new AppError('This invite has expired', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const inviteEmailById = row.invite.email ?? '';
    if (inviteEmailById.toLowerCase().trim() !== normalizedEmail) {
      throw new AppError('This invite is for a different email address', ErrorCodes.UNAUTHORIZED, 403);
    }

    const alreadyAccepted = status === 'ACCEPTED';
    let studentMilestoneNotification: StudentMilestoneNotification | null = null;
    let createdMember: TOrganizationmember | null = null;

    if (!alreadyAccepted) {
      ({ studentMilestoneNotification, createdMember } = await syncOrgMemberForOrgInvite(tx, {
        organizationId: row.invite.organizationId,
        roleId: row.invite.roleId,
        normalizedEmail,
        userId: user.id
      }));

      const acceptedInvite = await claimPendingOrganizationInvite(tx, row.invite.id, user.id);

      if (!acceptedInvite) {
        throw new AppError('Invite is no longer available', ErrorCodes.VALIDATION_ERROR, 409);
      }
    }

    await markUserAndProfileEmailVerified(user.id, tx);

    const enrollment = await enrollOrganizationInviteUser(tx, {
      courseIds: parseCourseIdsFromInviteMetadata(row.invite.metadata),
      cohortIds: parseCohortIdsFromInviteMetadata(row.invite.metadata),
      profileId: user.id,
      email: normalizedEmail,
      roleId: row.invite.roleId
    });

    return {
      organization: row.organization,
      invite: row.invite,
      roleId: row.invite.roleId,
      alreadyAccepted,
      studentMilestoneNotification,
      createdMember,
      enrollment
    };
  });

  if (result.createdMember) {
    await emitOrganizationMemberWebhookEvent(
      'organization.member.added',
      result.invite.organizationId,
      result.createdMember,
      user.id
    );
  }

  await emitInviteEnrollmentEvents(result.invite.organizationId, user.id, result.enrollment);

  if (!result.alreadyAccepted) {
    // Must run after commit: the reconcile reads the org role outside this transaction.
    await scheduleCourseRoleReconcile(result.invite.organizationId, user.id);

    await recordOrganizationInviteAudit(result.invite.id, result.invite.organizationId, 'ACCEPTED', {
      actorProfileId: user.id,
      targetEmail: normalizedEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { alreadyAccepted: false }
    });
  }

  if (result.enrollment.enrolledMembers.length > 0 && result.invite.roleId === ROLE.STUDENT) {
    await invalidateOrgStats(result.invite.organizationId);
    captureLearnersEnrolled(result.enrollment.enrolledMembers, 'org_invite');
  }

  if (result.studentMilestoneNotification) {
    notifyStudentMilestone(result.studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  const siteName = result.organization.siteName || '';
  const redirectTo = result.roleId === ROLE.STUDENT ? '/lms' : siteName ? `/org/${siteName}` : '/org';

  return {
    organizationId: result.organization.id,
    roleId: result.roleId,
    alreadyAccepted: result.alreadyAccepted,
    redirectTo
  };
}
