import { emitCohortMemberWebhookEvent, emitOrganizationMemberWebhookEvent } from '@cio/core/services/webhook/emit';
import { AppError, ErrorCodes } from '@api/utils/errors';
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
import { addGroupMembers, enrollUsersInCourseGroups, getExistingGroupMembers } from '@cio/db/queries/group';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { buildEmailFromName, buildEmailBranding } from '@cio/email';
import { enqueueTransactionalEmail, enqueueTransactionalEmails, type EnqueueOutcome } from '@api/services/jobs';
import {
  addCohortMembers,
  getCohortsByOrg,
  getCourseIdsByCohortIds,
  getExistingCohortMembers
} from '@cio/db/queries/cohort';
import {
  createOrganizationInvite,
  createOrganizationInviteAudits,
  createOrganizationInvites,
  createOrganizationMembers,
  getOrganizationAudienceMember,
  getLatestOrganizationInviteRowByOrgAndEmail,
  getOrgMembersByProfileIds,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  getStudentOrganizationMemberByOrgAndEmail,
  hasActiveOrganizationInviteForEmail,
  hasLapsedStudentInvite,
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import { emitOrganizationInviteAuditWebhooks, recordOrganizationInviteAudits } from './invite';
import { getCourseGroupIds, getOrgCourseGroups, getOrgCourses } from '@cio/db/queries/course';
import { updateOrganizationAudienceMember } from '@cio/db/queries/organization';

import { ROLE } from '@cio/utils/constants';
import crypto from 'node:crypto';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { assertStudentCapacityOrThrow, getRemainingStudentSeats, notifyStudentMilestone } from './student-limit';
import type { StudentMilestoneNotification } from './student-limit';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getProfilesByEmails } from '@cio/db/queries/auth';
import { emitComplianceEnrollmentEvents, ensureComplianceEnrollmentRecordsForProfiles } from '../course/compliance';
import { getWelcomeSessionIcs } from '../course/session-invite';
import type { TEventSource } from '@cio/core/services/posthog';
import { captureLearnerInvited, captureLearnersEnrolled } from '@api/services/product-events';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
function countEnqueuedEmails(outcomes: EnqueueOutcome[], recipients: string[], caller: string): number {
  let sent = 0;

  outcomes.forEach((outcome, index) => {
    if (outcome.ok) {
      sent++;
      return;
    }

    console.error(`${caller} enqueue error for ${recipients[index]}:`, outcome.error);
  });

  return sent;
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

async function resolveCohortsForImport(orgId: string, data: TImportAudienceMembers) {
  if (data.allCohorts) {
    return getCohortsByOrg(orgId);
  }

  if (data.cohortIds && data.cohortIds.length > 0) {
    return getCohortsByOrg(orgId, data.cohortIds);
  }

  return [];
}

type TAudienceOrganization = NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>;
type TAudienceCourseGroup = Awaited<ReturnType<typeof getOrgCourseGroups>>[number];
type TAudienceCohort = Awaited<ReturnType<typeof getCohortsByOrg>>[number];
type TCohortCourses = { courseIds: string[]; groupIds: string[] };

type TAudienceEnrolment = {
  orgId: string;
  organization: TAudienceOrganization;
  shouldSendEmail: boolean;
  source: TEventSource;
  actorProfileId: string | null;
};

/** Profile id → org member email, for the given profiles that are students of the org. */
async function getStudentEmailsByProfileId(
  orgId: string,
  profileIds: string[],
  dbClient: DbOrTxClient = db
): Promise<Map<string, string>> {
  if (profileIds.length === 0) return new Map();

  const members = await getOrgMembersByProfileIds(orgId, [...new Set(profileIds)], dbClient);

  return new Map(
    members
      .filter((member) => member.profileId && member.roleId === ROLE.STUDENT)
      .map((member) => [member.profileId!, member.email ?? ''])
  );
}

/** Looks up the courses linked to the cohorts on first use and reuses the answer after that. */
function lazyCohortCourses(cohortIds: string[], dbClient: DbOrTxClient = db): () => Promise<TCohortCourses> {
  let cohortCourses: Promise<TCohortCourses> | undefined;

  return () =>
    (cohortCourses ??= (async () => {
      const courseIds = await getCourseIdsByCohortIds(cohortIds, dbClient);
      const courseGroups = courseIds.length > 0 ? await getCourseGroupIds(courseIds, dbClient) : [];

      return {
        courseIds,
        groupIds: courseGroups.map((mapping) => mapping.groupId).filter(Boolean) as string[]
      };
    })());
}

type TAudienceEnrolmentResult = { assigned: number; alreadyEnrolled: number; emailsSent: number };
type TInviteResult = { created: number; emailsSent: number; emailsFailed: number };

/** Side effects (webhooks, emails, cache invalidation, analytics) queued inside a transaction and run once it commits. */
type TAfterCommit = Array<() => unknown>;

async function runAfterCommit(effects: TAfterCommit) {
  for (const effect of effects) {
    try {
      await effect();
    } catch (error) {
      console.error('audience after-commit effect error:', error);
    }
  }
}

/**
 * Writes the group memberships and compliance records in `tx`. Welcome emails, webhooks and stats invalidation go on
 * `afterCommit`; the returned `emailsSent` is filled in when those run.
 */
async function enrollAudienceStudentProfilesInCourses(
  enrolment: TAudienceEnrolment,
  profileEmailMap: Map<string, string>,
  profileIds: string[],
  courseGroups: TAudienceCourseGroup[],
  tx: DbOrTxClient,
  afterCommit: TAfterCommit
): Promise<TAudienceEnrolmentResult> {
  const { orgId, organization, shouldSendEmail, source } = enrolment;
  const result: TAudienceEnrolmentResult = { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };

  if (courseGroups.length === 0 || profileIds.length === 0) {
    return result;
  }

  const validGroupIds = courseGroups.map((cg) => cg.groupId).filter(Boolean) as string[];
  const courseTitleByGroupId = new Map(courseGroups.map((cg) => [cg.groupId, cg.courseTitle]));
  const welcomeMessageByGroupId = new Map(courseGroups.map((cg) => [cg.groupId, cg.welcomeEmailMessage]));
  const validProfiles = [...new Set(profileIds)].filter((id) => profileEmailMap.has(id));

  const pairs = validProfiles.flatMap((profileId) => validGroupIds.map((groupId) => ({ groupId, profileId })));
  const existingSet = await getExistingGroupMembers(pairs, tx);
  const toInsert = pairs.filter((p) => !existingSet.has(`${p.groupId}:${p.profileId}`));

  result.assigned = toInsert.length;
  result.alreadyEnrolled = pairs.length - toInsert.length;

  if (toInsert.length > 0) {
    const enrolledMembers = await addGroupMembers(
      toInsert.map((p) => ({
        groupId: p.groupId,
        roleId: ROLE.STUDENT,
        profileId: p.profileId,
        email: profileEmailMap.get(p.profileId) || undefined
      })),
      tx
    );

    afterCommit.push(
      () => invalidateOrgStats(orgId),
      () => captureLearnersEnrolled(enrolledMembers, 'audience', source)
    );
  }

  if (validProfiles.length > 0) {
    const { createdRecords } = await ensureComplianceEnrollmentRecordsForProfiles(
      courseGroups.map((courseGroup) => courseGroup.courseId),
      validProfiles,
      tx
    );

    afterCommit.push(() => emitComplianceEnrollmentEvents(createdRecords));
  }

  if (shouldSendEmail && toInsert.length > 0) {
    afterCommit.push(async () => {
      const loginUrl = getDashboardBaseUrl(organization);
      const icsByGroupId = new Map(
        await Promise.all(
          courseGroups.map(async (cg) => [cg.groupId, await getWelcomeSessionIcs(cg.courseId)] as const)
        )
      );

      const recipients = toInsert.filter((p) => profileEmailMap.get(p.profileId));
      const branding = buildEmailBranding(organization);
      const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);
      const outcomes = await enqueueTransactionalEmails(
        'studentCourseWelcome',
        recipients.map((p) => ({
          to: profileEmailMap.get(p.profileId)!,
          fields: {
            orgName: organization.name,
            courseName: courseTitleByGroupId.get(p.groupId) || 'Course',
            loginUrl,
            customMessage: welcomeMessageByGroupId.get(p.groupId) ?? undefined,
            branding
          },
          from,
          idempotencyKey: `audience-course-welcome:${p.groupId}:${p.profileId}`,
          ics: icsByGroupId.get(p.groupId),
          preference: { organizationId: orgId, recipientProfileId: p.profileId }
        }))
      );

      result.emailsSent = countEnqueuedEmails(
        outcomes,
        recipients.map((p) => profileEmailMap.get(p.profileId)!),
        'enrollAudienceStudentProfilesInCourses'
      );
    });
  }

  return result;
}

