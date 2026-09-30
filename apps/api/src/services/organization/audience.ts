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
import { enqueueTransactionalEmail } from '@api/services/jobs';
import {
  addCohortMember,
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
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import {
  getCourseGroupIds,
  getOrgCourseGroups,
  getOrgCourses,
  getRequiresLearningPathCourses
} from '@cio/db/queries/course';
import {
  getCourseIdsInPath,
  getExistingPathMembers,
  getOrgLearningPathsByIds,
  listLearningPaths
} from '@cio/db/queries/learning-path';
import { enrollProfileInLearningPath } from '@api/services/learning-path/member-management';
import { sendLearningPathWelcomeEmail } from '@api/services/learning-path/email';
import { scheduleLearningPathProgressSync } from '@api/services/learning-path/progress-sync-jobs';
import { updateOrganizationAudienceMember } from '@cio/db/queries/organization';

import { ROLE } from '@cio/utils/constants';
import { membershipKey } from '@cio/utils/functions';
import crypto from 'node:crypto';
import { db } from '@cio/db/drizzle';
import { buildOrgInviteLink, getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { assertStudentCapacityOrThrow, getRemainingStudentSeats } from './student-limit';
import { ensureCohortCourseGrants } from '@api/services/cohort/cohort';
import { getProfilesByEmails } from '@cio/db/queries/auth';
import { recordDirectCourseGrantsBulk } from '@api/services/course/enrollment-grants';
import { ensureComplianceEnrollmentRecordsForProfiles } from '../course/compliance';
import { getWelcomeSessionIcs } from '../course/session-invite';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
/** Parallel outbound invite emails; avoids sequential SMTP/API latency per recipient. */
const EMAIL_SEND_CONCURRENCY = 5;
/** Parallel grant upserts; bounded so large imports cannot exhaust the DB pool. */
const GRANT_WRITE_CONCURRENCY = 10;

// Heavier than grant upserts (one transaction per pair: org membership,
// path member, progress cache, course grants), so it gets its own knob even
// though the value matches today. Tune independently if enrollments strain
// the pool before grant writes do, or vice versa.
const PATH_ENROLL_CONCURRENCY = 10;

/**
 * Courses skipped by bulk assignment because they require enrollment through
 * a learning path. Reported so admins can assign the containing path instead.
 */
export interface TSkippedPathGatedCourses {
  courseIds: string[];
  courseNames: string[];
}

const NO_SKIPPED_PATH_GATED: TSkippedPathGatedCourses = { courseIds: [], courseNames: [] };

function mergeSkippedPathGated(...skipped: TSkippedPathGatedCourses[]): TSkippedPathGatedCourses {
  const courseIds = [...new Set(skipped.flatMap((entry) => entry.courseIds))];
  const courseNames = [...new Set(skipped.flatMap((entry) => entry.courseNames))];

  return { courseIds, courseNames };
}

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

async function resolvePathIdsAndNamesForImport(orgId: string, data: TImportAudienceMembers) {
  let pathIds: string[] = [];
  let pathNames: string[] = [];

  if (data.allPaths) {
    const { data: paths } = await listLearningPaths(orgId);
    pathIds = paths.map((path) => path.id);
    pathNames = paths.map((path) => path.name).filter(Boolean);
  } else if (data.pathIds && data.pathIds.length > 0) {
    const paths = await getOrgLearningPathsByIds(orgId, data.pathIds);
    pathIds = paths.map((path) => path.id);
    pathNames = paths.map((path) => path.name).filter(Boolean);
  }

  return { pathIds, pathNames };
}

async function enrollAudienceStudentProfilesInCourses(
  orgId: string,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>,
  profileIds: string[],
  courseIds: string[],
  shouldSendEmail: boolean
): Promise<{
  assigned: number;
  alreadyEnrolled: number;
  emailsSent: number;
  skippedPathGated: TSkippedPathGatedCourses;
}> {
  if (courseIds.length === 0 || profileIds.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, skippedPathGated: NO_SKIPPED_PATH_GATED };
  }

  const gatedCourses = await getRequiresLearningPathCourses(courseIds);
  const gatedIds = new Set(gatedCourses.map((course) => course.id));
  const directCourseIds = courseIds.filter((courseId) => !gatedIds.has(courseId));
  const skippedPathGated: TSkippedPathGatedCourses = {
    courseIds: gatedCourses.map((course) => course.id),
    courseNames: gatedCourses.map((course) => course.title).filter(Boolean)
  };

  if (directCourseIds.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, skippedPathGated };
  }

  const uniqueProfileIds = [...new Set(profileIds)];
  const orgMembers = await getOrgMembersByProfileIds(orgId, uniqueProfileIds);
  const studentMembers = orgMembers.filter((m) => m.profileId && m.roleId === ROLE.STUDENT);
  const validProfileIds = new Set(studentMembers.map((m) => m.profileId!));
  const profileEmailMap = new Map(studentMembers.filter((m) => m.profileId).map((m) => [m.profileId!, m.email ?? '']));

  const courseGroups = await getOrgCourseGroups(orgId, directCourseIds);

  if (courseGroups.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0, skippedPathGated };
  }

  const validGroupIds = courseGroups.map((cg) => cg.groupId).filter(Boolean) as string[];
  const courseTitleByGroupId = new Map(courseGroups.map((cg) => [cg.groupId, cg.courseTitle]));
  const welcomeMessageByGroupId = new Map(courseGroups.map((cg) => [cg.groupId, cg.welcomeEmailMessage]));
  const validProfiles = uniqueProfileIds.filter((id) => validProfileIds.has(id));

  const pairs = validProfiles.flatMap((profileId) => validGroupIds.map((groupId) => ({ groupId, profileId })));

  const existingSet = await getExistingGroupMembers(pairs);

  const toInsert = pairs.filter((p) => !existingSet.has(membershipKey(p.groupId, p.profileId)));
  const alreadyEnrolled = pairs.length - toInsert.length;

  if (toInsert.length > 0) {
    await addGroupMembers(
      toInsert.map((p) => ({
        groupId: p.groupId,
        roleId: ROLE.STUDENT,
        profileId: p.profileId,
        email: profileEmailMap.get(p.profileId) || undefined
      }))
    );

    await invalidateOrgStats(orgId);
  }

  if (validProfiles.length > 0) {
    await ensureComplianceEnrollmentRecordsForProfiles(directCourseIds, validProfiles);
    await recordDirectCourseGrantsBulk({
      groupIds: validGroupIds,
      profileIds: validProfiles,
      courseIds: directCourseIds,
      source: 'ORG_AUDIENCE'
    });
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

  return {
    assigned: toInsert.length,
    alreadyEnrolled,
    emailsSent,
    skippedPathGated
  };
}

