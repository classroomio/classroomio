import crypto from 'node:crypto';

import type { DbOrTxClient } from '@cio/db/drizzle';
import {
  createOrganizationInviteAudits,
  createOrganizationInvites,
  getActiveOrganizationInvitesByEmails,
  lockOrganizationInviteEmails,
  revokeOrganizationInvitesByIds
} from '@cio/db/queries/organization';
import { getOrgCourses } from '@cio/db/queries/course';
import { getCohortsByOrg } from '@cio/db/queries/cohort';
import { getOrgLearningPathsByIds } from '@cio/db/queries/learning-path';
import {
  parseCohortIdsFromInviteMetadata,
  parseCourseIdsFromInviteMetadata,
  parsePathIdsFromInviteMetadata
} from '@cio/utils/functions';
import { ROLE } from '@cio/utils/constants';

import { ORG_INVITE_EXPIRY_MS } from '../learning-path/path-invite-utils';

export interface TSupersedeInviteAdd {
  courseIds: string[];
  cohortIds: string[];
  pathIds: string[];
}

export interface TSupersededInvite {
  email: string;
  inviteId: string;
  token: string;
  expiresAt: string;
  courseIds: string[];
  cohortIds: string[];
  pathIds: string[];
  accessNamesLabel: string | undefined;
  /** True when live ids from an earlier invite were folded in. */
  merged: boolean;
}

export interface TSupersedeInviteSkipped {
  email: string;
  reason: 'STAFF_INVITE';
}

/** Reads course, cohort and path ids from invite metadata, including legacy keys. */
function parseInviteResourceIds(metadata: unknown): TSupersedeInviteAdd {
  return {
    courseIds: parseCourseIdsFromInviteMetadata(metadata),
    cohortIds: parseCohortIdsFromInviteMetadata(metadata),
    pathIds: parsePathIdsFromInviteMetadata(metadata)
  };
}

/** Concatenates id lists, dropping duplicates and keeping first-seen order. */
function mergeUnique(...lists: string[][]): string[] {
  return [...new Set(lists.flat())];
}

/**
 * Supersedes pending student invites: per email, folds the live resource ids
 * from every active invite together with the new ones, revokes the old rows
 * (audited with `mergedInto`), and creates one invite carrying the union.
 * Active ADMIN/TUTOR invites are left alone and reported as skipped.
 *
 * Runs inside the caller's transaction; email sending happens after commit
 * from the returned invite rows.
 */
export async function supersedeStudentOrgInvites(
  tx: DbOrTxClient,
  input: {
    orgId: string;
    emails: string[];
    actorProfileId: string;
    source: string;
    add: TSupersedeInviteAdd;
  }
): Promise<{ invites: TSupersededInvite[]; skipped: TSupersedeInviteSkipped[] }> {
  const normalized = [...new Set(input.emails.map((email) => email.toLowerCase().trim()))].filter(Boolean);

  if (normalized.length === 0) {
    return { invites: [], skipped: [] };
  }

  // Serializes concurrent supersedes per address, including first-time ones
  // where there is no existing row for FOR UPDATE to lock.
  await lockOrganizationInviteEmails(input.orgId, normalized, tx);

  const active = await getActiveOrganizationInvitesByEmails(input.orgId, normalized, tx);
  const activeByEmail = new Map<string, typeof active>();

  for (const invite of active) {
    if (!invite.email) continue;

    const key = invite.email.toLowerCase();
    const list = activeByEmail.get(key) ?? [];
    list.push(invite);
    activeByEmail.set(key, list);
  }

  const invites: TSupersededInvite[] = [];
  const skipped: TSupersedeInviteSkipped[] = [];
  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();

  for (const email of normalized) {
    const existing = activeByEmail.get(email) ?? [];

    if (existing.some((invite) => invite.roleId !== ROLE.STUDENT)) {
      skipped.push({ email, reason: 'STAFF_INVITE' });
      continue;
    }

    const courseIds = mergeUnique(
      existing.flatMap((invite) => parseInviteResourceIds(invite.metadata).courseIds),
      input.add.courseIds
    );
    const cohortIds = mergeUnique(
      existing.flatMap((invite) => parseInviteResourceIds(invite.metadata).cohortIds),
      input.add.cohortIds
    );
    const pathIds = mergeUnique(
      existing.flatMap((invite) => parseInviteResourceIds(invite.metadata).pathIds),
      input.add.pathIds
    );

    const token = crypto.randomBytes(32).toString('base64url');
    const [created] = await createOrganizationInvites(
      [
        {
          organizationId: input.orgId,
          roleId: ROLE.STUDENT,
          email,
          tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
          createdByProfileId: input.actorProfileId,
          expiresAt,
          isRevoked: false,
          metadata: {
            source: input.source,
            ...(courseIds.length > 0 ? { courseIds } : {}),
            ...(cohortIds.length > 0 ? { cohortIds } : {}),
            ...(pathIds.length > 0 ? { pathIds } : {})
          }
        }
      ],
      tx
    );

    if (existing.length > 0) {
      await revokeOrganizationInvitesByIds(
        existing.map((invite) => invite.id),
        input.actorProfileId,
        tx
      );
    }

    await createOrganizationInviteAudits(
      [
        ...existing.map((invite) => ({
          inviteId: invite.id,
          organizationId: input.orgId,
          eventType: 'REVOKED' as const,
          actorProfileId: input.actorProfileId,
          targetEmail: email,
          ipAddress: null,
          userAgent: null,
          metadata: { mergedInto: created.id }
        })),
        {
          inviteId: created.id,
          organizationId: input.orgId,
          eventType: 'CREATED' as const,
          actorProfileId: input.actorProfileId,
          targetEmail: email,
          ipAddress: null,
          userAgent: null,
          metadata: {
            roleId: ROLE.STUDENT,
            roleName: 'Student',
            expiresAt,
            ...(courseIds.length > 0 ? { courseIds } : {}),
            ...(cohortIds.length > 0 ? { cohortIds } : {}),
            ...(pathIds.length > 0 ? { pathIds } : {})
          }
        }
      ],
      tx
    );

    const accessNamesLabel = await buildAccessNamesLabel(input.orgId, { courseIds, cohortIds, pathIds }, tx);

    invites.push({
      email,
      inviteId: created.id,
      token,
      expiresAt,
      courseIds,
      cohortIds,
      pathIds,
      accessNamesLabel,
      merged: existing.length > 0
    });
  }

  return { invites, skipped };
}

/** Names everything a merged invite grants, for the email's "you now have access to" line. */
async function buildAccessNamesLabel(
  orgId: string,
  ids: TSupersedeInviteAdd,
  dbClient: DbOrTxClient
): Promise<string | undefined> {
  const names: string[] = [];

  if (ids.courseIds.length > 0) {
    const courses = await getOrgCourses({ orgId, courseIds: ids.courseIds, limit: ids.courseIds.length }, dbClient);
    names.push(...courses.items.map((course) => course.title).filter(Boolean));
  }

  if (ids.cohortIds.length > 0) {
    const cohorts = await getCohortsByOrg(orgId, ids.cohortIds, dbClient);
    names.push(...cohorts.map((cohort) => cohort.name).filter(Boolean));
  }

  if (ids.pathIds.length > 0) {
    const paths = await getOrgLearningPathsByIds(orgId, ids.pathIds, dbClient);
    names.push(...paths.map((path) => path.name).filter(Boolean));
  }

  return names.length > 0 ? names.join(', ') : undefined;
}