/** Same contract as `enrollAudienceStudentProfilesInCourses`, for cohorts and the courses linked to them. */
async function enrollAudienceStudentProfilesInCohorts(
  enrolment: TAudienceEnrolment,
  profileEmailMap: Map<string, string>,
  profileIds: string[],
  cohorts: TAudienceCohort[],
  getCohortCourses: () => Promise<TCohortCourses>,
  tx: DbOrTxClient,
  afterCommit: TAfterCommit
): Promise<TAudienceEnrolmentResult> {
  const { orgId, organization, shouldSendEmail, source, actorProfileId } = enrolment;
  const result: TAudienceEnrolmentResult = { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };

  if (cohorts.length === 0 || profileIds.length === 0) {
    return result;
  }

  const cohortNameById = new Map(cohorts.map((cohort) => [cohort.id, cohort.name || 'Cohort']));
  const validCohortIds = cohorts.map((cohort) => cohort.id);
  const validProfiles = [...new Set(profileIds)].filter((profileId) => profileEmailMap.has(profileId));
  const pairs = validProfiles.flatMap((profileId) => validCohortIds.map((cohortId) => ({ cohortId, profileId })));
  const existingSet = await getExistingCohortMembers(pairs, tx);
  const toInsert = pairs.filter((pair) => !existingSet.has(`${pair.cohortId}:${pair.profileId}`));

  const addedCohortMembers =
    toInsert.length > 0
      ? await addCohortMembers(
          toInsert.map((pair) => ({
            cohortId: pair.cohortId,
            roleId: ROLE.STUDENT,
            profileId: pair.profileId,
            email: profileEmailMap.get(pair.profileId) || undefined
          })),
          tx
        )
      : [];
  const addedPairs = addedCohortMembers.flatMap(({ cohortId, profileId }) =>
    cohortId && profileId ? [{ cohortId, profileId }] : []
  );

  result.assigned = addedPairs.length;
  result.alreadyEnrolled = pairs.length - addedPairs.length;

  if (addedCohortMembers.length > 0) {
    afterCommit.push(async () => {
      for (const cohortMember of addedCohortMembers) {
        await emitCohortMemberWebhookEvent(
          'cohort.member.added',
          orgId,
          cohortMember.cohortId,
          cohortMember,
          actorProfileId
        );
      }
    });
  }

  // Enrols every assigned profile, not only new memberships, so re-running repairs
  // members added before cohort course enrolment existed.
  const cohortCourses = validProfiles.length > 0 ? await getCohortCourses() : { courseIds: [], groupIds: [] };

  if (cohortCourses.courseIds.length > 0) {
    const users = validProfiles.map((profileId) => ({
      profileId,
      email: profileEmailMap.get(profileId) || undefined
    }));
    const enrolledMembers = await enrollUsersInCourseGroups(cohortCourses.groupIds, users, ROLE.STUDENT, tx);

    if (enrolledMembers.length > 0) {
      afterCommit.push(
        () => invalidateOrgStats(orgId),
        () => captureLearnersEnrolled(enrolledMembers, 'cohort', source)
      );
    }

    const { createdRecords } = await ensureComplianceEnrollmentRecordsForProfiles(
      cohortCourses.courseIds,
      validProfiles,
      tx
    );

    afterCommit.push(() => emitComplianceEnrollmentEvents(createdRecords));
  }

  if (shouldSendEmail && addedPairs.length > 0) {
    afterCommit.push(async () => {
      const loginUrl = getDashboardBaseUrl(organization);
      const recipients = addedPairs.filter((pair) => profileEmailMap.get(pair.profileId));
      const branding = buildEmailBranding(organization);
      const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);
      const outcomes = await enqueueTransactionalEmails(
        'studentCohortWelcome',
        recipients.map((pair) => ({
          to: profileEmailMap.get(pair.profileId)!,
          fields: {
            orgName: organization.name,
            cohortName: cohortNameById.get(pair.cohortId) || 'Cohort',
            loginUrl,
            branding
          },
          from,
          idempotencyKey: `audience-cohort-welcome:${pair.cohortId}:${pair.profileId}`,
          preference: { organizationId: orgId, recipientProfileId: pair.profileId }
        }))
      );

      result.emailsSent = countEnqueuedEmails(
        outcomes,
        recipients.map((pair) => profileEmailMap.get(pair.profileId)!),
        'enrollAudienceStudentProfilesInCohorts'
      );
    });
  }

  return result;
}