async function enrollAudienceStudentProfilesInCohorts(
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>,
  orgId: string,
  profileIds: string[],
  cohortIds: string[],
  shouldSendEmail: boolean
): Promise<{ assigned: number; alreadyEnrolled: number; emailsSent: number }> {
  if (cohortIds.length === 0 || profileIds.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };
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
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };
  }

  const cohortNameById = new Map(cohorts.map((cohort) => [cohort.id, cohort.name || 'Cohort']));
  const loginUrl = getDashboardBaseUrl(organization);
  const validCohortIds = cohorts.map((cohort) => cohort.id);
  const validProfiles = uniqueProfileIds.filter((profileId) => validProfileIds.has(profileId));
  const pairs = validProfiles.flatMap((profileId) => validCohortIds.map((cohortId) => ({ cohortId, profileId })));
  const existingSet = await getExistingCohortMembers(pairs);
  const toInsert = pairs.filter((pair) => !existingSet.has(membershipKey(pair.cohortId, pair.profileId)));
  const alreadyEnrolled = pairs.length - toInsert.length;

  if (toInsert.length > 0) {
    await Promise.all(
      toInsert.map((pair) =>
        addCohortMember({
          cohortId: pair.cohortId,
          roleId: ROLE.STUDENT,
          profileId: pair.profileId,
          email: profileEmailMap.get(pair.profileId) || undefined
        })
      )
    );
  }

  // Enrols every assigned profile, not only new memberships, so re-running repairs
  // members added before cohort course enrolment existed.
  const cohortCourseIds = await getCourseIdsByCohortIds(validCohortIds);

  if (cohortCourseIds.length > 0 && validProfiles.length > 0) {
    const courseGroups = await getCourseGroupIds(cohortCourseIds);
    const groupIds = courseGroups.map((mapping) => mapping.groupId).filter(Boolean) as string[];
    const users = validProfiles.map((profileId) => ({
      profileId,
      email: profileEmailMap.get(profileId) || undefined
    }));
    const enrolledCount = await enrollUsersInCourseGroups(groupIds, users, ROLE.STUDENT);

    if (enrolledCount > 0) {
      await invalidateOrgStats(orgId);
    }

    // Records cohort provenance per cohort so People views can show it.
    // Grants are idempotent, so re-running only repairs missing rows.
    // Bounded parallelism: cohorts × profiles can be thousands of upserts.
    const grantPairs = (
      await Promise.all(
        validCohortIds.map(async (cohortId) => {
          const courseIdsInCohort = await getCourseIdsByCohortIds([cohortId]);
          return validProfiles.map((profileId) => ({ cohortId, profileId, courseIds: courseIdsInCohort }));
        })
      )
    )
      .flat()
      .filter((pair) => pair.courseIds.length > 0);

    await mapWithConcurrency(grantPairs, GRANT_WRITE_CONCURRENCY, (pair) =>
      ensureCohortCourseGrants(pair.cohortId, pair.profileId, undefined, db, pair.courseIds)
    );

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

  return {
    assigned: toInsert.length,
    alreadyEnrolled,
    emailsSent
  };
}

