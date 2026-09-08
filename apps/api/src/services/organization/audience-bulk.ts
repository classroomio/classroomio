import { createHash, randomUUID } from 'node:crypto';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { AUDIENCE_BULK_SYNC_MAX } from '@cio/utils/validation/organization';
import { db } from '@cio/db/drizzle';
import {
  type BulkAudienceMemberRow,
  type MemberAuditEntry,
  type OrganizationMemberAuditEvent,
  type OrganizationMemberStatus,
  bulkDeleteOrganizationAudienceMembers,
  bulkUpdateOrganizationMemberStatus,
  countAudienceMatchesNotArchived,
  deleteGroupMembershipsForOrgProfiles,
  getAudienceMatchSample,
  getBulkAudienceMembersByIds,
  recordOrganizationMemberAudit,
  resolveAudienceMemberIds,
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import type { TAudienceBulkAction, TBulkAudienceAction } from '@cio/utils/validation/organization';

/** One contract for both paths, so the client branches on `mode` alone. */
export type BulkAudienceActionResult =
  | {
      mode: 'completed';
      requested: number;
      succeeded: number;
      failed: { memberId: number; reason: string }[];
      /** Present only for reversible actions. Absent for `delete`. */
      undoToken?: string;
    }
  | { mode: 'queued'; jobId: string; requested: number };

const ACTION_TO_STATUS: Record<Exclude<TAudienceBulkAction, 'delete'>, OrganizationMemberStatus> = {
  deactivate: 'DEACTIVATED',
  reactivate: 'ACTIVE',
  archive: 'ARCHIVED',
  unarchive: 'ACTIVE'
};

const ACTION_TO_AUDIT_EVENT: Record<TAudienceBulkAction, OrganizationMemberAuditEvent> = {
  deactivate: 'DEACTIVATED',
  reactivate: 'REACTIVATED',
  archive: 'ARCHIVED',
  unarchive: 'UNARCHIVED',
  delete: 'REMOVED'
};

/** The inverse each reversible action undoes to. `delete` has none. */
const UNDO_STATUS: Record<
  Exclude<TAudienceBulkAction, 'delete' | 'reactivate' | 'unarchive'>,
  OrganizationMemberStatus
> = {
  deactivate: 'ACTIVE',
  archive: 'ACTIVE'
};

/**
 * Checksum over the previewed member ids. A matching count does not prove a
 * matching target — two learners swapping states leaves the count identical and
 * the set different — so this is what makes the drift check real.
 */
export function computeTargetHash(memberIds: number[]): string {
  return createHash('sha256')
    .update([...memberIds].sort((a, b) => a - b).join(','))
    .digest('hex');
}

export type BulkAudiencePreview = {
  /** Exact, never approximate — the apply step re-checks it. */
  count: number;
  targetHash: string;
  sample: { id: number; name: string; email: string }[];
  /** The delete gate, surfaced before the admin confirms. */
  notArchivedCount: number;
};

/** What a filter-mode action would affect, plus the hash the apply verifies. */
export async function previewBulkAudienceAction(
  orgId: string,
  filter: Parameters<typeof resolveAudienceMemberIds>[1]
): Promise<BulkAudiencePreview> {
  // Only the hash needs every id; the rest derive from the filter.
  const [matchedIds, sample, notArchivedCount] = await Promise.all([
    resolveAudienceMemberIds(orgId, filter),
    getAudienceMatchSample(orgId, filter, PREVIEW_SAMPLE_SIZE),
    countAudienceMatchesNotArchived(orgId, filter)
  ]);

  return {
    count: matchedIds.length,
    targetHash: computeTargetHash(matchedIds),
    sample: sample.map((member) => ({
      id: member.id,
      name: member.email?.split('@')[0] ?? String(member.id),
      email: member.email ?? ''
    })),
    notArchivedCount
  };
}

type UndoRecord = {
  orgId: string;
  actorProfileId: string;
  memberIds: number[];
  /** The status to restore. */
  status: OrganizationMemberStatus;
  /** The status the original action applied — undo skips anyone no longer in it. */
  appliedStatus: OrganizationMemberStatus;
  expiresAt: number;
};

/**
 * Single-use undo tokens, in memory. A known limitation: they do not survive a
 * deploy or work across instances. Redis before the API runs multi-instance.
 */
const UNDO_TOKEN_TTL_MS = 15 * 60 * 1000;
const undoTokens = new Map<string, UndoRecord>();

function issueUndoToken(record: Omit<UndoRecord, 'expiresAt'>): string {
  const token = randomUUID();
  undoTokens.set(token, { ...record, expiresAt: Date.now() + UNDO_TOKEN_TTL_MS });

  return token;
}

function consumeUndoToken(token: string, orgId: string, actorProfileId: string): UndoRecord {
  const record = undoTokens.get(token);

  // Burn before use, so a double-click cannot apply twice.
  undoTokens.delete(token);

  if (!record || record.expiresAt < Date.now()) {
    throw new AppError('This undo has expired', ErrorCodes.ORG_AUDIENCE_BULK_FAILED, 410);
  }

  if (record.orgId !== orgId || record.actorProfileId !== actorProfileId) {
    throw new AppError('This undo is not available', ErrorCodes.ORG_AUDIENCE_BULK_FAILED, 403);
  }

  return record;
}

const PREVIEW_SAMPLE_SIZE = 5;

/** Always checked against a count, never a loaded array, so refusing is cheap. */
function assertWithinSyncCeiling(targetSize: number): void {
  if (targetSize <= AUDIENCE_BULK_SYNC_MAX) {
    return;
  }

  throw new AppError(
    `This action affects ${targetSize} learners, which exceeds the ${AUDIENCE_BULK_SYNC_MAX} that can be applied in one request.`,
    ErrorCodes.ORG_AUDIENCE_BULK_FAILED,
    413
  );
}

/**
 * Resolves the target inside the caller's transaction. Filter mode reuses the
 * list's `whereClause` builder, then re-checks the previewed count and hash.
 */
async function resolveTarget(
  orgId: string,
  data: TBulkAudienceAction,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<BulkAudienceMemberRow[]> {
  if (data.target.mode === 'ids') {
    return getBulkAudienceMembersByIds(orgId, data.target.memberIds, tx);
  }

  const matchedIds = await resolveAudienceMemberIds(orgId, data.target.filter, tx);
  const actualHash = computeTargetHash(matchedIds);

  if (matchedIds.length !== data.target.expectedCount || actualHash !== data.target.expectedTargetHash) {
    throw new AppError(
      `These filters now match ${matchedIds.length} learners, not ${data.target.expectedCount}. Review the list again before applying.`,
      ErrorCodes.ORG_AUDIENCE_BULK_TARGET_CHANGED,
      409
    );
  }

  // Before loading rows, so a huge match is refused cheaply.
  assertWithinSyncCeiling(matchedIds.length);

  return getBulkAudienceMembersByIds(orgId, matchedIds, tx);
}

/**
 * One transaction owned here: resolution, authorization, writes, invite
 * revocation and audit rows.
 */
export async function applyBulkAudienceAction(
  orgId: string,
  data: TBulkAudienceAction,
  actorProfileId: string
): Promise<BulkAudienceActionResult> {
  const outcome = await db.transaction(async (tx) => {
    const members = await resolveTarget(orgId, data, tx);

    if (members.length === 0) {
      throw new AppError('No matching learners to act on', ErrorCodes.ORG_AUDIENCE_BULK_FAILED, 404);
    }

    assertWithinSyncCeiling(members.length);

    const requested = members.length;
    const filterSnapshot = data.target.mode === 'filter' ? { ...data.target.filter } : undefined;

    if (data.action === 'delete') {
      return deleteMembers(orgId, members, data, actorProfileId, filterSnapshot, tx);
    }

    return changeStatus(orgId, members, data, actorProfileId, filterSnapshot, requested, tx);
  });

  return outcome;
}

/**
 * Permanent removal. Every resolved member must already be ARCHIVED; the UI's
 * type-to-confirm sits on top of this gate, never in place of it.
 */
async function deleteMembers(
  orgId: string,
  members: BulkAudienceMemberRow[],
  data: TBulkAudienceAction,
  actorProfileId: string,
  filterSnapshot: Record<string, unknown> | undefined,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<BulkAudienceActionResult> {
  const notArchived = members.filter((member) => member.status !== 'ARCHIVED');

  if (notArchived.length > 0) {
    throw new AppError(
      `${notArchived.length} of these learners are not archived. Archive them first — deleting is only available for archived learners.`,
      ErrorCodes.ORG_AUDIENCE_DELETE_NOT_ARCHIVED,
      409
    );
  }

  const memberIds = members.map((member) => member.id);
  const profileIds = members.map((member) => member.profileId).filter((id): id is string => Boolean(id));

  // Before the delete, while the identities still exist.
  await recordOrganizationMemberAudit(orgId, buildAuditEntries(members, data, actorProfileId, filterSnapshot), tx);

  if (profileIds.length > 0) {
    await deleteGroupMembershipsForOrgProfiles(orgId, profileIds, tx);
  }

  const deletedIds = await bulkDeleteOrganizationAudienceMembers(orgId, memberIds, tx);

  const emails = members
    .filter((member) => deletedIds.includes(member.id) && member.email)
    .map((member) => member.email!.toLowerCase());

  if (emails.length > 0) {
    // In-transaction: a rollback must not leave invites revoked.
    await revokeActiveOrganizationInvitesByEmails(orgId, emails, actorProfileId, tx);
  }

  return {
    mode: 'completed',
    requested: members.length,
    succeeded: deletedIds.length,
    failed: buildFailures(members, deletedIds),
    undoToken: undefined
  };
}

async function changeStatus(
  orgId: string,
  members: BulkAudienceMemberRow[],
  data: TBulkAudienceAction,
  actorProfileId: string,
  filterSnapshot: Record<string, unknown> | undefined,
  requested: number,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<BulkAudienceActionResult> {
  const action = data.action as Exclude<TAudienceBulkAction, 'delete'>;
  const status = ACTION_TO_STATUS[action];
  const memberIds = members.map((member) => member.id);

  const changedIds = await bulkUpdateOrganizationMemberStatus(orgId, memberIds, status, actorProfileId, tx);
  const changed = members.filter((member) => changedIds.includes(member.id));

  await recordOrganizationMemberAudit(orgId, buildAuditEntries(changed, data, actorProfileId, filterSnapshot), tx);

  if (action === 'deactivate' || action === 'archive') {
    const emails = changed.filter((member) => member.email).map((member) => member.email!.toLowerCase());

    if (emails.length > 0) {
      await revokeActiveOrganizationInvitesByEmails(orgId, emails, actorProfileId, tx);
    }
  }

  // Over the ids that changed, never the filter — the action moved who matches.
  const undoStatus = action === 'deactivate' || action === 'archive' ? UNDO_STATUS[action] : undefined;
  const undoToken =
    undoStatus && changedIds.length > 0
      ? issueUndoToken({
          orgId,
          actorProfileId,
          memberIds: changedIds,
          status: undoStatus,
          appliedStatus: status
        })
      : undefined;

  return {
    mode: 'completed',
    requested,
    succeeded: changedIds.length,
    failed: buildFailures(members, changedIds),
    undoToken
  };
}

/** Resolved but unchanged — usually already in the target state. Reported, not counted as success. */
function buildFailures(
  members: BulkAudienceMemberRow[],
  succeededIds: number[]
): { memberId: number; reason: string }[] {
  return members
    .filter((member) => !succeededIds.includes(member.id))
    .map((member) => ({ memberId: member.id, reason: 'ALREADY_IN_STATE' }));
}

function buildAuditEntries(
  members: BulkAudienceMemberRow[],
  data: TBulkAudienceAction,
  actorProfileId: string,
  filterSnapshot: Record<string, unknown> | undefined
): MemberAuditEntry[] {
  return members.map((member) => ({
    memberId: member.id,
    profileId: member.profileId,
    targetEmail: member.email,
    eventType: ACTION_TO_AUDIT_EVENT[data.action],
    actorProfileId,
    reason: data.reason,
    filterSnapshot
  }));
}

/** Applies the inverse status change to precisely the ids that succeeded. */
export async function undoBulkAudienceAction(
  orgId: string,
  undoToken: string,
  actorProfileId: string
): Promise<BulkAudienceActionResult> {
  const record = consumeUndoToken(undoToken, orgId, actorProfileId);

  return db.transaction(async (tx) => {
    const members = await getBulkAudienceMembersByIds(orgId, record.memberIds, tx);

    // Only members still in the state this action applied. Another admin may
    // have acted during the window, and that newer decision must win.
    const stillApplied = members.filter((member) => member.status === record.appliedStatus);
    const revertableIds = stillApplied.map((member) => member.id);

    const changedIds = await bulkUpdateOrganizationMemberStatus(
      orgId,
      revertableIds,
      record.status,
      actorProfileId,
      tx
    );
    const changed = stillApplied.filter((member) => changedIds.includes(member.id));

    await recordOrganizationMemberAudit(
      orgId,
      changed.map((member) => ({
        memberId: member.id,
        profileId: member.profileId,
        targetEmail: member.email,
        eventType: record.status === 'ACTIVE' ? ('REACTIVATED' as const) : ('DEACTIVATED' as const),
        actorProfileId,
        reason: 'Undo'
      })),
      tx
    );

    return {
      mode: 'completed' as const,
      requested: record.memberIds.length,
      succeeded: changedIds.length,
      // The token's ids, not the rows returned: a deleted member yields no row.
      failed: record.memberIds
        .filter((memberId) => !changedIds.includes(memberId))
        .map((memberId) => {
          const member = members.find((candidate) => candidate.id === memberId);

          if (!member) {
            return { memberId, reason: 'CHANGED_SINCE' };
          }

          return {
            memberId,
            reason: member.status === record.appliedStatus ? 'ALREADY_IN_STATE' : 'CHANGED_SINCE'
          };
        })
    };
  });
}