/**
 * Revokes earlier invites and writes the new invites with their CREATED audits in `tx`. The audit webhooks, the
 * invite emails and their EMAIL_SENT / EMAIL_FAILED audits go on `afterCommit`.
 */
async function createStudentOrgInvitesAndSendEmails(
  input: {
    orgId: string;
    organization: TAudienceOrganization;
    emails: string[];
    courseIds: string[];
    cohortIds: string[];
    accessNamesLabel: string | undefined;
    invitedByProfileId: string;
    shouldSendEmail: boolean;
  },
  tx: DbOrTxClient,
  afterCommit: TAfterCommit
): Promise<TInviteResult> {
  const { orgId, organization, emails, courseIds, cohortIds, accessNamesLabel, invitedByProfileId, shouldSendEmail } =
    input;
  const result: TInviteResult = { created: emails.length, emailsSent: 0, emailsFailed: 0 };

  if (emails.length === 0) {
    return result;
  }

  await revokeActiveOrganizationInvitesByEmails(orgId, emails, invitedByProfileId, tx);

  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();

  const inviteInputs = emails.map((email) => {
    const token = generateToken();
    return {
      email,
      token,
      row: {
        organizationId: orgId,
        roleId: ROLE.STUDENT,
        email,
        tokenHash: hashToken(token),
        createdByProfileId: invitedByProfileId,
        expiresAt,
        isRevoked: false,
        metadata: {
          source: 'AUDIENCE_IMPORT',
          courseIds: courseIds.length > 0 ? courseIds : undefined,
          cohortIds: cohortIds.length > 0 ? cohortIds : undefined
        }
      }
    };
  });

  const invites = await createOrganizationInvites(
    inviteInputs.map((i) => i.row),
    tx
  );
  const inviteByEmail = new Map(invites.map((inv) => [(inv.email ?? '').toLowerCase(), inv]));
  const tokenByEmail = new Map(inviteInputs.map((i) => [i.email.toLowerCase(), i.token]));

  const createdAudits = emails.map((email) => ({
    inviteId: inviteByEmail.get(email)!.id,
    organizationId: orgId,
    eventType: 'CREATED' as const,
    actorProfileId: invitedByProfileId,
    targetEmail: email,
    ipAddress: null,
    userAgent: null,
    metadata: {
      roleId: ROLE.STUDENT,
      roleName: 'Student',
      expiresAt,
      courseIds,
      cohortIds
    }
  }));

  await createOrganizationInviteAudits(createdAudits, tx);
  afterCommit.push(() => emitOrganizationInviteAuditWebhooks(createdAudits));

  if (shouldSendEmail) {
    afterCommit.push(async () => {
      const branding = buildEmailBranding(organization);
      const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);
      const expiresAtLabel = getExpiryLabel(expiresAt);
      const enqueueOutcomes = await enqueueTransactionalEmails(
        'studentOrgInvite',
        emails.map((email) => {
          const inviteLink = buildInviteLink(tokenByEmail.get(email)!, organization);
          const inviteId = inviteByEmail.get(email)!.id;

          return {
            to: email,
            fields: {
              email,
              orgName: organization.name,
              inviteLink,
              expiresAt: expiresAtLabel,
              courseNames: accessNamesLabel,
              branding
            },
            from,
            organizationId: orgId,
            idempotencyKey: `student-org-invite:${inviteId}`
          };
        })
      );

      // Optimistic — see comment in services/organization/invite.ts.
      const emailOutcomes = enqueueOutcomes.map((outcome, index) => ({
        inviteId: inviteByEmail.get(emails[index])!.id,
        email: emails[index],
        success: outcome.ok,
        error: outcome.ok ? undefined : outcome.error.message
      }));

      result.emailsSent = emailOutcomes.filter((o) => o.success).length;
      result.emailsFailed = emailOutcomes.length - result.emailsSent;

      await recordOrganizationInviteAudits(
        emailOutcomes.map((o) => ({
          inviteId: o.inviteId,
          organizationId: orgId,
          eventType: o.success ? ('EMAIL_SENT' as const) : ('EMAIL_FAILED' as const),
          actorProfileId: invitedByProfileId,
          targetEmail: o.email,
          ipAddress: null,
          userAgent: null,
          metadata: o.success ? {} : { error: o.error ?? 'Unknown' }
        }))
      );
    });
  }

  return result;
}