async function enrollAudienceStudentProfilesInPaths(
  orgId: string,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>,
  profileIds: string[],
  pathIds: string[],
  shouldSendEmail: boolean
): Promise<{ assigned: number; alreadyEnrolled: number; emailsSent: number }> {
  if (pathIds.length === 0 || profileIds.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };
  }

  const uniqueProfileIds = [...new Set(profileIds)];
  const orgMembers = await getOrgMembersByProfileIds(orgId, uniqueProfileIds);
  const studentMembers = orgMembers.filter((member) => member.profileId && member.roleId === ROLE.STUDENT);
  const validProfileIds = new Set(studentMembers.map((member) => member.profileId!));
  const profileEmailMap = new Map(
    studentMembers.filter((member) => member.profileId).map((member) => [member.profileId!, member.email ?? ''])
  );

  const paths = await getOrgLearningPathsByIds(orgId, pathIds);
  if (paths.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };
  }

  const pathById = new Map(paths.map((path) => [path.id, path]));
  const pathNameById = new Map(paths.map((path) => [path.id, path.name || 'Learning path']));
  const validProfiles = uniqueProfileIds.filter((profileId) => validProfileIds.has(profileId));

  const pairs = validProfiles.flatMap((profileId) => paths.map((path) => ({ learningPathId: path.id, profileId })));

  const existingSet = await getExistingPathMembers(pairs);
  const toInsert = pairs.filter((pair) => !existingSet.has(membershipKey(pair.learningPathId, pair.profileId)));
  const alreadyEnrolled = pairs.length - toInsert.length;

  // Bounded fan-out: pairs are independent (one transaction each) and the
  // capacity check inside takes the org row lock, so parallel pairs cannot
  // overshoot quota. Fail-fast like the serial loop it replaces.
  await mapWithConcurrency(toInsert, PATH_ENROLL_CONCURRENCY, (pair) =>
    enrollProfileInLearningPath(pathById.get(pair.learningPathId)!, {
      profileId: pair.profileId,
      email: profileEmailMap.get(pair.profileId) || undefined,
      roleId: ROLE.STUDENT
    })
  );

  if (toInsert.length > 0) {
    await invalidateOrgStats(orgId);
  }

  // Compliance courses track enrollment records for due dates and renewals.
  // Mirrors the direct/cohort audience flows above: runs after enrollment for
  // every assigned student; the helper no-ops for non-compliance courses.
  if (toInsert.length > 0) {
    const pathCourseIds = (await Promise.all(paths.map((path) => getCourseIdsInPath(path.id)))).flat();
    await ensureComplianceEnrollmentRecordsForProfiles(pathCourseIds, validProfiles);
  }

  // Prior work in the paths' courses counts, so an effectively finished path completes now.
  for (const path of paths) {
    const enrolledProfileIds = toInsert.filter((pair) => pair.learningPathId === path.id).map((pair) => pair.profileId);

    if (enrolledProfileIds.length > 0) {
      scheduleLearningPathProgressSync({ pathId: path.id, profileIds: enrolledProfileIds });
    }
  }

  let emailsSent = 0;
  const loginUrl = getDashboardBaseUrl(organization);
  const branding = buildEmailBranding(organization);
  const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);

  if (shouldSendEmail && toInsert.length > 0) {
    await Promise.all(
      toInsert
        .filter((pair) => profileEmailMap.get(pair.profileId))
        .map(async (pair) => {
          const email = profileEmailMap.get(pair.profileId)!;

          try {
            const sent = await sendLearningPathWelcomeEmail({
              organization,
              learningPath: {
                id: pair.learningPathId,
                name: pathNameById.get(pair.learningPathId) || 'Learning path',
                publicId: pathById.get(pair.learningPathId)?.publicId ?? null,
                welcomeEmailMessage: pathById.get(pair.learningPathId)?.welcomeEmailMessage
              },
              profileId: pair.profileId,
              email,
              idempotencyKey: `audience-path-welcome:${pair.learningPathId}:${pair.profileId}`
            });

            if (sent) {
              emailsSent++;
            }
          } catch (emailError) {
            console.error(`enrollAudienceStudentProfilesInPaths enqueue error for ${email}:`, emailError);
          }
        })
    );
  }

  return {
    assigned: toInsert.length,
    alreadyEnrolled,
    emailsSent
  };
}

