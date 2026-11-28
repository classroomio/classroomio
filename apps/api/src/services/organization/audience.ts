import {
  emitCohortMemberWebhookEvent,
  emitCourseWebhookEvent,
  emitOrganizationMemberWebhookEvent
} from '@cio/core/services/webhook/emit';
import { AppError, ErrorCodes, membershipConflictError } from '@api/utils/errors';
import { parseFullnameFromInviteMetadata } from '@api/utils/org';
import {
  parseCohortIdsFromInviteMetadata,
  parseCourseIdsFromInviteMetadata
} from '@cio/utils/functions/invite-metadata';
import {
  type AudienceImportResult,
  type ParsedImportRow,
  type TAudienceImportRowStatus,
  isImportableEmail,
  parseAudienceImportCsv
} from '@cio/utils/validation/organization';
import type {
  TAssignAudienceCourses,
  TAudienceInviteByEmail,
  TImportAudienceMembers
} from '@cio/utils/validation/organization';
import {
  addGroupMembers,
  claimEmailOnlyGroupMembersForGroups,
  enrollUsersInCourseGroups,
  getExistingGroupMembers
} from '@cio/db/queries/group';
import {
  supersedeStudentOrgInvites,
  type TSupersedeStudentOrgInvitesResult
} from '@cio/core/services/organization/supersede-invites';
import type { TOrganizationInvite } from '@cio/db/types';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { buildEmailFromName, buildEmailBranding } from '@cio/email';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import {
  addCohortMember,
  claimEmailOnlyCohortMembersForCohorts,
  getCohortsByOrg,
  getCourseIdsByCohortIds,
  getExistingCohortMembers
} from '@cio/db/queries/cohort';
import {
  createOrganizationInvite,
  createOrganizationInvites,
  createOrganizationMembers,
  getBulkAudienceMembersByIds,
  getOrganizationAudienceMember,
  getLatestOrganizationInviteMetadataByEmails,
  getLatestOrganizationInviteRowByOrgAndEmail,
  getOrgMembersByProfileIds,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  getOrganizationMembersByProfileIds,
  getStudentOrganizationMemberByOrgAndEmail,
  hasActiveOrganizationInviteForEmail,
  hasLapsedStudentInvite,
  listLiveStudentOrgInvitesForEmail,
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import { recordOrganizationInviteAudits } from './invite';
import { getCourseGroupIds, getOrgCourseGroups, getOrgCourses } from '@cio/db/queries/course';
import { updateOrganizationAudienceMember } from '@cio/db/queries/organization';

import { ROLE } from '@cio/utils/constants';
import crypto from 'node:crypto';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { assertStudentCapacityOrThrow, getRemainingStudentSeats, notifyStudentMilestone } from './student-limit';
import type { StudentMilestoneNotification } from './student-limit';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getProfilesByEmails } from '@cio/db/queries/auth';
import { ensureComplianceEnrollmentRecordsForProfiles } from '../course/compliance';
import { getWelcomeSessionIcs } from '../course/session-invite';
import type { TEventSource } from '@cio/core/services/posthog';
import { captureLearnerInvited, captureLearnersEnrolled } from '@api/services/product-events';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
/** Parallel outbound invite emails; avoids sequential SMTP/API latency per recipient. */
const EMAIL_SEND_CONCURRENCY = 5;

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }
  const results: R[] = new Array(items.length);
  let next = 0;
  const workerCount = Math.min(concurrency, items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function buildInviteLink(
  token: string,
  org?: { siteName?: string | null; customDomain?: string | null; isCustomDomainVerified?: boolean | null }
): string {
  return `${getDashboardBaseUrl(org)}/invite/${encodeURIComponent(token)}`;
}

function getExpiryLabel(expiresAtIso: string): string {
  return new Date(expiresAtIso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  });
}

async function resolveCourseIdsAndNamesForImport(orgId: string, data: TImportAudienceMembers) {
  let courseIds: string[] = [];
  let courseNames: string[] = [];
  if (data.allCourses) {
    const courses = await getOrgCourses({ orgId });
    courseIds = courses.items.map((c) => c.id);
    courseNames = courses.items.map((c) => c.title).filter(Boolean);
  } else if (data.courseIds && data.courseIds.length > 0) {
    const courses = await getOrgCourses({ orgId, courseIds: data.courseIds });
    courseIds = courses.items.map((c) => c.id);
    courseNames = courses.items.map((c) => c.title).filter(Boolean);
  }
  return { courseIds, courseNames };
}

async function resolveCohortIdsAndNamesForImport(orgId: string, data: TImportAudienceMembers) {
  let cohortIds: string[] = [];
  let cohortNames: string[] = [];

  if (data.allCohorts) {
    const cohorts = await getCohortsByOrg(orgId);
    cohortIds = cohorts.map((cohort) => cohort.id);
    cohortNames = cohorts.map((cohort) => cohort.name).filter(Boolean);
  } else if (data.cohortIds && data.cohortIds.length > 0) {
    const cohorts = await getCohortsByOrg(orgId, data.cohortIds);
    cohortIds = cohorts.map((cohort) => cohort.id);
    cohortNames = cohorts.map((cohort) => cohort.name).filter(Boolean);
  }

  return { cohortIds, cohortNames };
}