export async function importAudienceMembers(
  orgId: string,
  data: TImportAudienceMembers,
  invitedByProfileId: string,
  source: TEventSource = 'dashboard'
) {
  const organization = await getOrganizationById(orgId);
  if (!organization || !organization.siteName) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  // Structured rows when the client parsed a file; otherwise parse the pasted
  // list here so both paths classify identically.
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

  // Re-check duplicates across the whole set: the client may have sent
  // structured rows without deduplicating them.
  const seenEmails = new Set<string>();
  const rows: (ParsedImportRow & { status: TAudienceImportRowStatus })[] = parsed.rows.map((row) => {
    if (row.status !== 'ready') return row;
    if (seenEmails.has(row.email)) return { ...row, status: 'duplicate_in_file' as const };

    seenEmails.add(row.email);
    return row;
  });

  const candidateEmails = rows.filter((row) => row.status === 'ready').map((row) => row.email);

  if (candidateEmails.length === 0) {
    // Nothing importable at all is still a successful call with per-row
    // reasons, so the UI can show which rows failed and why.
    return {
      ...buildImportResult(rows, { imported: 0, enrolled: 0, emailsSent: 0, emailsFailed: 0 }),
      assigned: 0,
      alreadyEnrolledInCourses: 0,
      alreadyEnrolledInCohorts: 0,
      pendingInvitesRenewed: 0,
      truncated: parsed.truncated
    };
  }

  const memberRows = await getOrganizationMembersByNormalizedEmails(orgId, candidateEmails);
  const memberByEmail = new Map(memberRows.map((m) => [m.normalizedEmail, m]));

  const newEmails: string[] = [];
  const existingStudentProfileIds: string[] = [];
  const pendingStudentEmails: string[] = [];

  // Import what the plan allows and report the overflow, rather than refusing
  // the whole file when it does not fit.
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

    // Staff addresses are reported per row rather than rejecting the file: an
    // admin's own address pasted into a 900-row list should not block it.
    if (m.roleId !== ROLE.STUDENT) {
      row.status = 'is_staff';
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

  const { courseIds, courseNames } = await resolveCourseIdsAndNamesForImport(orgId, data);
  const cohorts = await resolveCohortsForImport(orgId, data);
  const cohortIds = cohorts.map((cohort) => cohort.id);
  const accessNames = [...courseNames, ...cohorts.map((cohort) => cohort.name).filter(Boolean)];
  const accessNamesLabel = accessNames.length > 0 ? accessNames.join(', ') : undefined;

  const courseGroups = courseIds.length > 0 ? await getOrgCourseGroups(orgId, courseIds) : [];
  const enrolment: TAudienceEnrolment = {
    orgId,
    organization,
    shouldSendEmail: data.sendEmail,
    source,
    actorProfileId: invitedByProfileId
  };
  const inviteInput = { orgId, organization, courseIds, cohortIds, accessNamesLabel, invitedByProfileId };
  const afterCommit: TAfterCommit = [];

  const { assignedToCourses, assignedToCohorts, importInvites, pendingInvites } = await db.transaction(async (tx) => {
    const getCohortCourses = lazyCohortCourses(cohortIds, tx);
    let addedEmails: string[] = [];

    // New members and renewed lapsed invites take seats; both are saved in this transaction, under the seat lock.
    const seatsNeeded = newEmails.length + renewedSeats;
    const studentMilestoneNotification =
      seatsNeeded > 0 ? await assertStudentCapacityOrThrow(orgId, seatsNeeded, tx, { deferNotification: true }) : null;

    if (studentMilestoneNotification) {
      afterCommit.push(() => {
        notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
          console.error('notifyStudentMilestone error:', error);
        });
      });
    }

    if (newEmails.length > 0) {
      const insertedMembers = await createOrganizationMembers(
        newEmails.map((email) => ({ organizationId: orgId, email, roleId: ROLE.STUDENT, verified: false })),
        tx
      );

      afterCommit.push(async () => {
        for (const insertedMember of insertedMembers) {
          await emitOrganizationMemberWebhookEvent(
            'organization.member.added',
            orgId,
            insertedMember,
            invitedByProfileId
          );
        }
      });

      const insertedEmails = new Set(insertedMembers.map((member) => (member.email ?? '').toLowerCase()));
      addedEmails = newEmails.filter((email) => insertedEmails.has(email));
      const addedConcurrently = new Set(newEmails.filter((email) => !insertedEmails.has(email)));

      for (const row of rows) {
        if (row.status === 'ready' && addedConcurrently.has(row.email)) {
          row.status = 'already_member';
        }
      }
    }

    const existingStudentEmails =
      courseGroups.length > 0 || cohorts.length > 0
        ? await getStudentEmailsByProfileId(orgId, existingStudentProfileIds, tx)
        : new Map<string, string>();

    const assignedToCourses = await enrollAudienceStudentProfilesInCourses(
      enrolment,
      existingStudentEmails,
      existingStudentProfileIds,
      courseGroups,
      tx,
      afterCommit
    );
    const assignedToCohorts = await enrollAudienceStudentProfilesInCohorts(
      enrolment,
      existingStudentEmails,
      existingStudentProfileIds,
      cohorts,
      getCohortCourses,
      tx,
      afterCommit
    );

    const validGroupIds = courseGroups.map((courseGroup) => courseGroup.groupId).filter(Boolean) as string[];
    const profiles =
      addedEmails.length > 0 && (validGroupIds.length > 0 || cohorts.length > 0)
        ? await getProfilesByEmails(addedEmails, tx)
        : [];
    const profileIds = profiles.map((profile) => profile.id);

    if (validGroupIds.length > 0 && profiles.length > 0) {
      const users = profiles.map((p) => ({ profileId: p.id, email: p.email ?? undefined }));
      const enrolledMembers = await enrollUsersInCourseGroups(validGroupIds, users, ROLE.STUDENT, tx);
      const { createdRecords } = await ensureComplianceEnrollmentRecordsForProfiles(courseIds, profileIds, tx);

      afterCommit.push(
        () => invalidateOrgStats(orgId),
        () => captureLearnersEnrolled(enrolledMembers, 'audience', source),
        () => emitComplianceEnrollmentEvents(createdRecords)
      );
    }

    // Their org membership has no profile until they accept, so match them by the profile found from their email.
    if (cohorts.length > 0 && profiles.length > 0) {
      const profileEmails = new Map(profiles.map((profile) => [profile.id, profile.email ?? '']));

      await enrollAudienceStudentProfilesInCohorts(
        { ...enrolment, shouldSendEmail: false },
        profileEmails,
        profileIds,
        cohorts,
        getCohortCourses,
        tx,
        afterCommit
      );
    }

    const importInvites = await createStudentOrgInvitesAndSendEmails(
      { ...inviteInput, emails: addedEmails, shouldSendEmail: data.sendEmail },
      tx,
      afterCommit
    );
    const pendingInvites = await createStudentOrgInvitesAndSendEmails(
      { ...inviteInput, emails: pendingStudentEmails, shouldSendEmail: data.sendEmail },
      tx,
      afterCommit
    );

    return { assignedToCourses, assignedToCohorts, importInvites, pendingInvites };
  });

  await runAfterCommit(afterCommit);

  const imported = importInvites.created;
  const importEmailsSent = importInvites.emailsSent;
  const importEmailsFailed = importInvites.emailsFailed;
  const pendingEmailsSent = pendingInvites.emailsSent;
  const pendingEmailsFailed = pendingInvites.emailsFailed;

  captureLearnerInvited({
    profileId: invitedByProfileId,
    orgId,
    target: cohortIds.length > 0 ? 'cohort' : 'org',
    inviteType: 'email',
    count: imported + pendingStudentEmails.length,
    cohortId: cohortIds.length === 1 ? cohortIds[0] : undefined,
    source
  });

  return {
    ...buildImportResult(rows, {
      imported,
      enrolled: assignedToCourses.assigned + assignedToCohorts.assigned,
      emailsSent: assignedToCourses.emailsSent + assignedToCohorts.emailsSent + importEmailsSent + pendingEmailsSent,
      emailsFailed: importEmailsFailed + pendingEmailsFailed
    }),
    // Kept for the existing snackbar, which reads these directly.
    assigned: assignedToCourses.assigned + assignedToCohorts.assigned,
    alreadyEnrolledInCourses: assignedToCourses.alreadyEnrolled,
    alreadyEnrolledInCohorts: assignedToCohorts.alreadyEnrolled,
    pendingInvitesRenewed: pendingStudentEmails.length,
    truncated: parsed.truncated
  };
}

