import { type DbOrTxClient, db } from '@cio/db/drizzle';
import {
  createOrganizationInviteAudits,
  createOrganizationMembers,
  countActiveStudents,
  getActiveOrganizationPlan,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  lockOrganizationForStudentCapacity
} from '@cio/db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth';
import { getCourseIdsInPath, getLearningPathById, getMemberByPathAndProfile } from '@cio/db/queries/learning-path';
import { getCourseById } from '@cio/db/queries/course/course';
import {
  createCourseCompletionRecord,
  getLatestComplianceRecordsByProfiles,
  getStudentCourseMembersForCompliance
} from '@cio/db/queries/course/compliance';
import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import type { TPathBulkEnrollPayload } from '@cio/jobs';
import type { PathBulkEnrollFailure, PathBulkEnrollOutcome } from '@cio/jobs/payloads/learning-path';
import { getStudentLimit } from '@cio/utils/plans';
import { ROLE } from '@cio/utils/constants';
import type { TLearningPath, TLearningPathMember } from '@cio/db/types';

import { env } from '../../config/env';
import { buildOrgInviteLink } from '../../config/dashboard-url';
import { invalidateOrgStats } from '../../utils/redis/org-stats-cache';
import { enrollProfileCore } from './enroll-profile-core';
import { supersedeStudentOrgInvites } from '../organization/supersede-invites';
import { EMAIL_FANOUT_CONCURRENCY, mapWithConcurrency } from './fanout';
import { buildLearningPathLoginUrl, getInviteExpiryLabel, normalizeInviteEmails } from './path-invite-utils';
import { resolveBulkMembers } from './member-resolve';
import { syncLearningPathMembersProgress } from './progress-sync';
import { enqueueWorkerTemplateEmail } from './template-email';

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

export type { PathBulkEnrollFailure, PathBulkEnrollOutcome };

type TPathBulkMember = TPathBulkEnrollPayload['members'][number];

type TEnrollCorePath = Pick<TLearningPath, 'id' | 'sequentialUnlock' | 'organizationId'>;

type TResolvedChunkMember = { profileId: string; email: string | null; roleId: number };

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
 * Enrolls one profile: org membership (students only, skipping org team
 * members per the self-hosted invariant), member upsert, progress cache, and
 * course grants for STUDENT members. Delegates to the shared core so the
 * worker and API can never drift.
 */
async function enrollMemberCore(
  path: TEnrollCorePath,
  input: { profileId: string; email?: string | null; roleId: number; grantedByProfileId?: string },
  tx: DbOrTxClient,
  enqueuedAt?: string
): Promise<TLearningPathMember | null> {
  if (enqueuedAt) {
    return enrollProfileCore(path, input, tx, assertBulkStudentCapacity, { enqueuedAt });
  }

  return enrollProfileCore(path, input, tx, assertBulkStudentCapacity);
}

/**
 * Resolves email-only entries against existing profiles. Delegates to the
 * shared resolver so invite semantics match the synchronous API path.
 */
async function resolveBulkChunkMembers(
  members: TPathBulkMember[]
): Promise<{ direct: TResolvedChunkMember[]; inviteEmails: string[]; failed: PathBulkEnrollFailure[] }> {
  return resolveBulkMembers(members);
}

type TBulkPathInvite = { email: string; inviteId: string; token: string; expiresAt: string };

/**
 * Creates the org member rows, path-targeted invites, and CREATED audits for
 * emails without accounts, in one transaction so a failure cannot leave member
 * rows without an invite. Earlier pending invites are folded into the new one
 * instead of wiped. Returns invite links (with each invite's stored expiry)
 * for the email step, and the emails skipped because an active staff invite
 * already covers them.
 */
