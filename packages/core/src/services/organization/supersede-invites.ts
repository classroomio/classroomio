import crypto from 'node:crypto';

import { type DbOrTxClient } from '@cio/db/drizzle';
import type { TOrganizationInvite } from '@cio/db/types';
import {
  createOrganizationInvites,
  getLatestOrganizationInviteRowsByEmails,
  getStaffEmailsInOrganization,
  listLiveStudentOrgInvitesForEmail,
  lockOrganizationForUpdate,
  lockOrganizationMemberEmail,
  markOrganizationInvitesSuperseded,
  revokeOpenStudentOrgInvitesForEmail
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import {
  mergeInviteIdLists,
  parseCohortIdsFromInviteMetadata,
  parseCourseIdsFromInviteMetadata,
  parsePathIdsFromInviteMetadata
} from '@cio/utils/functions/invite-metadata';

const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

type TInviteResources = { courseIds: string[]; cohortIds: string[]; pathIds: string[] };

type TNewInviteRow = Parameters<typeof createOrganizationInvites>[0][number];

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function normalizeEmails(emails: string[]): string[] {
  return [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
}

function uniqueIds(ids: string[] | undefined): string[] {
  return [...new Set((ids ?? []).filter(Boolean))];
}

function readResources(metadata: unknown): TInviteResources {
  const courseIds = parseCourseIdsFromInviteMetadata(metadata);
  const cohortIds = parseCohortIdsFromInviteMetadata(metadata);
  const pathIds = parsePathIdsFromInviteMetadata(metadata);

  return { courseIds, cohortIds, pathIds };
}

function readFullname(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;

  const fullname = (metadata as Record<string, unknown>).fullname;

  return typeof fullname === 'string' && fullname.trim() ? fullname.trim() : undefined;
}

function isExpiredRenewalSource(invite: TOrganizationInvite | undefined): invite is TOrganizationInvite {
  if (!invite || invite.isRevoked || invite.acceptedAt) return false;

  return new Date(invite.expiresAt).getTime() <= Date.now();
}

function sameIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function sameResources(left: TInviteResources, right: TInviteResources): boolean {
  return (
    sameIds(left.courseIds, right.courseIds) &&
    sameIds(left.cohortIds, right.cohortIds) &&
    sameIds(left.pathIds, right.pathIds)
  );
}

function isEmpty(resources: TInviteResources): boolean {
  return resources.courseIds.length === 0 && resources.cohortIds.length === 0 && resources.pathIds.length === 0;
}

function mergeResources(sources: TInviteResources[]): TInviteResources {
  const courseIds = mergeInviteIdLists(...sources.map((resources) => resources.courseIds));
  const cohortIds = mergeInviteIdLists(...sources.map((resources) => resources.cohortIds));
  const pathIds = mergeInviteIdLists(...sources.map((resources) => resources.pathIds));

  return { courseIds, cohortIds, pathIds };
}

/**
 * Emails that must not receive a student invite: staff members or holders of a live ADMIN/TUTOR invite.
 */
export async function getStaffInvitedEmails(
  orgId: string,
  emails: string[],
  dbClient: DbOrTxClient
): Promise<Set<string>> {
  return getStaffEmailsInOrganization(orgId, normalizeEmails(emails), dbClient);
}

export type TSupersedeStudentOrgInvitesParams = {
  orgId: string;
  emails: string[];
  courseIds?: string[];
  cohortIds?: string[];
  pathIds?: string[];
  removeCourseIds?: string[];
  removeCohortIds?: string[];
  invitedByProfileId: string;
  fullnamesByEmail?: Map<string, string>;
  source?: string;
  /** `always` issues a fresh token (an explicit send); `when-changed` keeps a live invite that already covers everything. */
  reissue?: 'always' | 'when-changed';
};

export type TSupersedeStudentOrgInvitesResult = {
  revoked: TOrganizationInvite[];
  created: TOrganizationInvite[];
  unchanged: TOrganizationInvite[];
  inviteByEmail: Map<string, TOrganizationInvite>;
  tokenByEmail: Map<string, string>;
  addedCourseIdsByEmail: Map<string, string[]>;
  removedCourseIdsByEmail: Map<string, string[]>;
  skippedStaff: string[];
};

/**
 * Keeps one live student invite per (org, email) on `dbClient`, which must be a transaction so the locks hold until
 * commit. Adds and removes resources against the live invite (renewing an expired one), replaces it with a fresh
 * token, and records the successor on the replaced rows so their links still resolve. Removing the last resource
 * revokes the invite without a replacement. Staff emails are skipped. Locks the organization, then each email in
 * sorted order, the same order as identity binding.
 */
export async function supersedeStudentOrgInvites(
  dbClient: DbOrTxClient,
  params: TSupersedeStudentOrgInvitesParams
): Promise<TSupersedeStudentOrgInvitesResult> {
  const result: TSupersedeStudentOrgInvitesResult = {
    revoked: [],
    created: [],
    unchanged: [],
    inviteByEmail: new Map(),
    tokenByEmail: new Map(),
    addedCourseIdsByEmail: new Map(),
    removedCourseIdsByEmail: new Map(),
    skippedStaff: []
  };
  const emails = normalizeEmails(params.emails);
  if (emails.length === 0) return result;

  try {
    const staffEmails = await getStaffInvitedEmails(params.orgId, emails, dbClient);
    const eligible = emails.filter((email) => !staffEmails.has(email));
    result.skippedStaff = emails.filter((email) => staffEmails.has(email));

    const add: TInviteResources = {
      courseIds: uniqueIds(params.courseIds),
      cohortIds: uniqueIds(params.cohortIds),
      pathIds: uniqueIds(params.pathIds)
    };
    const removeCourseIds = new Set(uniqueIds(params.removeCourseIds));
    const removeCohortIds = new Set(uniqueIds(params.removeCohortIds));
    const isRemoval = removeCourseIds.size > 0 || removeCohortIds.size > 0;
    const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();

    await lockOrganizationForUpdate(params.orgId, dbClient);
    for (const email of [...eligible].sort()) {
      await lockOrganizationMemberEmail(dbClient, params.orgId, email);
    }

    const latestRows = await getLatestOrganizationInviteRowsByEmails(params.orgId, eligible, dbClient);
    const latestByEmail = new Map(latestRows.map((row) => [(row.email ?? '').toLowerCase(), row]));
    const pendingRows: { email: string; token: string; replacedIds: string[]; row: TNewInviteRow }[] = [];

    for (const email of eligible) {
      const live = await listLiveStudentOrgInvitesForEmail(params.orgId, email, dbClient);
      const latest = latestByEmail.get(email);
      const renewal = isExpiredRenewalSource(latest) ? [readResources(latest.metadata)] : [];
      const before = mergeResources([...live.map((invite) => readResources(invite.metadata)), ...renewal]);
      const withAdded = mergeResources([before, add]);
      const merged: TInviteResources = {
        courseIds: withAdded.courseIds.filter((id) => !removeCourseIds.has(id)),
        cohortIds: withAdded.cohortIds.filter((id) => !removeCohortIds.has(id)),
        pathIds: withAdded.pathIds
      };

      result.addedCourseIdsByEmail.set(
        email,
        merged.courseIds.filter((id) => !before.courseIds.includes(id))
      );
      result.removedCourseIdsByEmail.set(
        email,
        before.courseIds.filter((id) => !merged.courseIds.includes(id))
      );

      const liveInvite = live[0];
      const liveInviteCoversAll = liveInvite ? sameResources(readResources(liveInvite.metadata), merged) : false;
      if (liveInvite && live.length === 1 && params.reissue === 'when-changed' && liveInviteCoversAll) {
        result.unchanged.push(liveInvite);
        result.inviteByEmail.set(email, liveInvite);
        continue;
      }

      const revoked = await revokeOpenStudentOrgInvitesForEmail(
        params.orgId,
        email,
        params.invitedByProfileId,
        dbClient
      );
      result.revoked.push(...revoked);

      if (isRemoval && isEmpty(merged)) continue;

      const token = generateToken();
      pendingRows.push({
        email,
        token,
        replacedIds: revoked.map((invite) => invite.id),
        row: {
          organizationId: params.orgId,
          roleId: ROLE.STUDENT,
          email,
          tokenHash: hashToken(token),
          createdByProfileId: params.invitedByProfileId,
          expiresAt,
          isRevoked: false,
          metadata: {
            source: params.source ?? 'AUDIENCE_IMPORT',
            courseIds: merged.courseIds.length > 0 ? merged.courseIds : undefined,
            cohortIds: merged.cohortIds.length > 0 ? merged.cohortIds : undefined,
            pathIds: merged.pathIds.length > 0 ? merged.pathIds : undefined,
            fullname: params.fullnamesByEmail?.get(email) ?? readFullname(latest?.metadata)
          }
        }
      });
    }

    result.created = await createOrganizationInvites(
      pendingRows.map((pending) => pending.row),
      dbClient
    );

    for (const invite of result.created) {
      const email = (invite.email ?? '').toLowerCase();
      const pending = pendingRows.find((row) => row.email === email);
      result.inviteByEmail.set(email, invite);
      if (!pending) continue;

      result.tokenByEmail.set(email, pending.token);
      await markOrganizationInvitesSuperseded(dbClient, pending.replacedIds, invite.id);
    }

    return result;
  } catch (error) {
    console.error('supersedeStudentOrgInvites error:', error);
    throw new Error(
      `Failed to supersede student org invites: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