/** One row per submitted recipient, in order, with the outcome for each. */
function buildImportResult(
  rows: (ParsedImportRow & { status: TAudienceImportRowStatus })[],
  totals: { imported: number; enrolled: number; emailsSent: number; emailsFailed: number }
): AudienceImportResult {
  return {
    ...totals,
    rows: rows.map((row) => ({
      email: row.email,
      name: row.name,
      status: row.status
    }))
  };
}

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

  const latestInvite = await getLatestOrganizationInviteRowByOrgAndEmail(orgId, emailToUse);
  const meta = (latestInvite?.metadata as { courseIds?: string[]; cohortIds?: string[] } | undefined) ?? {};
  const courseIdsFromMetadata = meta.courseIds?.filter(Boolean) ?? [];
  const cohortIdsFromMetadata = meta.cohortIds?.filter(Boolean) ?? [];

  let courseIds: string[] = [];
  let courseNames: string[] = [];
  if (courseIdsFromMetadata.length > 0) {
    const courses = await getOrgCourses({ orgId, courseIds: courseIdsFromMetadata });
    courseIds = courses.items.map((c) => c.id);
    courseNames = courses.items.map((c) => c.title).filter(Boolean);
  }

  let cohortIds: string[] = [];
  let cohortNames: string[] = [];
  if (cohortIdsFromMetadata.length > 0) {
    const cohorts = await getCohortsByOrg(orgId, cohortIdsFromMetadata);
    cohortIds = cohorts.map((cohort) => cohort.id);
    cohortNames = cohorts.map((cohort) => cohort.name).filter(Boolean);
  }

  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();
  const token = generateToken();
  const accessNames = [...courseNames, ...cohortNames];
  const accessNamesLabel = accessNames.length > 0 ? accessNames.join(', ') : undefined;

  let studentMilestoneNotification: StudentMilestoneNotification | null = null;

  const invite = await db.transaction(async (tx) => {
    const needsSeat = await hasLapsedStudentInvite(orgId, member.id, tx);
    if (needsSeat) {
      studentMilestoneNotification = await assertStudentCapacityOrThrow(orgId, 1, tx, { deferNotification: true });
    }

    await revokeActiveOrganizationInvitesByEmails(orgId, [emailToUse], invitedByProfileId, tx);

    return createOrganizationInvite(
      {
        organizationId: orgId,
        roleId: ROLE.STUDENT,
        email: emailToUse,
        tokenHash: hashToken(token),
        createdByProfileId: invitedByProfileId,
        expiresAt,
        isRevoked: false,
        metadata: {
          source: 'AUDIENCE_RESEND',
          courseIds: courseIds.length > 0 ? courseIds : undefined,
          cohortIds: cohortIds.length > 0 ? cohortIds : undefined
        }
      },
      tx
    );
  });

  if (studentMilestoneNotification) {
    notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  await recordOrganizationInviteAudits([
    {
      inviteId: invite.id,
      organizationId: orgId,
      eventType: 'CREATED',
      actorProfileId: invitedByProfileId,
      targetEmail: emailToUse,
      ipAddress: null,
      userAgent: null,
      metadata: {
        roleId: ROLE.STUDENT,
        roleName: 'Student',
        expiresAt,
        courseIds,
        cohortIds
      }
    }
  ]);

  let emailSent = false;
  try {
    const inviteLink = buildInviteLink(token, organization);
    await enqueueTransactionalEmail('studentOrgInvite', {
      to: emailToUse,
      fields: {
        email: emailToUse,
        orgName: organization.name,
        inviteLink,
        expiresAt: getExpiryLabel(expiresAt),
        courseNames: accessNamesLabel,
        branding: buildEmailBranding(organization)
      },
      from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
      organizationId: orgId,
      idempotencyKey: `student-org-invite:${invite.id}`
    });

    emailSent = true;
    // Optimistic EMAIL_SENT — worker handles retries; final failure flips
    // email_delivery to `failed` for operator follow-up.
    await recordOrganizationInviteAudits([
      {
        inviteId: invite.id,
        organizationId: orgId,
        eventType: 'EMAIL_SENT',
        actorProfileId: invitedByProfileId,
        targetEmail: emailToUse,
        ipAddress: null,
        userAgent: null,
        metadata: {}
      }
    ]);
  } catch (emailError) {
    const message = emailError instanceof Error ? emailError.message : 'Unknown email error';
    await recordOrganizationInviteAudits([
      {
        inviteId: invite.id,
        organizationId: orgId,
        eventType: 'EMAIL_FAILED',
        actorProfileId: invitedByProfileId,
        targetEmail: emailToUse,
        ipAddress: null,
        userAgent: null,
        metadata: { error: message }
      }
    ]);
  }

  return { emailSent };
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

  const courseGroups = courseIds.length > 0 ? await getOrgCourseGroups(orgId, courseIds) : [];
  if (courseIds.length > 0 && courseGroups.length === 0) {
    throw new AppError('No valid courses found', ErrorCodes.VALIDATION_ERROR, 400, 'courseIds');
  }

  const cohorts = cohortIds.length > 0 ? await getCohortsByOrg(orgId, cohortIds) : [];
  if (cohortIds.length > 0 && cohorts.length === 0) {
    throw new AppError('No valid cohorts found', ErrorCodes.VALIDATION_ERROR, 400, 'cohortIds');
  }

  const enrolment: TAudienceEnrolment = {
    orgId,
    organization,
    shouldSendEmail: data.sendEmail,
    source,
    actorProfileId
  };
  const afterCommit: TAfterCommit = [];

  const { assignedToCourses, assignedToCohorts } = await db.transaction(async (tx) => {
    const studentEmails = await getStudentEmailsByProfileId(orgId, data.profileIds, tx);
    const getCohortCourses = lazyCohortCourses(
      cohorts.map((cohort) => cohort.id),
      tx
    );
    const assignedToCourses = await enrollAudienceStudentProfilesInCourses(
      enrolment,
      studentEmails,
      data.profileIds,
      courseGroups,
      tx,
      afterCommit
    );
    const assignedToCohorts = await enrollAudienceStudentProfilesInCohorts(
      enrolment,
      studentEmails,
      data.profileIds,
      cohorts,
      getCohortCourses,
      tx,
      afterCommit
    );

    return { assignedToCourses, assignedToCohorts };
  });

  await runAfterCommit(afterCommit);

  return {
    assigned: assignedToCourses.assigned + assignedToCohorts.assigned,
    alreadyEnrolled: assignedToCourses.alreadyEnrolled + assignedToCohorts.alreadyEnrolled,
    emailsSent: assignedToCourses.emailsSent + assignedToCohorts.emailsSent
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

  let studentMilestoneNotification: StudentMilestoneNotification | null = null;

  const updatedMember = await db.transaction(async (tx) => {
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

  const latestInvite = await getLatestOrganizationInviteRowByOrgAndEmail(orgId, currentEmail);
  const meta = (latestInvite?.metadata as { courseIds?: string[]; cohortIds?: string[] } | undefined) ?? {};

  const afterInvite: TAfterCommit = [];

  await createStudentOrgInvitesAndSendEmails(
    {
      orgId,
      organization,
      emails: [normalizedEmail],
      courseIds: meta.courseIds?.filter(Boolean) ?? [],
      cohortIds: meta.cohortIds?.filter(Boolean) ?? [],
      accessNamesLabel: undefined,
      invitedByProfileId,
      shouldSendEmail: data.sendEmail
    },
    db,
    afterInvite
  );
  await runAfterCommit(afterInvite);

  if (studentMilestoneNotification) {
    notifyStudentMilestone(studentMilestoneNotification).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  return updatedMember;
}