async function createBulkPathInvites(
  path: TLearningPath,
  emails: string[],
  actorProfileId: string
): Promise<{ invites: TBulkPathInvite[]; skippedStaffInviteEmails: string[] }> {
  const normalized = normalizeInviteEmails(emails);

  if (normalized.length === 0) {
    return { invites: [], skippedStaffInviteEmails: [] };
  }

  const existingMembers = await getOrganizationMembersByNormalizedEmails(path.organizationId, normalized);
  const existingEmails = new Set(existingMembers.map((member) => member.normalizedEmail));
  const newEmails = normalized.filter((email) => !existingEmails.has(email));

  if (newEmails.length > 0) {
    // Unlocked pre-check before writing invites. The strict locked check
    // still runs per enrollment inside the chunk transaction.
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
  }

  const { invites, skipped } = await db.transaction(async (tx) => {
    if (newEmails.length > 0) {
      await createOrganizationMembers(
        newEmails.map((email) => ({
          organizationId: path.organizationId,
          email,
          roleId: ROLE.STUDENT,
          verified: false
        })),
        tx
      );
    }

    return supersedeStudentOrgInvites(tx, {
      orgId: path.organizationId,
      emails: normalized,
      actorProfileId,
      source: 'LEARNING_PATH_BULK_ADD',
      add: { courseIds: [], cohortIds: [], pathIds: [path.id] }
    });
  });

  return {
    invites: invites.map((invite) => ({
      email: invite.email,
      inviteId: invite.inviteId,
      token: invite.token,
      expiresAt: invite.expiresAt
    })),
    skippedStaffInviteEmails: skipped.map((entry) => entry.email)
  };
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
  sendEmail?: boolean;
  enqueuedAt?: string;
}): Promise<PathBulkEnrollOutcome> {
  const { organizationId, actorProfileId, pathId, members, chunkSize, enqueuedAt } = payload;
  const sendEmail = payload.sendEmail ?? true;

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
  const loginUrl = buildLearningPathLoginUrl(organization, path);

  let enrolled = 0;
  let invited = 0;
  const failed: PathBulkEnrollFailure[] = [];
  const complianceProfileIds: string[] = [];

  let quotaExceeded = false;
  const chunkKey = (member: TPathBulkMember) => member.profileId ?? member.email ?? '';

  for (let index = 0; index < members.length; index += chunkSize) {
    // The limit was hit in an earlier chunk: every member not yet attempted
    // fails, and the loop stops so the post-run work covers committed chunks.
    if (quotaExceeded) {
      for (const member of members.slice(index)) {
        failed.push({ key: chunkKey(member), reason: 'QUOTA_EXCEEDED' });
      }

      break;
    }

    const chunk = members.slice(index, index + chunkSize);

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
        const chunkFailed: Array<{ key: string; reason: string }> = [];
        const chunkComplianceProfileIds: string[] = [];

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
            tx,
            enqueuedAt
          );

          // Removed after enqueue: the removal stands; report, don't resurrect.
          if (!member) {
            chunkFailed.push({ key: entry.profileId, reason: 'REMOVED_SINCE_ENQUEUE' });
            continue;
          }

          enrolledMembers.push(member);

          if (isFreshJoin && member.roleId === ROLE.STUDENT) {
            candidates.push({ profileId: entry.profileId, email: entry.email });
          }

          if (member.roleId === ROLE.STUDENT) {
            chunkComplianceProfileIds.push(entry.profileId);
          }
        }

        return { enrolledMembers, candidates, chunkFailed, chunkComplianceProfileIds };
      });

      enrolled += result.enrolledMembers.length;
      failed.push(...result.chunkFailed);
      complianceProfileIds.push(...result.chunkComplianceProfileIds);
      welcomeCandidates = result.candidates;
    } catch (error) {
      if (error instanceof PathBulkEnrollError && error.code === 'QUOTA_EXCEEDED') {
        // Record this chunk's direct members as QUOTA_EXCEEDED
        for (const entry of direct) {
          failed.push({ key: entry.profileId, reason: 'QUOTA_EXCEEDED' });
        }
        // Record this chunk's pending invites as QUOTA_EXCEEDED
        for (const email of pendingInvites) {
          failed.push({ key: email, reason: 'QUOTA_EXCEEDED' });
        }
        // Remaining members will be marked QUOTA_EXCEEDED at loop top
        quotaExceeded = true;
        continue;
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

    let inviteEmails: TBulkPathInvite[] = [];

    try {
      const inviteBatch = await createBulkPathInvites(path, pendingInvites, actorProfileId);
      inviteEmails = inviteBatch.invites;
      invited += inviteEmails.length;

      for (const email of inviteBatch.skippedStaffInviteEmails) {
        failed.push({ key: email, reason: 'STAFF_INVITE' });
      }
    } catch (error) {
      if (error instanceof PathBulkEnrollError && error.code === 'QUOTA_EXCEEDED') {
        for (const email of pendingInvites) {
          failed.push({ key: email, reason: 'QUOTA_EXCEEDED' });
        }
        quotaExceeded = true;
      } else {
        console.error('runQueuedPathBulkEnroll invites failed:', error);

        for (const email of pendingInvites) {
          failed.push({ key: email, reason: 'INVITE_FAILED' });
        }
      }
    }

    await mapWithConcurrency(welcomeCandidates, EMAIL_FANOUT_CONCURRENCY, async (candidate) => {
      if (!sendEmail) {
        return;
      }

      try {
        let recipientEmail = candidate.email;

        if (!recipientEmail) {
          const profile = await getProfileById(candidate.profileId);
          recipientEmail = profile?.email ?? null;
        }

        if (!recipientEmail) {
          return;
        }

        await enqueueWorkerTemplateEmail('studentLearningPathWelcome', {
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
      } catch (error) {
        console.error('runQueuedPathBulkEnroll welcome lookup error', {
          pathId,
          profileId: candidate.profileId,
          error
        });
      }
    });

    await mapWithConcurrency(inviteEmails, EMAIL_FANOUT_CONCURRENCY, async (invite) => {
      // Invites and CREATED audits above are membership plumbing and always
      // written; only the send respects the toggle, mirroring course assigns.
      if (!sendEmail) {
        return;
      }

      const inviteLink = buildOrgInviteLink(invite.token, organization);
      const sent = await enqueueWorkerTemplateEmail('studentLearningPathInvite', {
        to: invite.email,
        fields: {
          email: invite.email,
          orgName: organization.name,
          learningPathName: path.name || 'Learning path',
          inviteLink,
          expiresAt: getInviteExpiryLabel(invite.expiresAt),
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
    });
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

    // Prior work in the path's courses counts, so effectively finished paths
    // complete now. Best-effort, after every chunk commits, like compliance.
    try {
      await syncLearningPathMembersProgress({ pathId: path.id, profileIds: [...new Set(complianceProfileIds)] });
    } catch (error) {
      console.error('runQueuedPathBulkEnroll progress sync error', { pathId, error });
    }
  }

  return { requested: members.length, enrolled, invited, failed };
}