async function enrollAudienceStudentProfilesInCourses(
  orgId: string,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>,
  profileIds: string[],
  courseIds: string[],
  shouldSendEmail: boolean,
  source: TEventSource
): Promise<TAudienceEnrollResult> {
  if (courseIds.length === 0 || profileIds.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, outcomes: [] };
  }

  const uniqueProfileIds = [...new Set(profileIds)];
  const orgMembers = await getOrgMembersByProfileIds(orgId, uniqueProfileIds);
  const studentMembers = orgMembers.filter((m) => m.profileId && m.roleId === ROLE.STUDENT);
  const validProfileIds = new Set(studentMembers.map((m) => m.profileId!));
  const profileEmailMap = new Map(studentMembers.filter((m) => m.profileId).map((m) => [m.profileId!, m.email ?? '']));

  const courseGroups = await getOrgCourseGroups(orgId, courseIds);

  if (courseGroups.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, outcomes: [] };
  }

  const validGroupIds = courseGroups.map((cg) => cg.groupId).filter(Boolean) as string[];
  const courseTitleByGroupId = new Map(courseGroups.map((cg) => [cg.groupId, cg.courseTitle]));
  const welcomeMessageByGroupId = new Map(courseGroups.map((cg) => [cg.groupId, cg.welcomeEmailMessage]));
  const validProfiles = uniqueProfileIds.filter((id) => validProfileIds.has(id));
  const users = validProfiles.map((profileId) => ({
    profileId,
    email: profileEmailMap.get(profileId) || undefined
  }));

  await claimEmailOnlyGroupMembersForGroups(validGroupIds, users);

  const pairs = validProfiles.flatMap((profileId) => validGroupIds.map((groupId) => ({ groupId, profileId })));

  const existingSet = await getExistingGroupMembers(pairs);

  const toInsert = pairs.filter((p) => !existingSet.has(`${p.groupId}:${p.profileId}`));
  const alreadyEnrolled = pairs.length - toInsert.length;

  if (toInsert.length > 0) {
    const enrolledMembers = await addGroupMembers(
      toInsert.map((p) => ({
        groupId: p.groupId,
        roleId: ROLE.STUDENT,
        profileId: p.profileId,
        email: profileEmailMap.get(p.profileId) || undefined
      }))
    );

    await invalidateOrgStats(orgId);
    captureLearnersEnrolled(enrolledMembers, 'audience', source);
  }

  if (validProfiles.length > 0) {
    await ensureComplianceEnrollmentRecordsForProfiles(
      courseGroups.map((courseGroup) => courseGroup.courseId),
      validProfiles
    );
  }

  let emailsSent = 0;
  const loginUrl = getDashboardBaseUrl(organization);

  if (shouldSendEmail && toInsert.length > 0) {
    const icsByGroupId = new Map(
      await Promise.all(courseGroups.map(async (cg) => [cg.groupId, await getWelcomeSessionIcs(cg.courseId)] as const))
    );

    const emailPromises = toInsert
      .filter((p) => profileEmailMap.get(p.profileId))
      .map(async (p) => {
        const email = profileEmailMap.get(p.profileId)!;
        try {
          await enqueueTransactionalEmail('studentCourseWelcome', {
            to: email,
            fields: {
              orgName: organization.name,
              courseName: courseTitleByGroupId.get(p.groupId) || 'Course',
              loginUrl,
              customMessage: welcomeMessageByGroupId.get(p.groupId) ?? undefined,
              branding: buildEmailBranding(organization)
            },
            from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
            idempotencyKey: `audience-course-welcome:${p.groupId}:${p.profileId}`,
            ics: icsByGroupId.get(p.groupId),
            preference: { organizationId: orgId, recipientProfileId: p.profileId }
          });
          emailsSent++;
        } catch (emailError) {
          console.error(`enrollAudienceStudentProfilesInCourses enqueue error for ${email}:`, emailError);
        }
      });

    await Promise.all(emailPromises);
  }

  const insertedProfileIds = new Set(toInsert.map((pair) => pair.profileId));
  const outcomes = validProfiles.map((profileId) => ({
    profileId,
    status: insertedProfileIds.has(profileId) ? ('enrolled' as const) : ('already_enrolled' as const)
  }));

  return { assigned: toInsert.length, alreadyEnrolled, emailsSent, outcomes };
}

async function enrollAudienceStudentProfilesInCohorts(
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>,
  orgId: string,
  profileIds: string[],
  cohortIds: string[],
  shouldSendEmail: boolean,
  source: TEventSource,
  actorProfileId: string | null = null
): Promise<TAudienceEnrollResult> {
  if (cohortIds.length === 0 || profileIds.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, outcomes: [] };
  }

  const uniqueProfileIds = [...new Set(profileIds)];
  const orgMembers = await getOrgMembersByProfileIds(orgId, uniqueProfileIds);
  const studentMembers = orgMembers.filter((member) => member.profileId && member.roleId === ROLE.STUDENT);
  const validProfileIds = new Set(studentMembers.map((member) => member.profileId!));
  const profileEmailMap = new Map(
    studentMembers.filter((member) => member.profileId).map((member) => [member.profileId!, member.email ?? ''])
  );

  const cohorts = await getCohortsByOrg(orgId, cohortIds);
  if (cohorts.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, outcomes: [] };
  }

  const cohortNameById = new Map(cohorts.map((cohort) => [cohort.id, cohort.name || 'Cohort']));
  const loginUrl = getDashboardBaseUrl(organization);
  const validCohortIds = cohorts.map((cohort) => cohort.id);
  const validProfiles = uniqueProfileIds.filter((profileId) => validProfileIds.has(profileId));
  const users = validProfiles.map((profileId) => ({
    profileId,
    email: profileEmailMap.get(profileId) || undefined
  }));

  await claimEmailOnlyCohortMembersForCohorts(validCohortIds, users);

  const pairs = validProfiles.flatMap((profileId) => validCohortIds.map((cohortId) => ({ cohortId, profileId })));
  const existingSet = await getExistingCohortMembers(pairs);
  const toInsert = pairs.filter((pair) => !existingSet.has(`${pair.cohortId}:${pair.profileId}`));
  const alreadyEnrolled = pairs.length - toInsert.length;

  if (toInsert.length > 0) {
    const addedCohortMembers = await Promise.all(
      toInsert.map((pair) =>
        addCohortMember({
          cohortId: pair.cohortId,
          roleId: ROLE.STUDENT,
          profileId: pair.profileId,
          email: profileEmailMap.get(pair.profileId) || undefined
        })
      )
    );

    for (const cohortMember of addedCohortMembers) {
      await emitCohortMemberWebhookEvent(
        'cohort.member.added',
        orgId,
        cohortMember.cohortId,
        cohortMember,
        actorProfileId
      );
    }
  }

  // Enrols every assigned profile, not only new memberships, so re-running repairs
  // members added before cohort course enrolment existed.
  const cohortCourseIds = await getCourseIdsByCohortIds(validCohortIds);

  if (cohortCourseIds.length > 0 && validProfiles.length > 0) {
    const courseGroups = await getCourseGroupIds(cohortCourseIds);
    const groupIds = courseGroups.map((mapping) => mapping.groupId).filter(Boolean) as string[];
    const enrolledMembers = await enrollUsersInCourseGroups(groupIds, users, ROLE.STUDENT);

    if (enrolledMembers.length > 0) {
      await invalidateOrgStats(orgId);
      captureLearnersEnrolled(enrolledMembers, 'cohort', source);
    }

    await ensureComplianceEnrollmentRecordsForProfiles(cohortCourseIds, validProfiles);
  }

  let emailsSent = 0;

  if (shouldSendEmail && toInsert.length > 0) {
    await Promise.all(
      toInsert
        .filter((pair) => profileEmailMap.get(pair.profileId))
        .map(async (pair) => {
          const email = profileEmailMap.get(pair.profileId)!;

          try {
            await enqueueTransactionalEmail('studentCohortWelcome', {
              to: email,
              fields: {
                orgName: organization.name,
                cohortName: cohortNameById.get(pair.cohortId) || 'Cohort',
                loginUrl,
                branding: buildEmailBranding(organization)
              },
              from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
              idempotencyKey: `audience-cohort-welcome:${pair.cohortId}:${pair.profileId}`,
              preference: { organizationId: orgId, recipientProfileId: pair.profileId }
            });
            emailsSent++;
          } catch (emailError) {
            console.error(`enrollAudienceStudentProfilesInCohorts enqueue error for ${email}:`, emailError);
          }
        })
    );
  }

  const insertedProfileIds = new Set(toInsert.map((pair) => pair.profileId));
  const outcomes = validProfiles.map((profileId) => ({
    profileId,
    status: insertedProfileIds.has(profileId) ? ('enrolled' as const) : ('already_enrolled' as const)
  }));

  return { assigned: toInsert.length, alreadyEnrolled, emailsSent, outcomes };
}