async function createStudentOrgInvitesAndSendEmails(input: {
  orgId: string;
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>;
  emails: string[];
  courseIds: string[];
  cohortIds: string[];
  pathIds: string[];
  accessNamesLabel: string | undefined;
  invitedByProfileId: string;
  shouldSendEmail: boolean;
}): Promise<{ created: number; emailsSent: number; emailsFailed: number }> {
  const {
    orgId,
    organization,
    emails,
    courseIds,
    cohortIds,
    pathIds,
    accessNamesLabel,
    invitedByProfileId,
    shouldSendEmail
  } = input;

  if (emails.length === 0) {
    return { created: 0, emailsSent: 0, emailsFailed: 0 };
  }

  await revokeActiveOrganizationInvitesByEmails(orgId, emails, invitedByProfileId);

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
          cohortIds: cohortIds.length > 0 ? cohortIds : undefined,
          pathIds: pathIds.length > 0 ? pathIds : undefined
        }
      }
    };
  });

  const invites = await createOrganizationInvites(inviteInputs.map((i) => i.row));
  const inviteByEmail = new Map(invites.map((inv) => [(inv.email ?? '').toLowerCase(), inv]));
  const tokenByEmail = new Map(inviteInputs.map((i) => [i.email.toLowerCase(), i.token]));

  await createOrganizationInviteAudits(
    emails.map((email) => {
      const invite = inviteByEmail.get(email)!;
      return {
        inviteId: invite.id,
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
          cohortIds,
          pathIds
        }
      };
    })
  );

  let emailsSent = 0;
  let emailsFailed = 0;

  if (shouldSendEmail) {
    const emailOutcomes = await mapWithConcurrency(emails, EMAIL_SEND_CONCURRENCY, async (email) => {
      const invite = inviteByEmail.get(email)!;
      const token = tokenByEmail.get(email)!;
      try {
        const inviteLink = buildOrgInviteLink(token, organization);
        await enqueueTransactionalEmail('studentOrgInvite', {
          to: email,
          fields: {
            email,
            orgName: organization.name,
            inviteLink,
            expiresAt: getExpiryLabel(expiresAt),
            courseNames: accessNamesLabel,
            branding: buildEmailBranding(organization)
          },
          from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
          idempotencyKey: `student-org-invite:${invite.id}`
        });

        // Optimistic — see comment in services/organization/invite.ts.
        return {
          inviteId: invite.id,
          email,
          success: true as const,
          error: undefined as string | undefined
        };
      } catch (emailError) {
        const message = emailError instanceof Error ? emailError.message : 'Unknown email error';
        return { inviteId: invite.id, email, success: false as const, error: message };
      }
    });

    emailsSent = emailOutcomes.filter((o) => o.success).length;
    emailsFailed = emailOutcomes.length - emailsSent;

    await createOrganizationInviteAudits(
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
  }

  return { created: emails.length, emailsSent, emailsFailed };
}

export interface TAudienceImportOutcome extends AudienceImportResult {
  assigned: number;
  alreadyEnrolledInCourses: number;
  alreadyEnrolledInCohorts: number;
  alreadyEnrolledInPaths: number;
  pendingInvitesRenewed: number;
  skippedPathGatedCourses: string[];
  skippedPathGatedCourseNames: string[];
  truncated: number;
}

