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
  deleteGroupMembershipsForOrgProfiles,
  getBulkAudienceMembersByIds,
  recordOrganizationMemberAudit,
  resolveAudienceMemberIds,
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import type { TAudienceBulkAction, TBulkAudienceAction } from '@cio/utils/validation/organization';

/**
 * One contract for both paths, so the client branches on `mode` rather than
 * guessing from a status code. The queued path's terminal payload is the same
 * `completed` shape, so the UI renders one partial-failure summary either way.
 */
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
 * Checksum over the ordered member ids a preview was computed from.
 *
 * A matching count does not prove a matching target: if one learner logs in and
 * another goes dormant between preview and apply, the count is identical while
 * the set is not. This is what turns that silent substitution into a 409.
 */
export function computeTargetHash(memberIds: number[]): string {
  return createHash('sha256')
    .update([...memberIds].sort((a, b) => a - b).join(','))
    .digest('hex');
}

export type BulkAudiencePreview = {
  /** Exact, never approximate: this is what the admin approves and what the apply re-checks. */
  count: number;
  targetHash: string;
  /** A handful of affected learners, so the dialog can show who this hits. */
  sample: { id: number; name: string; email: string }[];
  /** How many of the matched set are not archived — the delete gate, surfaced early. */
  notArchivedCount: number;
};

/**
 * Computes what a filter-mode action would affect, including the hash the apply
 * step verifies. Kept exact even when the list's own count is approximated: an
 * approximate `expectedCount` would either understate the blast radius the
 * admin approved, or 409 a legitimate action.
 */
export async function previewBulkAudienceAction(
  orgId: string,
  filter: Parameters<typeof resolveAudienceMemberIds>[1]
): Promise<BulkAudiencePreview> {
  const matchedIds = await resolveAudienceMemberIds(orgId, filter);
  // One pass over the matched set: the sample and the archive gate both come
  // from it, so a large match is not fetched twice.
  const members = await getBulkAudienceMembersByIds(orgId, matchedIds);

  return {
    count: matchedIds.length,
    targetHash: computeTargetHash(matchedIds),
    sample: members.slice(0, 5).map((member) => ({
      id: member.id,
      name: member.email?.split('@')[0] ?? String(member.id),
      email: member.email ?? ''
    })),
    notArchivedCount: members.filter((member) => member.status !== 'ARCHIVED').length
  };
}

type UndoRecord = {
  orgId: string;
  actorProfileId: string;
  memberIds: number[];
  status: OrganizationMemberStatus;
  expiresAt: number;
};

/**
 * Single-use undo tokens, held in memory.
 *
 * In-memory is a deliberate limitation, not an oversight: an undo that silently
 * fails after a deploy or on another instance is worse than one the UI never
 * offered. Callers must treat a missing token as expired. Moving this to Redis
 * is the obvious upgrade when the API runs multi-instance.
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

  // Single use: burn it before doing anything, so a double-click cannot apply twice.
  undoTokens.delete(token);

  if (!record || record.expiresAt < Date.now()) {
    throw new AppError('This undo has expired', ErrorCodes.ORG_AUDIENCE_BULK_FAILED, 410);
  }

  // Scoped to the actor and org that created it, so a leaked token is inert elsewhere.
  if (record.orgId !== orgId || record.actorProfileId !== actorProfileId) {
    throw new AppError('This undo is not available', ErrorCodes.ORG_AUDIENCE_BULK_FAILED, 403);
  }

  return record;
}

/**
 * Resolves the target inside the caller's transaction.
 *
 * For `filter` mode this runs the same `whereClause` builder the list uses, so
 * preview and apply cannot diverge, and re-checks both the count and the hash
 * the admin was shown.
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

  return getBulkAudienceMembersByIds(orgId, matchedIds, tx);
}

/**
 * Applies a lifecycle action to a set of learners.
 *
 * Everything happens in one transaction owned here: target resolution,
 * authorization, the writes, invite revocation and the audit rows. Side effects
 * that cannot be rolled back are deferred until after it commits.
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

    // The threshold is checked on the resolved target rather than the request,
    // so filter mode cannot slip past it by naming no ids.
    if (members.length > AUDIENCE_BULK_SYNC_MAX) {
      throw new AppError(
        `This action affects ${members.length} learners, which exceeds the ${AUDIENCE_BULK_SYNC_MAX} that can be applied in one request.`,
        ErrorCodes.ORG_AUDIENCE_BULK_FAILED,
        413
      );
    }

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
 * Permanent removal, gated on the server.
 *
 * Every resolved member must already be ARCHIVED. Type-to-confirm in the UI
 * sits on top of this and never in place of it — otherwise the client could
 * permit a deletion the service refuses, or worse, let typed confirmation stand
 * in for the archive requirement.
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

  // Audit rows are written before the delete so they capture the identity of
  // members that are about to stop existing.
  await recordOrganizationMemberAudit(orgId, buildAuditEntries(members, data, actorProfileId, filterSnapshot), tx);

  if (profileIds.length > 0) {
    await deleteGroupMembershipsForOrgProfiles(orgId, profileIds, tx);
  }

  const deletedIds = await bulkDeleteOrganizationAudienceMembers(orgId, memberIds, tx);

  const emails = members
    .filter((member) => deletedIds.includes(member.id) && member.email)
    .map((member) => member.email!.toLowerCase());

  if (emails.length > 0) {
    await revokeActiveOrganizationInvitesByEmails(orgId, emails, actorProfileId);
  }

  return {
    mode: 'completed',
    requested: members.length,
    succeeded: deletedIds.length,
    failed: buildFailures(members, deletedIds),
    // Removal is not reversible, so no token is issued and the dialog says so.
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

  // Losing access should also close the door on a pending invite.
  if (action === 'deactivate' || action === 'archive') {
    const emails = changed.filter((member) => member.email).map((member) => member.email!.toLowerCase());

    if (emails.length > 0) {
      await revokeActiveOrganizationInvitesByEmails(orgId, emails, actorProfileId);
    }
  }

  // Undo replays the exact ids that changed, never the filter: re-running the
  // filter would hit a different population, because the action just changed
  // who matches it.
  const undoStatus = action === 'deactivate' || action === 'archive' ? UNDO_STATUS[action] : undefined;
  const undoToken =
    undoStatus && changedIds.length > 0
      ? issueUndoToken({ orgId, actorProfileId, memberIds: changedIds, status: undoStatus })
      : undefined;

  return {
    mode: 'completed',
    requested,
    succeeded: changedIds.length,
    failed: buildFailures(members, changedIds),
    undoToken
  };
}

/**
 * Members that resolved but did not change. Almost always because they were
 * already in the target state, which is reported rather than silently counted
 * as success.
 */
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
    const changedIds = await bulkUpdateOrganizationMemberStatus(
      orgId,
      record.memberIds,
      record.status,
      actorProfileId,
      tx
    );
    const changed = members.filter((member) => changedIds.includes(member.id));

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
      failed: buildFailures(members, changedIds)
    };
  });
}