type StudentOrgInviteInput = {
  orgId: string;
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>;
  emails: string[];
  courseIds: string[];
  cohortIds: string[];
  invitedByProfileId: string;
  shouldSendEmail: boolean;
  fullnamesByEmail?: Map<string, string>;
  reissue?: 'always' | 'when-changed';
  source?: string;
};

async function createStudentOrgInvitesAndSendEmails(
  input: StudentOrgInviteInput
): Promise<TStudentOrgInviteSendResult & { invites: TStudentOrgInvites | null }> {
  const invites = await db.transaction((tx) => createStudentOrgInvites(input, tx));
  const sent = await sendStudentOrgInvites(input, invites);

  return { ...sent, invites };
}

type TStudentOrgInvites = TSupersedeStudentOrgInvitesResult;

type TStudentOrgInviteSendResult = {
  created: number;
  emailsSent: number;
  emailsFailed: number;
  emailFailures: { email: string; error: string }[];
};

/** Merges the resources into each email's live student invite, inside the caller's transaction. */
async function createStudentOrgInvites(
  input: Pick<
    StudentOrgInviteInput,
    'orgId' | 'emails' | 'courseIds' | 'cohortIds' | 'invitedByProfileId' | 'fullnamesByEmail' | 'reissue' | 'source'
  >,
  dbClient: DbOrTxClient
): Promise<TStudentOrgInvites | null> {
  if (input.emails.length === 0) return null;

  return supersedeStudentOrgInvites(dbClient, {
    orgId: input.orgId,
    emails: input.emails,
    courseIds: input.courseIds,
    cohortIds: input.cohortIds,
    invitedByProfileId: input.invitedByProfileId,
    fullnamesByEmail: input.fullnamesByEmail,
    source: input.source ?? 'AUDIENCE_IMPORT',
    reissue: input.reissue ?? 'always'
  });
}

async function resolveInviteAccessNames(orgId: string, invites: TOrganizationInvite[]): Promise<Map<string, string>> {
  const courseIds = [...new Set(invites.flatMap((invite) => parseCourseIdsFromInviteMetadata(invite.metadata)))];
  const cohortIds = [...new Set(invites.flatMap((invite) => parseCohortIdsFromInviteMetadata(invite.metadata)))];
  const [courseGroups, cohorts] = await Promise.all([
    courseIds.length > 0 ? getOrgCourseGroups(orgId, courseIds) : [],
    cohortIds.length > 0 ? getCohortsByOrg(orgId, cohortIds) : []
  ]);
  const names = new Map<string, string>();
  for (const courseGroup of courseGroups) {
    if (courseGroup.courseTitle) names.set(courseGroup.courseId, courseGroup.courseTitle);
  }
  for (const cohort of cohorts) {
    if (cohort.name) names.set(cohort.id, cohort.name);
  }

  return names;
}

function accessLabelForInvite(invite: TOrganizationInvite, names: Map<string, string>): string | undefined {
  const ids = [
    ...parseCourseIdsFromInviteMetadata(invite.metadata),
    ...parseCohortIdsFromInviteMetadata(invite.metadata)
  ];
  const labels = ids.flatMap((id) => {
    const name = names.get(id);

    return name ? [name] : [];
  });

  return labels.length > 0 ? labels.join(', ') : undefined;
}

/**
 * Import row status for an address another request added to the organization first: only a pending (unjoined)
 * active student still gets an invite carrying the requested access.
 */
function classifyRacedMember(member: {
  roleId: number | null;
  status: string | null;
  profileId: string | null;
}): TAudienceImportRowStatus {
  if (member.roleId !== ROLE.STUDENT) return 'is_staff';
  if (member.status === 'ARCHIVED') return 'archived';
  if (member.profileId) return 'already_member';

  return 'ready';
}

/**
 * Emits `course.invite.created` / `course.invite.revoked` for courses added to or removed from a person's
 * organization invite. `inviteId` is the invite that now carries an added course, and for a removed course the
 * replaced invite that carried it (preferred over other invites retired in the same call, such as expired ones).
 */
async function emitCourseInviteChanges(invites: TStudentOrgInvites, actorProfileId: string): Promise<void> {
  for (const [email, courseIds] of invites.addedCourseIdsByEmail) {
    const invite = invites.inviteByEmail.get(email);
    if (!invite) continue;

    for (const courseId of courseIds) {
      await emitCourseWebhookEvent(courseId, 'course.invite.created', {
        inviteId: invite.id,
        inviteLinkId: null,
        email,
        actorProfileId
      });
    }
  }

  for (const [email, courseIds] of invites.removedCourseIdsByEmail) {
    const revokedForEmail = invites.revoked.filter((row) => (row.email ?? '').toLowerCase() === email);

    for (const courseId of courseIds) {
      const carryingInvite = revokedForEmail.find((row) =>
        parseCourseIdsFromInviteMetadata(row.metadata).includes(courseId)
      );
      const invite = carryingInvite ?? revokedForEmail[0] ?? invites.inviteByEmail.get(email);
      if (!invite) continue;

      await emitCourseWebhookEvent(courseId, 'course.invite.revoked', {
        inviteId: invite.id,
        inviteLinkId: null,
        email,
        actorProfileId
      });
    }
  }
}

/**
 * Audits and emails the invites this call issued (fresh tokens only), listing every course and cohort each invite
 * carries. Runs after any transaction, since it emits webhooks and queues email.
 */