export async function importAudienceMembers(
  orgId: string,
  data: TImportAudienceMembers,
  invitedByProfileId: string
): Promise<TAudienceImportOutcome> {
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
      alreadyEnrolledInPaths: 0,
      pendingInvitesRenewed: 0,
      skippedPathGatedCourses: [],
      skippedPathGatedCourseNames: [],
      truncated: parsed.truncated
    };
  }

  const memberRows = await getOrganizationMembersByNormalizedEmails(orgId, candidateEmails);
  const memberByEmail = new Map(memberRows.map((m) => [m.normalizedEmail, m]));

  const newEmails: string[] = [];
  const existingStudentProfileIds: string[] = [];
  const pendingStudentEmails: string[] = [];

  for (const row of rows) {
    if (row.status !== 'ready') continue;

    const m = memberByEmail.get(row.email);

    if (!m) {
      newEmails.push(row.email);
      continue;
    }

    // Staff addresses are reported per row rather than rejecting the file: an
    // admin's own address pasted into a 900-row list should not block it.
    if (m.roleId !== ROLE.STUDENT) {
      row.status = 'is_staff';
      continue;
    }

    if (!m.profileId) {
      pendingStudentEmails.push(row.email);
      row.status = 'already_member';
      continue;
    }

    existingStudentProfileIds.push(m.profileId);
    row.status = 'already_member';
  }

  // Import what the plan allows and report the overflow, rather than refusing
  // the whole file when it does not fit.
  const remainingSeats = await getRemainingStudentSeats(orgId);
  // `slice` even when unlimited: aliasing `newEmails` here and clearing it below
  // would empty both.
  const admittedEmails = newEmails.slice(0, Number.isFinite(remainingSeats) ? remainingSeats : undefined);
  const rejectedForSeats = new Set(newEmails.slice(admittedEmails.length));

  for (const row of rows) {
    if (rejectedForSeats.has(row.email)) row.status = 'over_seat_limit';
  }

  newEmails.length = 0;
  newEmails.push(...admittedEmails);

  const { courseIds, courseNames } = await resolveCourseIdsAndNamesForImport(orgId, data);
  const { cohortIds, cohortNames } = await resolveCohortIdsAndNamesForImport(orgId, data);
  const { pathIds, pathNames } = await resolvePathIdsAndNamesForImport(orgId, data);
  const accessNames = [...courseNames, ...cohortNames, ...pathNames];
  const accessNamesLabel = accessNames.length > 0 ? accessNames.join(', ') : undefined;

  const assignedToCourses = await enrollAudienceStudentProfilesInCourses(
    orgId,
    organization,
    existingStudentProfileIds,
    courseIds,
    data.sendEmail
  );
  const assignedToCohorts = await enrollAudienceStudentProfilesInCohorts(
    organization,
    orgId,
    existingStudentProfileIds,
    cohortIds,
    data.sendEmail
  );
  const assignedToPaths = await enrollAudienceStudentProfilesInPaths(
    orgId,
    organization,
    existingStudentProfileIds,
    pathIds,
    data.sendEmail
  );

  let imported = 0;
  let importEmailsSent = 0;
  let importEmailsFailed = 0;
  let newEmailsSkipped: TSkippedPathGatedCourses = NO_SKIPPED_PATH_GATED;

  if (newEmails.length > 0) {
    // Capacity was already resolved above; this keeps the milestone emails
    // firing and guards against a concurrent import filling the last seats.
    await assertStudentCapacityOrThrow(orgId, newEmails.length);

    await createOrganizationMembers(
      newEmails.map((email) => ({
        organizationId: orgId,
        email,
        roleId: ROLE.STUDENT,
        verified: false
      }))
    );

    // Pending profiles enroll directly only into courses that accept it —
    // path-gated courses wait for the learning-path invite below.
    const gatedForNewEmails = await getRequiresLearningPathCourses(courseIds);
    const gatedIdsForNewEmails = new Set(gatedForNewEmails.map((course) => course.id));
    const directCourseIdsForNewEmails = courseIds.filter((courseId) => !gatedIdsForNewEmails.has(courseId));
    newEmailsSkipped = {
      courseIds: gatedForNewEmails.map((course) => course.id),
      courseNames: gatedForNewEmails.map((course) => course.title).filter(Boolean)
    };

    if (directCourseIdsForNewEmails.length > 0) {
      const courseGroupMappings = await getCourseGroupIds(directCourseIdsForNewEmails);
      const validGroupIds = courseGroupMappings.map((m) => m.groupId).filter(Boolean) as string[];

      if (validGroupIds.length > 0) {
        const profiles = await getProfilesByEmails(newEmails);
        if (profiles.length > 0) {
          const users = profiles.map((p) => ({ profileId: p.id, email: p.email ?? undefined }));
          await enrollUsersInCourseGroups(validGroupIds, users, ROLE.STUDENT);
          await invalidateOrgStats(orgId);
          await ensureComplianceEnrollmentRecordsForProfiles(
            directCourseIdsForNewEmails,
            profiles.map((profile) => profile.id)
          );
          await recordDirectCourseGrantsBulk({
            groupIds: validGroupIds,
            profileIds: profiles.map((profile) => profile.id),
            courseIds: directCourseIdsForNewEmails,
            source: 'ORG_AUDIENCE'
          });
        }
      }
    }

    if (cohortIds.length > 0) {
      const profiles = await getProfilesByEmails(newEmails);
      if (profiles.length > 0) {
        await enrollAudienceStudentProfilesInCohorts(
          organization,
          orgId,
          profiles.map((profile) => profile.id),
          cohortIds,
          false
        );
      }
    }

    if (pathIds.length > 0) {
      const profiles = await getProfilesByEmails(newEmails);
      if (profiles.length > 0) {
        await enrollAudienceStudentProfilesInPaths(
          orgId,
          organization,
          profiles.map((profile) => profile.id),
          pathIds,
          false
        );
      }
    }

    const inviteOutcome = await createStudentOrgInvitesAndSendEmails({
      orgId,
      organization,
      emails: newEmails,
      courseIds,
      cohortIds,
      pathIds,
      accessNamesLabel,
      invitedByProfileId,
      shouldSendEmail: data.sendEmail
    });
    imported = newEmails.length;
    importEmailsSent = inviteOutcome.emailsSent;
    importEmailsFailed = inviteOutcome.emailsFailed;
  }

  let pendingEmailsSent = 0;
  let pendingEmailsFailed = 0;
  if (pendingStudentEmails.length > 0) {
    const pendingOutcome = await createStudentOrgInvitesAndSendEmails({
      orgId,
      organization,
      emails: pendingStudentEmails,
      courseIds,
      cohortIds,
      pathIds,
      accessNamesLabel,
      invitedByProfileId,
      shouldSendEmail: data.sendEmail
    });
    pendingEmailsSent = pendingOutcome.emailsSent;
    pendingEmailsFailed = pendingOutcome.emailsFailed;
  }

  const skippedPathGated = mergeSkippedPathGated(assignedToCourses.skippedPathGated, newEmailsSkipped);

  return {
    ...buildImportResult(rows, {
      imported,
      enrolled: assignedToCourses.assigned + assignedToCohorts.assigned + assignedToPaths.assigned,
      emailsSent:
        assignedToCourses.emailsSent +
        assignedToCohorts.emailsSent +
        assignedToPaths.emailsSent +
        importEmailsSent +
        pendingEmailsSent,
      emailsFailed: importEmailsFailed + pendingEmailsFailed
    }),
    // Kept for the existing snackbar, which reads these directly.
    assigned: assignedToCourses.assigned + assignedToCohorts.assigned + assignedToPaths.assigned,
    alreadyEnrolledInCourses: assignedToCourses.alreadyEnrolled,
    alreadyEnrolledInCohorts: assignedToCohorts.alreadyEnrolled,
    alreadyEnrolledInPaths: assignedToPaths.alreadyEnrolled,
    pendingInvitesRenewed: pendingStudentEmails.length,
    skippedPathGatedCourses: skippedPathGated.courseIds,
    skippedPathGatedCourseNames: skippedPathGated.courseNames,
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
  const meta =
    (latestInvite?.metadata as { courseIds?: string[]; cohortIds?: string[]; pathIds?: string[] } | undefined) ?? {};
  const courseIdsFromMetadata = meta.courseIds?.filter(Boolean) ?? [];
  const cohortIdsFromMetadata = meta.cohortIds?.filter(Boolean) ?? [];
  const pathIdsFromMetadata = meta.pathIds?.filter(Boolean) ?? [];

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

  let pathIds: string[] = [];
  let pathNames: string[] = [];
  if (pathIdsFromMetadata.length > 0) {
    const paths = await getOrgLearningPathsByIds(orgId, pathIdsFromMetadata);
    pathIds = paths.map((path) => path.id);
    pathNames = paths.map((path) => path.name).filter(Boolean);
  }

  await revokeActiveOrganizationInvitesByEmails(orgId, [emailToUse], invitedByProfileId);

  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();
  const token = generateToken();
  const accessNames = [...courseNames, ...cohortNames, ...pathNames];
  const accessNamesLabel = accessNames.length > 0 ? accessNames.join(', ') : undefined;

  const invite = await createOrganizationInvite({
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
      cohortIds: cohortIds.length > 0 ? cohortIds : undefined,
      pathIds: pathIds.length > 0 ? pathIds : undefined
    }
  });

  await createOrganizationInviteAudits([
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
        cohortIds,
        pathIds
      }
    }
  ]);

  let emailSent = false;
  try {
    const inviteLink = buildOrgInviteLink(token, organization);
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
      idempotencyKey: `student-org-invite:${invite.id}`
    });

    emailSent = true;
    // Optimistic EMAIL_SENT — worker handles retries; final failure flips
    // email_delivery to `failed` for operator follow-up.
    await createOrganizationInviteAudits([
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
    await createOrganizationInviteAudits([
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

  await createOrganizationInviteAudits(
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

export interface TAssignAudienceToCoursesResult {
  assigned: number;
  alreadyEnrolled: number;
  emailsSent: number;
  skippedPathGatedCourses: string[];
  skippedPathGatedCourseNames: string[];
}

export async function assignAudienceToCourses(
  orgId: string,
  data: TAssignAudienceCourses
): Promise<TAssignAudienceToCoursesResult> {
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const courseIds = data.courseIds ?? [];
  const cohortIds = data.cohortIds ?? [];

  let assignedToCourses = {
    assigned: 0,
    alreadyEnrolled: 0,
    emailsSent: 0,
    skippedPathGated: NO_SKIPPED_PATH_GATED
  };
  let assignedToCohorts = { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };

  if (courseIds.length > 0) {
    const courseGroups = await getOrgCourseGroups(orgId, courseIds);
    if (courseGroups.length === 0) {
      throw new AppError('No valid courses found', ErrorCodes.VALIDATION_ERROR, 400, 'courseIds');
    }

    assignedToCourses = await enrollAudienceStudentProfilesInCourses(
      orgId,
      organization,
      data.profileIds,
      courseIds,
      data.sendEmail
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
      data.profileIds,
      cohortIds,
      data.sendEmail
    );
  }

  return {
    assigned: assignedToCourses.assigned + assignedToCohorts.assigned,
    alreadyEnrolled: assignedToCourses.alreadyEnrolled + assignedToCohorts.alreadyEnrolled,
    emailsSent: assignedToCourses.emailsSent + assignedToCohorts.emailsSent,
    skippedPathGatedCourses: assignedToCourses.skippedPathGated.courseIds,
    skippedPathGatedCourseNames: assignedToCourses.skippedPathGated.courseNames
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

  await revokeActiveOrganizationInvitesByEmails(orgId, [currentEmail, normalizedEmail], invitedByProfileId);

  const updatedMember = await updateOrganizationAudienceMember(orgId, memberId, {
    email: normalizedEmail,
    verified: false
  });

  if (!updatedMember) {
    throw new AppError('Audience member not found', ErrorCodes.NOT_FOUND, 404);
  }

  const latestInvite = await getLatestOrganizationInviteRowByOrgAndEmail(orgId, currentEmail);
  const meta =
    (latestInvite?.metadata as { courseIds?: string[]; cohortIds?: string[]; pathIds?: string[] } | undefined) ?? {};

  await createStudentOrgInvitesAndSendEmails({
    orgId,
    organization,
    emails: [normalizedEmail],
    courseIds: meta.courseIds?.filter(Boolean) ?? [],
    cohortIds: meta.cohortIds?.filter(Boolean) ?? [],
    pathIds: meta.pathIds?.filter(Boolean) ?? [],
    accessNamesLabel: undefined,
    invitedByProfileId,
    shouldSendEmail: data.sendEmail
  });

  return updatedMember;
}
