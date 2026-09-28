import crypto from 'node:crypto';

import { type DbOrTxClient, db } from '@cio/db/drizzle';
import {
  createOrganizationInviteAudits,
  createOrganizationInvites,
  createOrganizationMember,
  createOrganizationMembers,
  countActiveStudents,
  getActiveOrganizationPlan,
  getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile,
  getOrganizationMembersByNormalizedEmails,
  getUserOrgRolesMap,
  lockOrganizationForStudentCapacity,
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import { getProfileById, getProfilesByEmails } from '@cio/db/queries/auth';
import {
  enrollMember,
  getCourseIdsInPath,
  getLearningPathById,
  getMemberByPathAndProfile,
  grantCourseAccess,
  initializeMemberCourseProgress,
  listLearningPathCourses
} from '@cio/db/queries/learning-path';
import { getCourseById, getCourseGroupIds } from '@cio/db/queries/course/course';
import {
  createCourseCompletionRecord,
  getLatestComplianceRecordsByProfiles,
  getStudentCourseMembersForCompliance
} from '@cio/db/queries/course/compliance';
import { getGroupMemberIdByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import { EmailPreferenceLookupCache } from '@cio/db/queries/notifications';
import { EmailRegistry, buildEmailBranding, buildEmailFromName, type EmailId } from '@cio/email';
import { enqueueEmailSend, isRedisConfigured, type TPathBulkEnrollPayload } from '@cio/jobs';
import { getStudentLimit } from '@cio/utils/plans';
import { ROLE } from '@cio/utils/constants';
import type { TLearningPath, TLearningPathMember } from '@cio/db/types';

import { env } from '../../config/env';
import { getDashboardBaseUrl } from '../../config/dashboard-url';
import { invalidateOrgStats } from '../../utils/redis/org-stats-cache';

/**
 * Worker-safe applier for queued learning-path member adds, shared by the
 * BullMQ worker. It lives here rather than in `@cio/api` because the jobs
 * runtime cannot import the API (which already imports `@cio/jobs` — the
 * reverse edge would close a package cycle).
 *
 * The synchronous implementation in `apps/api/.../member-management.ts`
 * remains canonical for small adds; this mirrors its enrollment mechanics
 * (org membership + quota, member upsert, progress cache, course grants,
 * compliance records, email-only invites, welcome emails) with two deliberate
 * differences:
 * per-chunk transactions with per-chunk failure tolerance, and no milestone
 * notification emails (the API asserts capacity at enqueue time, which fires
 * those). Keep the two in sync when the enrollment mechanics change.
 */

/** Carries a code so the API can map run failures to HTTP without string matching. */
export class PathBulkEnrollError extends Error {
  constructor(
    readonly code: 'PATH_NOT_FOUND' | 'QUOTA_EXCEEDED',
    message: string,
    readonly meta: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'PathBulkEnrollError';
  }
}

export interface PathBulkEnrollFailure {
  /** profileId when known, otherwise the invite email. */
  key: string;
  reason: string;
}

export interface PathBulkEnrollOutcome {
  requested: number;
  enrolled: number;
  invited: number;
  failed: PathBulkEnrollFailure[];
}

type TPathBulkMember = TPathBulkEnrollPayload['members'][number];

type TEnrollCorePath = Pick<TLearningPath, 'id' | 'autoEnroll' | 'sequentialUnlock' | 'organizationId'>;

type TResolvedChunkMember = { profileId: string; email: string | null; roleId: number };

const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Quota check for worker enrollments. Mirrors `assertStudentCapacityOrThrow`
 * minus milestone notifications, which the API already fires at enqueue time.
 */
async function assertBulkStudentCapacity(
  organizationId: string,
  additionalStudents: number,
  tx: DbOrTxClient
): Promise<void> {
  if (additionalStudents <= 0) return;
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return;

  await lockOrganizationForStudentCapacity(organizationId, tx);

  const activePlan = await getActiveOrganizationPlan(organizationId, tx);
  const limit = getStudentLimit(activePlan?.planName);

  if (!Number.isFinite(limit)) return;

  const currentCount = await countActiveStudents(organizationId, tx);

  if (currentCount + additionalStudents > limit) {
    throw new PathBulkEnrollError('QUOTA_EXCEEDED', `This organization has reached its ${limit}-student limit`, {
      organizationId,
      currentCount,
      limit
    });
  }
}

/**
 * Slim template-email enqueue for the worker runtime. Mirrors the API's
 * `enqueueTransactionalEmail` (registry validation, preference respect,
 * idempotent job ids); returns false instead of throwing on delivery failure
 * so one bad email never fails an enrollment chunk.
 */
async function enqueueBulkTemplateEmail(
  template: EmailId,
  input: {
    to: string;
    fields: Record<string, unknown>;
    from?: string;
    idempotencyKey?: string;
    preference?: { organizationId: string; recipientProfileId?: string };
  }
): Promise<boolean> {
  const definition = EmailRegistry.get(template);

  if (!definition) {
    throw new Error(`Email template "${template}" is not registered`);
  }

  const validatedFields = definition.schema.parse(input.fields) as Record<string, unknown>;

  if (!isRedisConfigured()) {
    return false;
  }

  if (input.preference) {
    const allowed = await new EmailPreferenceLookupCache().shouldSend({
      emailId: template,
      organizationId: input.preference.organizationId,
      recipientEmail: input.to,
      recipientProfileId: input.preference.recipientProfileId
    });

    if (!allowed) {
      return false;
    }
  }

  const jobId = await enqueueEmailSend(
    {
      kind: 'template',
      template,
      to: input.to,
      fields: validatedFields,
      from: input.from
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}
  );

  return Boolean(jobId);
}

/**
 * Enrolls one profile: org membership (students only, skipping org team
 * members per the self-hosted invariant), member upsert, progress cache, and
 * course grants when auto-enroll is on. Mirrors `enrollProfileInLearningPath`.
 */
async function enrollMemberCore(
  path: TEnrollCorePath,
  input: { profileId: string; email?: string | null; roleId: number; grantedByProfileId?: string },
  tx: DbOrTxClient
): Promise<TLearningPathMember> {
  if (input.roleId === ROLE.STUDENT) {
    const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(path.organizationId, input.profileId, tx);

    if (!orgMemberId) {
      const orgRoles = await getUserOrgRolesMap(input.profileId);
      const isTeamMember = Object.values(orgRoles).some((roleId) => roleId === ROLE.ADMIN || roleId === ROLE.TUTOR);

      if (!isTeamMember) {
        await assertBulkStudentCapacity(path.organizationId, 1, tx);
        await createOrganizationMember(
          {
            organizationId: path.organizationId,
            roleId: ROLE.STUDENT,
            profileId: input.profileId,
            verified: true
          },
          tx
        );
      }
    }
  }

  const member = await enrollMember(
    {
      learningPathId: path.id,
      profileId: input.profileId,
      email: input.email ?? null,
      roleId: input.roleId,
      status: 'NOT_STARTED'
    },
    tx
  );

  const courses = await listLearningPathCourses(path.id, tx);

  await initializeMemberCourseProgress(
    member.id,
    courses.map((course) => ({ id: course.id, order: course.order })),
    path.sequentialUnlock,
    tx
  );

  if (path.autoEnroll) {
    const courseIds = courses.map((course) => course.courseId);

    if (courseIds.length > 0) {
      const courseGroups = await getCourseGroupIds(courseIds, tx);
      const groupMemberValues = courseGroups
        .filter((entry): entry is { courseId: string; groupId: string } => Boolean(entry.groupId))
        .map((entry) => ({ groupId: entry.groupId, profileId: input.profileId, roleId: ROLE.STUDENT }));

      await insertGroupMembersOnConflictDoNothing(groupMemberValues, tx);

      for (const entry of courseGroups) {
        if (!entry.groupId) {
          continue;
        }

        const groupMemberId = await getGroupMemberIdByGroupAndProfile(entry.groupId, input.profileId, tx);

        if (groupMemberId) {
          await grantCourseAccess(
            {
              groupmemberId: groupMemberId,
              courseId: entry.courseId,
              profileId: input.profileId,
              source: 'LEARNING_PATH',
              learningPathId: path.id,
              grantedByProfileId: input.grantedByProfileId
            },
            tx
          );
        }
      }
    }
  }

  return member;
}

/**
 * Resolves email-only entries against existing profiles. Unresolvable
 * non-tutor emails come back for the invite flow; tutor emails without an
 * account are reported as failures (tutors must already be org team).
 */
async function resolveBulkChunkMembers(
  members: TPathBulkMember[]
): Promise<{ direct: TResolvedChunkMember[]; inviteEmails: string[]; failed: PathBulkEnrollFailure[] }> {
  const direct: TResolvedChunkMember[] = [];
  const inviteEmails: string[] = [];
  const failed: PathBulkEnrollFailure[] = [];

  const emailOnlyEmails = members
    .filter((member) => !member.profileId && member.email)
    .map((member) => member.email!.toLowerCase().trim());
  const profilesByEmail = new Map<string, { id: string }>();

  if (emailOnlyEmails.length > 0) {
    const profiles = await getProfilesByEmails(emailOnlyEmails);

    for (const profile of profiles) {
      if (profile.email) {
        profilesByEmail.set(profile.email.toLowerCase().trim(), { id: profile.id });
      }
    }
  }

  for (const member of members) {
    if (member.profileId) {
      direct.push({ profileId: member.profileId, email: member.email ?? null, roleId: member.roleId });
      continue;
    }

    const normalizedEmail = (member.email ?? '').toLowerCase().trim();

    if (!normalizedEmail) {
      failed.push({ key: '', reason: 'MISSING_PROFILE_OR_EMAIL' });
      continue;
    }

    if (member.roleId === ROLE.TUTOR) {
      failed.push({ key: normalizedEmail, reason: 'TUTOR_REQUIRES_ACCOUNT' });
      continue;
    }

    const existingProfile = profilesByEmail.get(normalizedEmail);

    if (existingProfile) {
      direct.push({ profileId: existingProfile.id, email: member.email ?? null, roleId: member.roleId });
    } else {
      inviteEmails.push(normalizedEmail);
    }
  }

  return { direct, inviteEmails, failed };
}

/**
 * Creates the org member rows, path-targeted invites, and CREATED audits for
 * emails without accounts. Runs outside any enrollment transaction, mirroring
 * the synchronous path. Returns invite links for the email step.
 */
async function createBulkPathInvites(
  path: TLearningPath,
  emails: string[],
  actorProfileId: string
): Promise<Array<{ email: string; inviteId: string; token: string }>> {
  const normalized = [...new Set(emails)];

  if (normalized.length === 0) {
    return [];
  }

  const existingMembers = await getOrganizationMembersByNormalizedEmails(path.organizationId, normalized);
  const existingEmails = new Set(existingMembers.map((member) => member.normalizedEmail));
  const newEmails = normalized.filter((email) => !existingEmails.has(email));

  if (newEmails.length > 0) {
    // Unlocked pre-check: the sync path checks invite capacity outside a
    // transaction too. The strict locked check still runs per enrollment
    // inside the chunk transaction.
    if (env.PUBLIC_IS_SELFHOSTED !== 'true') {
      const activePlan = await getActiveOrganizationPlan(path.organizationId);
      const limit = getStudentLimit(activePlan?.planName);

      if (Number.isFinite(limit)) {
        const currentCount = await countActiveStudents(path.organizationId);

        if (currentCount + newEmails.length > limit) {
          throw new PathBulkEnrollError('QUOTA_EXCEEDED', `This organization has reached its ${limit}-student limit`, {
            organizationId: path.organizationId,
            currentCount,
            limit
          });
        }
      }
    }

    await createOrganizationMembers(
      newEmails.map((email) => ({
        organizationId: path.organizationId,
        email,
        roleId: ROLE.STUDENT,
        verified: false
      }))
    );
  }

  await revokeActiveOrganizationInvitesByEmails(path.organizationId, normalized, actorProfileId);

  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();
  const tokenPairs = normalized.map((email) => ({ email, token: crypto.randomBytes(32).toString('base64url') }));
  const createdInvites = await createOrganizationInvites(
    tokenPairs.map(({ email, token }) => ({
      organizationId: path.organizationId,
      roleId: ROLE.STUDENT,
      email,
      tokenHash: hashInviteToken(token),
      createdByProfileId: actorProfileId,
      expiresAt,
      isRevoked: false,
      metadata: { source: 'LEARNING_PATH_BULK_ADD', pathIds: [path.id] }
    }))
  );

  await createOrganizationInviteAudits(
    createdInvites.map((invite) => ({
      inviteId: invite.id,
      organizationId: path.organizationId,
      eventType: 'CREATED' as const,
      actorProfileId,
      targetEmail: invite.email,
      ipAddress: null,
      userAgent: null,
      metadata: { roleId: ROLE.STUDENT, roleName: 'Student', expiresAt, pathIds: [path.id] }
    }))
  );

  const tokenByEmail = new Map(tokenPairs.map((pair) => [pair.email, pair.token] as const));
  const inviteEmails: Array<{ email: string; inviteId: string; token: string }> = [];

  for (const invite of createdInvites) {
    const email = (invite.email ?? '').toLowerCase();
    const token = tokenByEmail.get(email);

    if (email && token) {
      inviteEmails.push({ email, inviteId: invite.id, token });
    }
  }

  return inviteEmails;
}

/**
 * Worker-safe counterpart of `ensureComplianceEnrollmentRecordsForProfiles`
 * (`apps/api/.../course/compliance.ts`), which the jobs runtime cannot import
 * without closing a package cycle (see note above). Same mechanics: creates
 * initial compliance-cycle records for enrolled students in COMPLIANCE
 * courses, no-ops everywhere else (non-compliance courses, missing deadlines,
 * existing records). Best-effort by design — callers must catch so a
 * compliance failure can never fail an already-committed enrollment, and a
 * malformed deadline only logs instead of throwing. Keep the two in sync when
 * the enrollment mechanics change.
 */
async function ensureBulkComplianceRecords(courseIds: string[], profileIds: string[]): Promise<void> {
  if (courseIds.length === 0 || profileIds.length === 0) {
    return;
  }

  // Per-course bodies are independent (disjoint rows, idempotent against
  // existing records), so fan out over courses; learners within a course stay
  // serial to bound connection usage.
  await Promise.all(
    courseIds.map(async (courseId) => {
      const [course] = await getCourseById(courseId);

      if (!course || course.type !== 'COMPLIANCE' || !course.compliance) {
        return;
      }

      const deadline = (course.certificate as { deadline?: string | null } | null)?.deadline ?? null;

      if (!deadline) {
        return;
      }

      if (Number.isNaN(new Date(deadline).getTime())) {
        console.error('runQueuedPathBulkEnroll invalid compliance deadline', { courseId, deadline });
        return;
      }

      const learners = await getStudentCourseMembersForCompliance(courseId, profileIds);

      for (const learner of learners) {
        const learnerProfileId = learner.member.profileId;

        if (!learnerProfileId) {
          continue;
        }

        const [existingRecord] = await getLatestComplianceRecordsByProfiles(courseId, [learnerProfileId]);

        if (existingRecord) {
          continue;
        }

        await createCourseCompletionRecord({
          courseId,
          groupMemberId: learner.member.id,
          profileId: learnerProfileId,
          cycleNumber: 1,
          status: 'not_started',
          dueDate: deadline,
          attempts: 0,
          timeSpentMinutes: 0
        });
      }
    })
  );
}

/**
 * Runs a queued bulk add in chunks, each its own transaction. A chunk that
 * throws is recorded against its members rather than aborting the run, so one
 * bad member cannot hide the outcome of the rest. Welcome and invite emails
 * send after each chunk commits; per-email failures only log (invite email
 * failures also write an EMAIL_FAILED audit, best-effort).
 */
export async function runQueuedPathBulkEnroll(payload: {
  organizationId: string;
  actorProfileId: string;
  pathId: string;
  members: TPathBulkMember[];
  chunkSize: number;
}): Promise<PathBulkEnrollOutcome> {
  const { organizationId, actorProfileId, pathId, members, chunkSize } = payload;

  const path = await getLearningPathById(pathId);

  if (!path) {
    throw new PathBulkEnrollError('PATH_NOT_FOUND', 'Learning path not found', { pathId });
  }

  if (path.organizationId !== organizationId) {
    throw new PathBulkEnrollError('PATH_NOT_FOUND', 'Learning path not found', { pathId });
  }

  const organization = await getOrganizationById(organizationId);

  if (!organization) {
    throw new PathBulkEnrollError('PATH_NOT_FOUND', 'Organization not found', { organizationId });
  }

  const branding = buildEmailBranding(organization);
  const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);
  const baseUrl = getDashboardBaseUrl(organization);
  const loginUrl = path.publicId ? `${baseUrl}/paths/${path.publicId}` : baseUrl;

  let enrolled = 0;
  let invited = 0;
  const failed: PathBulkEnrollFailure[] = [];
  const complianceProfileIds: string[] = [];

  for (let index = 0; index < members.length; index += chunkSize) {
    const chunk = members.slice(index, index + chunkSize);
    const chunkKey = (member: TPathBulkMember) => member.profileId ?? member.email ?? '';

    let direct: TResolvedChunkMember[] = [];
    let pendingInvites: string[] = [];

    try {
      const resolved = await resolveBulkChunkMembers(chunk);
      direct = resolved.direct;
      pendingInvites = resolved.inviteEmails;
      failed.push(...resolved.failed);
    } catch (error) {
      console.error('runQueuedPathBulkEnroll resolve failed:', error);

      for (const member of chunk) {
        failed.push({ key: chunkKey(member), reason: 'CHUNK_FAILED' });
      }

      continue;
    }

    let welcomeCandidates: Array<{ profileId: string; email: string | null }> = [];

    try {
      const result = await db.transaction(async (tx) => {
        const enrolledMembers: TLearningPathMember[] = [];
        const candidates: Array<{ profileId: string; email: string | null }> = [];

        for (const entry of direct) {
          const existingMember = await getMemberByPathAndProfile(path.id, entry.profileId, tx);
          const isFreshJoin = !existingMember;

          const member = await enrollMemberCore(
            path,
            {
              profileId: entry.profileId,
              email: entry.email,
              roleId: entry.roleId,
              grantedByProfileId: actorProfileId
            },
            tx
          );

          enrolledMembers.push(member);

          if (isFreshJoin && entry.roleId === ROLE.STUDENT) {
            candidates.push({ profileId: entry.profileId, email: entry.email });
          }
        }

        return { enrolledMembers, candidates };
      });

      enrolled += result.enrolledMembers.length;
      welcomeCandidates = result.candidates;

      for (const entry of direct) {
        if (entry.roleId === ROLE.STUDENT) {
          complianceProfileIds.push(entry.profileId);
        }
      }
    } catch (error) {
      if (error instanceof PathBulkEnrollError && error.code === 'QUOTA_EXCEEDED') {
        throw error;
      }

      console.error('runQueuedPathBulkEnroll chunk failed:', error);

      for (const entry of direct) {
        failed.push({ key: entry.profileId, reason: 'CHUNK_FAILED' });
      }

      for (const email of pendingInvites) {
        failed.push({ key: email, reason: 'CHUNK_FAILED' });
      }

      continue;
    }

    let inviteEmails: Array<{ email: string; inviteId: string; token: string }> = [];

    try {
      inviteEmails = await createBulkPathInvites(path, pendingInvites, actorProfileId);
      invited += inviteEmails.length;
    } catch (error) {
      console.error('runQueuedPathBulkEnroll invites failed:', error);

      for (const email of pendingInvites) {
        failed.push({ key: email, reason: 'INVITE_FAILED' });
      }
    }

    for (const candidate of welcomeCandidates) {
      let recipientEmail = candidate.email;

      if (!recipientEmail) {
        const profile = await getProfileById(candidate.profileId);
        recipientEmail = profile?.email ?? null;
      }

      if (!recipientEmail) {
        continue;
      }

      await enqueueBulkTemplateEmail('studentLearningPathWelcome', {
        to: recipientEmail,
        fields: {
          orgName: organization.name,
          learningPathName: path.name || 'Learning path',
          loginUrl,
          customMessage: path.welcomeEmailMessage ?? undefined,
          branding
        },
        from,
        idempotencyKey: `learning-path-members-welcome:${path.id}:${candidate.profileId}`,
        preference: { organizationId, recipientProfileId: candidate.profileId }
      }).catch((emailError) => {
        console.error('runQueuedPathBulkEnroll welcome email error', { pathId, emailError });
      });
    }

    for (const invite of inviteEmails) {
      const inviteLink = `${baseUrl}/invite/${encodeURIComponent(invite.token)}`;
      const sent = await enqueueBulkTemplateEmail('studentLearningPathInvite', {
        to: invite.email,
        fields: {
          email: invite.email,
          orgName: organization.name,
          learningPathName: path.name || 'Learning path',
          inviteLink,
          expiresAt: new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString(),
          branding
        },
        from,
        idempotencyKey: `learning-path-manual-invite:${invite.inviteId}`
      }).catch(() => false);

      await createOrganizationInviteAudits([
        {
          inviteId: invite.inviteId,
          organizationId,
          eventType: sent ? ('EMAIL_SENT' as const) : ('EMAIL_FAILED' as const),
          actorProfileId,
          targetEmail: invite.email,
          ipAddress: null,
          userAgent: null,
          metadata: sent ? {} : { error: 'enqueue failed' }
        }
      ]).catch((auditError) => {
        console.error('runQueuedPathBulkEnroll invite audit error', { pathId, auditError });
      });
    }
  }

  if (enrolled > 0) {
    void invalidateOrgStats(organizationId).catch(() => {});
  }

  // Compliance courses track enrollment records for due dates and renewals.
  // Runs once for the whole run (not per chunk) after every chunk commits;
  // best-effort so a compliance failure can never fail committed enrollments.
  if (complianceProfileIds.length > 0) {
    try {
      const pathCourseIds = await getCourseIdsInPath(path.id);
      await ensureBulkComplianceRecords(pathCourseIds, [...new Set(complianceProfileIds)]);
    } catch (error) {
      console.error('runQueuedPathBulkEnroll compliance backfill error', { pathId, error });
    }
  }

  return { requested: members.length, enrolled, invited, failed };
}