async function sendStudentOrgInvites(
  input: StudentOrgInviteInput,
  invites: TStudentOrgInvites | null
): Promise<TStudentOrgInviteSendResult> {
  const { orgId, organization, invitedByProfileId, shouldSendEmail } = input;
  if (!invites) {
    return { created: 0, emailsSent: 0, emailsFailed: 0, emailFailures: [] };
  }

  await emitCourseInviteChanges(invites, invitedByProfileId);

  const issued = invites.created.filter((invite) => invites.tokenByEmail.has((invite.email ?? '').toLowerCase()));
  if (issued.length === 0) {
    return { created: 0, emailsSent: 0, emailsFailed: 0, emailFailures: [] };
  }

  await recordOrganizationInviteAudits(
    issued.map((invite) => ({
      inviteId: invite.id,
      organizationId: orgId,
      eventType: 'CREATED' as const,
      actorProfileId: invitedByProfileId,
      targetEmail: invite.email,
      ipAddress: null,
      userAgent: null,
      metadata: {
        roleId: ROLE.STUDENT,
        roleName: 'Student',
        expiresAt: invite.expiresAt,
        courseIds: parseCourseIdsFromInviteMetadata(invite.metadata),
        cohortIds: parseCohortIdsFromInviteMetadata(invite.metadata)
      }
    }))
  );

  if (!shouldSendEmail) {
    return { created: issued.length, emailsSent: 0, emailsFailed: 0, emailFailures: [] };
  }

  const names = await resolveInviteAccessNames(orgId, issued);
  const emailOutcomes = await mapWithConcurrency(issued, EMAIL_SEND_CONCURRENCY, async (invite) => {
    const email = (invite.email ?? '').toLowerCase();
    const token = invites.tokenByEmail.get(email)!;
    try {
      const { jobIds } = await enqueueTransactionalEmail('studentOrgInvite', {
        to: email,
        fields: {
          email,
          orgName: organization.name,
          inviteLink: buildInviteLink(token, organization),
          expiresAt: getExpiryLabel(invite.expiresAt),
          courseNames: accessLabelForInvite(invite, names),
          branding: buildEmailBranding(organization)
        },
        from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
        organizationId: orgId,
        idempotencyKey: `student-org-invite:${invite.id}`
      });
      if (jobIds.length === 0) {
        return { inviteId: invite.id, email, success: false as const, error: 'The email was not queued' };
      }

      return { inviteId: invite.id, email, success: true as const, error: undefined as string | undefined };
    } catch (emailError) {
      const message = emailError instanceof Error ? emailError.message : 'Unknown email error';

      return { inviteId: invite.id, email, success: false as const, error: message };
    }
  });

  const emailsSent = emailOutcomes.filter((outcome) => outcome.success).length;

  await recordOrganizationInviteAudits(
    emailOutcomes.map((outcome) => ({
      inviteId: outcome.inviteId,
      organizationId: orgId,
      eventType: outcome.success ? ('EMAIL_SENT' as const) : ('EMAIL_FAILED' as const),
      actorProfileId: invitedByProfileId,
      targetEmail: outcome.email,
      ipAddress: null,
      userAgent: null,
      metadata: outcome.success ? {} : { error: outcome.error ?? 'Unknown' }
    }))
  );

  const emailFailures = emailOutcomes.flatMap((outcome) =>
    outcome.success ? [] : [{ email: outcome.email, error: outcome.error ?? 'Unknown email error' }]
  );

  return { created: issued.length, emailsSent, emailsFailed: emailFailures.length, emailFailures };
}

type TImportRow = ParsedImportRow & {
  status: TAudienceImportRowStatus;
  inviteId?: string;
  inviteLink?: string;
  enrollment?: 'enrolled' | 'already_enrolled';
};

export type TImportAudienceOptions = {
  /** `when-changed` leaves a live invite that already covers the requested access untouched (no email). */
  reissue?: 'always' | 'when-changed';
  /** Return the accept link for each invite issued by this call. */
  includeInviteLinks?: boolean;
  inviteSource?: string;
};

/**
 * Adds or re-invites students by email: new emails become pending members with an invite, pending members get the
 * access merged into their live invite, joined students are enrolled directly, and staff, archived and over-limit
 * rows are reported per row. Nobody gets course or cohort rows before they join.
 */
export async function importAudienceMembers(
  orgId: string,
  data: TImportAudienceMembers,
  invitedByProfileId: string,
  source: TEventSource = 'dashboard',
  options: TImportAudienceOptions = {}
) {
  const organization = await getOrganizationById(orgId);
  if (!organization || !organization.siteName) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const parsed = data.recipients?.length
    ? {
        rows: data.recipients.map((recipient, index) => ({
          line: index + 1,
          email: recipient.email.trim().toLowerCase(),
          name: recipient.name,
          courses: recipient.courses ?? [],
          status: isImportableEmail(recipient.email) ? ('ready' as const) : ('invalid_email' as const)
        })),
        truncated: 0
      }
    : parseAudienceImportCsv(data.recipientCsv ?? '');

  const seenEmails = new Set<string>();
  const rows: TImportRow[] = parsed.rows.map((row) => {
    if (row.status !== 'ready') return row;
    if (seenEmails.has(row.email)) return { ...row, status: 'duplicate_in_file' as const };

    seenEmails.add(row.email);
    return row;
  });

  const candidateEmails = rows.filter((row) => row.status === 'ready').map((row) => row.email);

  if (candidateEmails.length === 0) {
    return {
      ...buildImportResult(rows, { imported: 0, enrolled: 0, emailsSent: 0, emailsFailed: 0 }),
      assigned: 0,
      alreadyEnrolledInCourses: 0,
      alreadyEnrolledInCohorts: 0,
      pendingInvitesRenewed: 0,
      emailFailures: [] as { email: string; error: string }[],
      truncated: parsed.truncated
    };
  }

  const memberRows = await getOrganizationMembersByNormalizedEmails(orgId, candidateEmails);
  const memberByEmail = new Map(memberRows.map((m) => [m.normalizedEmail, m]));

  const newEmails: string[] = [];
  const existingStudentProfileIds: string[] = [];
  const pendingStudentEmails: string[] = [];

  let seatsLeft = await getRemainingStudentSeats(orgId);
  let renewedSeats = 0;
  const takeSeat = () => {
    if (seatsLeft <= 0) return false;

    seatsLeft -= 1;
    return true;
  };

  for (const row of rows) {
    if (row.status !== 'ready') continue;

    const m = memberByEmail.get(row.email);

    if (!m) {
      if (takeSeat()) {
        newEmails.push(row.email);
      } else {
        row.status = 'over_seat_limit';
      }
      continue;
    }

    if (m.roleId !== ROLE.STUDENT) {
      row.status = 'is_staff';
      continue;
    }

    if (m.status === 'ARCHIVED') {
      row.status = 'archived';
      continue;
    }

    if (!m.profileId) {
      if (m.hasLapsedInvite) {
        if (!takeSeat()) {
          row.status = 'over_seat_limit';
          continue;
        }

        renewedSeats += 1;
      }

      pendingStudentEmails.push(row.email);
      row.status = 'invite_resent';
      continue;
    }

    existingStudentProfileIds.push(m.profileId);
    row.status = 'already_member';
  }

  const fullnamesByEmail = new Map<string, string>();
  for (const row of rows) {
    if (row.status !== 'ready' && row.status !== 'invite_resent') continue;

    const fullname = row.name?.trim();
    if (fullname) fullnamesByEmail.set(row.email, fullname);
  }

  const { courseIds } = await resolveCourseIdsAndNamesForImport(orgId, data);
  const { cohortIds } = await resolveCohortIdsAndNamesForImport(orgId, data);

  const assignedToCourses = await enrollAudienceStudentProfilesInCourses(
    orgId,
    organization,
    existingStudentProfileIds,
    courseIds,
    data.sendEmail,
    source
  );
  const assignedToCohorts = await enrollAudienceStudentProfilesInCohorts(
    organization,
    orgId,
    existingStudentProfileIds,
    cohortIds,
    data.sendEmail,
    source,
    invitedByProfileId
  );

  const enrolledProfileIds = new Set(
    [...assignedToCourses.outcomes, ...assignedToCohorts.outcomes]
      .filter((outcome) => outcome.status === 'enrolled')
      .map((outcome) => outcome.profileId)
  );
  for (const row of rows) {
    const profileId = row.status === 'already_member' ? memberByEmail.get(row.email)?.profileId : null;
    if (!profileId || (courseIds.length === 0 && cohortIds.length === 0)) continue;

    row.enrollment = enrolledProfileIds.has(profileId) ? 'enrolled' : 'already_enrolled';
  }

  let studentMilestoneNotification: StudentMilestoneNotification | null = null;
  let insertedMembers: Awaited<ReturnType<typeof createOrganizationMembers>> = [];
  let renewedInvites: TStudentOrgInvites | null = null;
  const inviteInput = {
    orgId,
    organization,
    courseIds,
    cohortIds,
    invitedByProfileId,
    shouldSendEmail: data.sendEmail,
    fullnamesByEmail,
    reissue: options.reissue ?? 'always',
    source: options.inviteSource
  };

  if (newEmails.length > 0 || pendingStudentEmails.length > 0) {
    try {
      await db.transaction(async (tx) => {
        if (newEmails.length + renewedSeats > 0) {
          studentMilestoneNotification = await assertStudentCapacityOrThrow(
            orgId,
            newEmails.length + renewedSeats,
            tx,
            { deferNotification: true }
          );
        }

        if (newEmails.length > 0) {
          insertedMembers = await createOrganizationMembers(
            newEmails.map((email) => ({ organizationId: orgId, email, roleId: ROLE.STUDENT, verified: false })),
            tx
          );
        }

        renewedInvites = await createStudentOrgInvites({ ...inviteInput, emails: pendingStudentEmails }, tx);
      });
    } catch (error) {
      const conflict = membershipConflictError(error);
      if (conflict) throw conflict;
      throw error;
    }
  }

  if (studentMilestoneNotification) {
    notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  for (const insertedMember of insertedMembers) {
    await emitOrganizationMemberWebhookEvent('organization.member.added', orgId, insertedMember, invitedByProfileId);
  }

  const insertedEmails = new Set(insertedMembers.map((member) => (member.email ?? '').toLowerCase()));
  const addedEmails = newEmails.filter((email) => insertedEmails.has(email));
  const racedEmails = newEmails.filter((email) => !insertedEmails.has(email));
  const racedMembers = racedEmails.length > 0 ? await getOrganizationMembersByNormalizedEmails(orgId, racedEmails) : [];
  const racedStatusByEmail = new Map(
    racedMembers.map((member) => [member.normalizedEmail, classifyRacedMember(member)])
  );
  const racedPendingEmails = racedEmails.filter((email) => racedStatusByEmail.get(email) === 'ready');
  const racedJoinedProfileIds = racedMembers
    .filter((member) => racedStatusByEmail.get(member.normalizedEmail) === 'already_member' && member.profileId)
    .map((member) => member.profileId as string);

  const racedEnrolledCourses =
    racedJoinedProfileIds.length > 0 && courseIds.length > 0
      ? await enrollAudienceStudentProfilesInCourses(
          orgId,
          organization,
          racedJoinedProfileIds,
          courseIds,
          data.sendEmail,
          source
        )
      : { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, outcomes: [] as TAudienceEnrollmentOutcome[] };
  const racedEnrolledCohorts =
    racedJoinedProfileIds.length > 0 && cohortIds.length > 0
      ? await enrollAudienceStudentProfilesInCohorts(
          organization,
          orgId,
          racedJoinedProfileIds,
          cohortIds,
          data.sendEmail,
          source,
          invitedByProfileId
        )
      : { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, outcomes: [] as TAudienceEnrollmentOutcome[] };

  const racedEnrolledProfileIds = new Set(
    [...racedEnrolledCourses.outcomes, ...racedEnrolledCohorts.outcomes]
      .filter((outcome) => outcome.status === 'enrolled')
      .map((outcome) => outcome.profileId)
  );

  const imported = await createStudentOrgInvitesAndSendEmails({
    ...inviteInput,
    emails: [...addedEmails, ...racedPendingEmails]
  });
  for (const row of rows) {
    if (row.status !== 'ready' || !racedEmails.includes(row.email)) continue;

    const racedStatus = racedStatusByEmail.get(row.email) ?? 'already_member';
    const invited = imported.invites?.inviteByEmail.has(row.email) ?? false;
    row.status = racedStatus === 'ready' && !invited ? 'already_member' : racedStatus;
    if (row.status === 'already_member' && (courseIds.length > 0 || cohortIds.length > 0)) {
      const profileId = racedMembers.find((member) => member.normalizedEmail === row.email)?.profileId;
      if (profileId) row.enrollment = racedEnrolledProfileIds.has(profileId) ? 'enrolled' : 'already_enrolled';
    }
  }
  const renewed = await sendStudentOrgInvites({ ...inviteInput, emails: pendingStudentEmails }, renewedInvites);

  for (const invites of [imported.invites, renewedInvites]) {
    if (!invites) continue;

    for (const row of rows) {
      const invite = invites.inviteByEmail.get(row.email);
      if (!invite) continue;

      row.inviteId = invite.id;
      const token = invites.tokenByEmail.get(row.email);
      if (token && options.includeInviteLinks) row.inviteLink = buildInviteLink(token, organization);
      if (row.status === 'invite_resent' && invites.unchanged.some((unchanged) => unchanged.id === invite.id)) {
        row.status = 'already_invited';
      }
    }
  }

  captureLearnerInvited({
    profileId: invitedByProfileId,
    orgId,
    target: cohortIds.length > 0 ? 'cohort' : 'org',
    inviteType: 'email',
    count: addedEmails.length + pendingStudentEmails.length,
    cohortId: cohortIds.length === 1 ? cohortIds[0] : undefined,
    source
  });

  return {
    ...buildImportResult(rows, {
      imported: addedEmails.length,
      enrolled:
        assignedToCourses.assigned + assignedToCohorts.assigned + racedEnrolledCourses.assigned + racedEnrolledCohorts.assigned,
      emailsSent:
        assignedToCourses.emailsSent +
        assignedToCohorts.emailsSent +
        racedEnrolledCourses.emailsSent +
        racedEnrolledCohorts.emailsSent +
        imported.emailsSent +
        renewed.emailsSent,
      emailsFailed: imported.emailsFailed + renewed.emailsFailed
    }),
    assigned:
      assignedToCourses.assigned +
      assignedToCohorts.assigned +
      racedEnrolledCourses.assigned +
      racedEnrolledCohorts.assigned,
    alreadyEnrolledInCourses: assignedToCourses.alreadyEnrolled + racedEnrolledCourses.alreadyEnrolled,
    alreadyEnrolledInCohorts: assignedToCohorts.alreadyEnrolled + racedEnrolledCohorts.alreadyEnrolled,
    pendingInvitesRenewed: renewedInvites ? (renewedInvites as TStudentOrgInvites).created.length : 0,
    emailFailures: [...imported.emailFailures, ...renewed.emailFailures],
    truncated: parsed.truncated
  };
}

/** One row per submitted recipient, in order, with the outcome for each. */
function buildImportResult(
  rows: TImportRow[],
  totals: { imported: number; enrolled: number; emailsSent: number; emailsFailed: number }
): AudienceImportResult {
  return {
    ...totals,
    rows: rows.map((row) => ({
      email: row.email,
      name: row.name,
      status: row.status,
      ...(row.inviteId ? { inviteId: row.inviteId } : {}),
      ...(row.inviteLink ? { inviteLink: row.inviteLink } : {}),
      ...(row.enrollment ? { enrollment: row.enrollment } : {})
    }))
  };
}

/**
 * Sends a pending member a fresh link for their live (or expired) student invite, keeping every course and cohort it
 * carries. Renewing an expired invite takes a seat again.
 */
export async function resendAudienceInvite(orgId: string, data: TAudienceInviteByEmail, invitedByProfileId: string) {
  const organization = await getOrganizationById(orgId);
  if (!organization || !organization.siteName) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const member = await getStudentOrganizationMemberByOrgAndEmail(orgId, data.email);
  if (!member) {
    throw new AppError('Audience member not found', ErrorCodes.VALIDATION_ERROR, 404, 'email');
  }
  if (member.profileId) {
    throw new AppError('Member has already joined', ErrorCodes.VALIDATION_ERROR, 400, 'email');
  }

  const emailToUse = member.email.toLowerCase().trim();
  const inviteInput: StudentOrgInviteInput = {
    orgId,
    organization,
    emails: [emailToUse],
    courseIds: [],
    cohortIds: [],
    invitedByProfileId,
    shouldSendEmail: true,
    reissue: 'always',
    source: 'AUDIENCE_RESEND'
  };

  let studentMilestoneNotification: StudentMilestoneNotification | null = null;
  const invites = await db.transaction(async (tx) => {
    const needsSeat = await hasLapsedStudentInvite(orgId, member.id, tx);
    if (needsSeat) {
      studentMilestoneNotification = await assertStudentCapacityOrThrow(orgId, 1, tx, { deferNotification: true });
    }

    return createStudentOrgInvites(inviteInput, tx);
  });

  if (!invites?.tokenByEmail.has(emailToUse)) {
    throw new AppError('Audience member cannot receive a student invite', ErrorCodes.VALIDATION_ERROR, 400, 'email');
  }

  if (studentMilestoneNotification) {
    notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  const sent = await sendStudentOrgInvites(inviteInput, invites);

  return { emailSent: sent.emailsSent > 0 };
}

export type TRevokeInviteAccessInput = { email: string; courseId?: string; cohortId?: string };

/**
 * Removes one course or cohort from a pending member's student invite and keeps the rest. The invite is replaced
 * without an email (the old link resolves to the replacement), or revoked outright when nothing is left on it.
 */
export async function revokeAudienceInviteAccess(
  orgId: string,
  data: TRevokeInviteAccessInput,
  revokedByProfileId: string
): Promise<{ revoked: boolean; inviteRevoked: boolean; inviteId: string | null }> {
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const member = await getStudentOrganizationMemberByOrgAndEmail(orgId, data.email);
  if (!member) {
    throw new AppError('Audience member not found', ErrorCodes.VALIDATION_ERROR, 404, 'email');
  }
  if (member.profileId) {
    throw new AppError('Member has already joined', ErrorCodes.VALIDATION_ERROR, 400, 'email');
  }

  const emailToUse = member.email.toLowerCase().trim();
  const field = data.courseId ? 'courseId' : 'cohortId';
  const live = await listLiveStudentOrgInvitesForEmail(orgId, emailToUse);
  const covering = live.filter((invite) =>
    data.courseId
      ? parseCourseIdsFromInviteMetadata(invite.metadata).includes(data.courseId)
      : !!data.cohortId && parseCohortIdsFromInviteMetadata(invite.metadata).includes(data.cohortId)
  );
  if (covering.length === 0) {
    throw new AppError('No live invitation covers this access', ErrorCodes.VALIDATION_ERROR, 404, field);
  }

  const superseded = await db.transaction(async (tx) =>
    supersedeStudentOrgInvites(tx, {
      orgId,
      emails: [emailToUse],
      removeCourseIds: data.courseId ? [data.courseId] : [],
      removeCohortIds: data.cohortId ? [data.cohortId] : [],
      invitedByProfileId: revokedByProfileId,
      source: data.courseId ? 'AUDIENCE_REVOKE_COURSE' : 'AUDIENCE_REVOKE_COHORT'
    })
  );

  const successor = superseded.created[0] ?? null;
  const revokedAccess = data.courseId ? { revokedCourseId: data.courseId } : { revokedCohortId: data.cohortId };
  await recordOrganizationInviteAudits(
    superseded.revoked.map((invite) => ({
      inviteId: invite.id,
      organizationId: orgId,
      eventType: 'REVOKED' as const,
      actorProfileId: revokedByProfileId,
      targetEmail: emailToUse,
      ipAddress: null,
      userAgent: null,
      metadata: successor
        ? { reason: 'superseded', supersededBy: successor.id, ...revokedAccess }
        : { reason: 'revoked_for_access', ...revokedAccess }
    }))
  );

  await sendStudentOrgInvites(
    {
      orgId,
      organization,
      emails: [emailToUse],
      courseIds: [],
      cohortIds: [],
      invitedByProfileId: revokedByProfileId,
      shouldSendEmail: false
    },
    superseded
  );

  return {
    revoked: superseded.revoked.length > 0,
    inviteRevoked: !successor,
    inviteId: successor?.id ?? null
  };
}

export async function revokeAudiencePendingInvite(
  orgId: string,
  data: TAudienceInviteByEmail,
  revokedByProfileId: string
) {
  const member = await getStudentOrganizationMemberByOrgAndEmail(orgId, data.email);
  if (!member) {
    throw new AppError('Audience member not found', ErrorCodes.VALIDATION_ERROR, 404, 'email');
  }
  if (member.profileId) {
    throw new AppError('Member has already joined', ErrorCodes.VALIDATION_ERROR, 400, 'email');
  }

  const emailToUse = member.email.toLowerCase().trim();

  const hasActive = await hasActiveOrganizationInviteForEmail(orgId, emailToUse);
  if (!hasActive) {
    throw new AppError('No active pending invite to revoke', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const revoked = await revokeActiveOrganizationInvitesByEmails(orgId, [emailToUse], revokedByProfileId);
  if (revoked.length === 0) {
    throw new AppError('No invite was revoked', ErrorCodes.VALIDATION_ERROR, 400);
  }

  await recordOrganizationInviteAudits(
    revoked.map((inv) => ({
      inviteId: inv.id,
      organizationId: orgId,
      eventType: 'REVOKED' as const,
      actorProfileId: revokedByProfileId,
      targetEmail: emailToUse,
      ipAddress: null,
      userAgent: null,
      metadata: { reason: 'audience_revoked_by_admin' }
    }))
  );

  return { revoked: true };
}

export type TAudienceEnrollmentOutcome = {
  profileId: string;
  status: Extract<TAssignAudienceCourseDetail['status'], 'enrolled' | 'already_enrolled'>;
};

export type TAudienceEnrollResult = {
  assigned: number;
  alreadyEnrolled: number;
  emailsSent: number;
  outcomes: TAudienceEnrollmentOutcome[];
};

export type TAssignAudienceCourseDetail = {
  profileId?: string | null;
  memberId?: number | null;
  email?: string | null;
  status: 'enrolled' | 'already_enrolled' | 'invited' | 'is_staff' | 'archived' | 'over_seat_limit' | 'not_found';
};

export async function assignAudienceToCourses(
  orgId: string,
  data: TAssignAudienceCourses,
  source: TEventSource = 'dashboard',
  actorProfileId: string | null = null
) {
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const courseIds = data.courseIds ?? [];
  const cohortIds = data.cohortIds ?? [];

  const { joinedProfileIds, pendingEmails, details } = await resolveAssignAudienceLearners(orgId, data);

  let assignedToCourses: TAudienceEnrollResult = { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, outcomes: [] };
  let assignedToCohorts: TAudienceEnrollResult = { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, outcomes: [] };

  if (courseIds.length > 0) {
    const courseGroups = await getOrgCourseGroups(orgId, courseIds);
    if (courseGroups.length === 0) {
      throw new AppError('No valid courses found', ErrorCodes.VALIDATION_ERROR, 400, 'courseIds');
    }

    assignedToCourses = await enrollAudienceStudentProfilesInCourses(
      orgId,
      organization,
      joinedProfileIds,
      courseIds,
      data.sendEmail,
      source
    );
  }

  if (cohortIds.length > 0) {
    const cohorts = await getCohortsByOrg(orgId, cohortIds);
    if (cohorts.length === 0) {
      throw new AppError('No valid cohorts found', ErrorCodes.VALIDATION_ERROR, 400, 'cohortIds');
    }

    assignedToCohorts = await enrollAudienceStudentProfilesInCohorts(
      organization,
      orgId,
      joinedProfileIds,
      cohortIds,
      data.sendEmail,
      source,
      actorProfileId
    );
  }

  for (const outcome of [...assignedToCourses.outcomes, ...assignedToCohorts.outcomes]) {
    const existing = details.find((detail) => detail.profileId === outcome.profileId);
    if (existing) {
      if (outcome.status === 'enrolled') existing.status = 'enrolled';
    } else {
      details.push({ profileId: outcome.profileId, status: outcome.status });
    }
  }

  const invited = await invitePendingAssignAudienceLearners(
    orgId,
    organization,
    pendingEmails,
    courseIds,
    cohortIds,
    data.sendEmail,
    actorProfileId
  );

  for (const email of invited.invitedEmails) {
    details.push({ email, status: 'invited' });
  }

  for (const skipped of invited.skippedEmails) {
    details.push({ email: skipped, status: 'over_seat_limit' });
  }

  return {
    assigned: assignedToCourses.assigned + assignedToCohorts.assigned,
    alreadyEnrolled: assignedToCourses.alreadyEnrolled + assignedToCohorts.alreadyEnrolled,
    invited: invited.invited,
    emailsSent: assignedToCourses.emailsSent + assignedToCohorts.emailsSent + invited.emailsSent,
    details
  };
}

/**
 * Splits an assign-courses request into joined profiles (enrol directly) and
 * pending emails (merge into their org invite). Profile ids, member ids and emails all go through the same
 * classification: staff rows report `is_staff`, archived rows report `archived`, and unknown ids/emails report
 * `not_found`.
 */
async function resolveAssignAudienceLearners(
  orgId: string,
  data: TAssignAudienceCourses
): Promise<{
  joinedProfileIds: string[];
  pendingEmails: { email: string; hasLapsedInvite: boolean }[];
  details: TAssignAudienceCourseDetail[];
}> {
  const joinedProfileIds: string[] = [];
  const pendingEmails: { email: string; hasLapsedInvite: boolean }[] = [];
  const details: TAssignAudienceCourseDetail[] = [];
  const seenProfiles = new Set<string>();
  const seenEmails = new Set<string>();

  const addJoined = (profileId: string) => {
    if (seenProfiles.has(profileId)) return;
    seenProfiles.add(profileId);
    joinedProfileIds.push(profileId);
  };

  const requestedEmails = [...new Set((data.emails ?? []).map((email) => email.trim().toLowerCase()).filter(Boolean))];
  const emailMembers =
    requestedEmails.length > 0 ? await getOrganizationMembersByNormalizedEmails(orgId, requestedEmails) : [];
  const emailMemberByEmail = new Map(emailMembers.map((m) => [m.normalizedEmail, m]));

  const requestedMemberIds = [...new Set(data.memberIds ?? [])];
  const memberRows = requestedMemberIds.length > 0 ? await getBulkAudienceMembersByIds(orgId, requestedMemberIds) : [];
  const memberRowById = new Map(memberRows.map((row) => [row.id, row]));
  const memberEmails = [...new Set(memberRows.map((row) => (row.email ?? '').trim().toLowerCase()).filter(Boolean))];
  const memberEmailMembers =
    memberEmails.length > 0 ? await getOrganizationMembersByNormalizedEmails(orgId, memberEmails) : [];
  const memberEmailMemberByEmail = new Map(memberEmailMembers.map((m) => [m.normalizedEmail, m]));

  const requestedProfileIds = [...new Set(data.profileIds ?? [])];
  const profileMembers =
    requestedProfileIds.length > 0 ? await getOrganizationMembersByProfileIds(orgId, requestedProfileIds) : [];
  const profileMemberById = new Map(profileMembers.map((member) => [member.profileId, member]));

  for (const profileId of requestedProfileIds) {
    const member = profileMemberById.get(profileId);
    if (!member) {
      details.push({ profileId, status: 'not_found' });
      continue;
    }

    classifyAssignAudienceMember(member, {}, addJoined, pendingEmails, seenEmails, details);
  }

  for (const memberId of requestedMemberIds) {
    const row = memberRowById.get(memberId);
    if (!row?.email) {
      details.push({ memberId, status: 'not_found' });
      continue;
    }

    const member = memberEmailMemberByEmail.get(row.email.trim().toLowerCase());
    if (!member) {
      details.push({ memberId, email: row.email, status: 'not_found' });
      continue;
    }

    classifyAssignAudienceMember(member, { memberId }, addJoined, pendingEmails, seenEmails, details);
  }

  for (const email of requestedEmails) {
    const member = emailMemberByEmail.get(email);
    if (!member) {
      details.push({ email, status: 'not_found' });
      continue;
    }

    classifyAssignAudienceMember(member, { email }, addJoined, pendingEmails, seenEmails, details);
  }

  return { joinedProfileIds, pendingEmails, details };
}

function classifyAssignAudienceMember(
  member: {
    normalizedEmail: string;
    profileId: string | null;
    roleId: number;
    status: string;
    hasLapsedInvite: boolean;
  },
  identity: { memberId?: number; email?: string },
  addJoined: (profileId: string) => void,
  pendingEmails: { email: string; hasLapsedInvite: boolean }[],
  seenEmails: Set<string>,
  details: TAssignAudienceCourseDetail[]
): void {
  if (member.roleId !== ROLE.STUDENT) {
    details.push({ profileId: member.profileId, ...identity, email: member.normalizedEmail, status: 'is_staff' });
    return;
  }

  if (member.status === 'ARCHIVED') {
    details.push({ profileId: member.profileId, ...identity, email: member.normalizedEmail, status: 'archived' });
    return;
  }

  if (member.profileId) {
    addJoined(member.profileId);
    return;
  }

  if (seenEmails.has(member.normalizedEmail)) return;
  seenEmails.add(member.normalizedEmail);
  pendingEmails.push({ email: member.normalizedEmail, hasLapsedInvite: member.hasLapsedInvite });
}

/**
 * Merges courses/cohorts into each pending learner's org invitation,
 * taking a seat for lapsed invites and reporting the rest per row.
 */
async function invitePendingAssignAudienceLearners(
  orgId: string,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>,
  pendingEmails: { email: string; hasLapsedInvite: boolean }[],
  courseIds: string[],
  cohortIds: string[],
  shouldSendEmail: boolean,
  actorProfileId: string | null
): Promise<{ invited: number; emailsSent: number; invitedEmails: string[]; skippedEmails: string[] }> {
  if (pendingEmails.length === 0) {
    return { invited: 0, emailsSent: 0, invitedEmails: [], skippedEmails: [] };
  }

  if (!actorProfileId) {
    throw new AppError('Pending members can only be assigned by a signed-in inviter', ErrorCodes.VALIDATION_ERROR, 400);
  }

  let seatsLeft = await getRemainingStudentSeats(orgId);
  const takers: typeof pendingEmails = [];
  const skipped: typeof pendingEmails = [];
  for (const pending of pendingEmails) {
    if (pending.hasLapsedInvite) {
      if (seatsLeft <= 0) {
        skipped.push(pending);
        continue;
      }
      seatsLeft -= 1;
    }
    takers.push(pending);
  }

  let studentMilestoneNotification: StudentMilestoneNotification | null = null;
  const created = await db.transaction(async (tx) => {
    const lapsedCount = takers.filter((taker) => taker.hasLapsedInvite).length;
    if (lapsedCount > 0) {
      studentMilestoneNotification = await assertStudentCapacityOrThrow(orgId, lapsedCount, tx, {
        deferNotification: true
      });
    }

    return createStudentOrgInvites(
      {
        orgId,
        emails: takers.map((taker) => taker.email),
        courseIds,
        cohortIds,
        invitedByProfileId: actorProfileId
      },
      tx
    );
  });

  if (studentMilestoneNotification) {
    notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  if (!created) {
    return { invited: 0, emailsSent: 0, invitedEmails: [], skippedEmails: skipped.map((row) => row.email) };
  }

  const sent = await sendStudentOrgInvites(
    {
      orgId,
      organization,
      emails: takers.map((taker) => taker.email),
      courseIds,
      cohortIds,
      invitedByProfileId: actorProfileId,
      shouldSendEmail
    },
    created
  );

  return {
    invited: created.inviteByEmail.size,
    emailsSent: sent.emailsSent,
    invitedEmails: [...created.inviteByEmail.keys()],
    skippedEmails: skipped.map((row) => row.email)
  };
}

export async function updatePendingAudienceMemberEmail(
  orgId: string,
  memberId: number,
  data: { email: string; sendEmail: boolean },
  invitedByProfileId: string
) {
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const existingMember = await getOrganizationAudienceMember(orgId, memberId);
  if (!existingMember) {
    throw new AppError('Audience member not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (existingMember.profileId) {
    throw new AppError(
      'Only pending audience members can be updated through this endpoint',
      ErrorCodes.VALIDATION_ERROR,
      400,
      'memberId'
    );
  }

  const normalizedEmail = data.email.toLowerCase().trim();
  const currentEmail = existingMember.email.toLowerCase().trim();

  if (!normalizedEmail) {
    throw new AppError('Email is required', ErrorCodes.VALIDATION_ERROR, 400, 'email');
  }

  if (normalizedEmail !== currentEmail) {
    const matchingMembers = await getOrganizationMembersByNormalizedEmails(orgId, [normalizedEmail]);

    if (matchingMembers.length > 0) {
      throw new AppError('An audience member with this email already exists', ErrorCodes.CONFLICT, 409, 'email');
    }
  }

  const previousInvite = await getLatestOrganizationInviteRowByOrgAndEmail(orgId, currentEmail);
  const carriedInvite = previousInvite && !previousInvite.isRevoked ? previousInvite : null;

  let studentMilestoneNotification: StudentMilestoneNotification | null = null;

  let updatedMember;
  try {
    updatedMember = await db.transaction(async (tx) => {
      if (await hasLapsedStudentInvite(orgId, memberId, tx)) {
        studentMilestoneNotification = await assertStudentCapacityOrThrow(orgId, 1, tx, { deferNotification: true });
      }

      await revokeActiveOrganizationInvitesByEmails(orgId, [currentEmail, normalizedEmail], invitedByProfileId, tx);

      const updated = await updateOrganizationAudienceMember(
        orgId,
        memberId,
        { email: normalizedEmail, verified: false },
        tx
      );

      if (!updated) {
        throw new AppError('Audience member not found', ErrorCodes.NOT_FOUND, 404);
      }

      return updated;
    });
  } catch (error) {
    const conflict = membershipConflictError(error);
    if (conflict) throw conflict;
    throw error;
  }

  const fullnamesByEmail = new Map<string, string>();
  const previousFullname = parseFullnameFromInviteMetadata(previousInvite?.metadata);
  if (previousFullname) fullnamesByEmail.set(normalizedEmail, previousFullname);

  await createStudentOrgInvitesAndSendEmails({
    orgId,
    organization,
    emails: [normalizedEmail],
    courseIds: parseCourseIdsFromInviteMetadata(carriedInvite?.metadata),
    cohortIds: parseCohortIdsFromInviteMetadata(carriedInvite?.metadata),
    invitedByProfileId,
    shouldSendEmail: data.sendEmail,
    fullnamesByEmail
  });

  if (studentMilestoneNotification) {
    notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  return updatedMember;
}
