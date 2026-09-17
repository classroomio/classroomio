import { type DbOrTxClient, db } from '@cio/db/drizzle';
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
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import type { TAudienceBulkAction } from '@cio/utils/validation/organization';

/**
 * The applier, shared by the API's synchronous path and the queue worker.
 *
 * It lives here rather than in `@cio/api` because `@cio/api` already imports
 * `@cio/jobs`, so a worker importing the API would close a package cycle.
 * Duplicating destructive logic — the delete gate, the audit rows, invite
 * revocation — was the alternative, and a worse one.
 */

/** Carries a code so the API can map it to an `AppError` without string matching. */
export class AudienceBulkError extends Error {
  constructor(
    readonly code: 'NO_MATCHING_MEMBERS' | 'DELETE_NOT_ARCHIVED',
    message: string,
    readonly meta: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'AudienceBulkError';
  }
}

export type BulkApplyOutcome = {
  requested: number;
  succeeded: number;
  failed: { memberId: number; reason: string }[];
  /** The ids that actually changed, for the undo token. */
  changedIds: number[];
  /** The status applied, so undo can skip members changed since. */
  appliedStatus?: OrganizationMemberStatus;
};

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

export type BulkApplyInput = {
  action: TAudienceBulkAction;
  reason?: string;
  filterSnapshot?: Record<string, unknown>;
};

/** Resolved but unchanged — usually already in the target state. */
function buildFailures(members: BulkAudienceMemberRow[], succeededIds: number[]) {
  return members
    .filter((member) => !succeededIds.includes(member.id))
    .map((member) => ({ memberId: member.id, reason: 'ALREADY_IN_STATE' }));
}

function buildAuditEntries(
  members: BulkAudienceMemberRow[],
  input: BulkApplyInput,
  actorProfileId: string
): MemberAuditEntry[] {
  return members.map((member) => ({
    memberId: member.id,
    profileId: member.profileId,
    targetEmail: member.email,
    eventType: ACTION_TO_AUDIT_EVENT[input.action],
    actorProfileId,
    reason: input.reason,
    filterSnapshot: input.filterSnapshot
  }));
}

/**
 * Permanent removal. Every resolved member must already be ARCHIVED; the UI's
 * type-to-confirm sits on top of this gate, never in place of it.
 */
async function deleteMembers(
  orgId: string,
  members: BulkAudienceMemberRow[],
  input: BulkApplyInput,
  actorProfileId: string,
  tx: DbOrTxClient
): Promise<BulkApplyOutcome> {
  const notArchived = members.filter((member) => member.status !== 'ARCHIVED');

  if (notArchived.length > 0) {
    throw new AudienceBulkError(
      'DELETE_NOT_ARCHIVED',
      `${notArchived.length} of these learners are not archived. Archive them first — deleting is only available for archived learners.`,
      { notArchivedCount: notArchived.length }
    );
  }

  const memberIds = members.map((member) => member.id);
  const profileIds = members.map((member) => member.profileId).filter((id): id is string => Boolean(id));

  // Before the delete, while the identities still exist.
  await recordOrganizationMemberAudit(orgId, buildAuditEntries(members, input, actorProfileId), tx);

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
    requested: members.length,
    succeeded: deletedIds.length,
    failed: buildFailures(members, deletedIds),
    changedIds: deletedIds
  };
}

async function changeStatus(
  orgId: string,
  members: BulkAudienceMemberRow[],
  input: BulkApplyInput,
  actorProfileId: string,
  tx: DbOrTxClient
): Promise<BulkApplyOutcome> {
  const action = input.action as Exclude<TAudienceBulkAction, 'delete'>;
  const status = ACTION_TO_STATUS[action];
  const memberIds = members.map((member) => member.id);

  const changedIds = await bulkUpdateOrganizationMemberStatus(orgId, memberIds, status, actorProfileId, tx);
  const changed = members.filter((member) => changedIds.includes(member.id));

  await recordOrganizationMemberAudit(orgId, buildAuditEntries(changed, input, actorProfileId), tx);

  if (action === 'deactivate' || action === 'archive') {
    const emails = changed.filter((member) => member.email).map((member) => member.email!.toLowerCase());

    if (emails.length > 0) {
      await revokeActiveOrganizationInvitesByEmails(orgId, emails, actorProfileId, tx);
    }
  }

  return {
    requested: members.length,
    succeeded: changedIds.length,
    failed: buildFailures(members, changedIds),
    changedIds,
    appliedStatus: status
  };
}

/** Applies the action to one batch, in one transaction. */
export async function applyAudienceBulkActionToMembers(
  orgId: string,
  memberIds: number[],
  input: BulkApplyInput,
  actorProfileId: string
): Promise<BulkApplyOutcome> {
  return db.transaction(async (tx) => {
    const members = await getBulkAudienceMembersByIds(orgId, memberIds, tx);

    if (members.length === 0) {
      throw new AudienceBulkError('NO_MATCHING_MEMBERS', 'No matching learners to act on');
    }

    if (input.action === 'delete') {
      return deleteMembers(orgId, members, input, actorProfileId, tx);
    }

    return changeStatus(orgId, members, input, actorProfileId, tx);
  });
}

/**
 * Runs a queued action in chunks, each its own transaction, folding the
 * per-chunk results into one outcome.
 *
 * A chunk that throws is recorded against its members rather than aborting the
 * run: across 12,000 learners, failing the whole job over one bad chunk would
 * leave the admin unable to tell what happened to the rest.
 */
export async function runQueuedAudienceBulkAction(payload: {
  organizationId: string;
  actorProfileId: string;
  action: TAudienceBulkAction;
  memberIds: number[];
  reason?: string;
  filterSnapshot?: Record<string, unknown>;
  chunkSize: number;
}): Promise<BulkApplyOutcome> {
  const { organizationId, actorProfileId, action, memberIds, reason, filterSnapshot, chunkSize } = payload;

  let succeeded = 0;
  const failed: { memberId: number; reason: string }[] = [];
  const changedIds: number[] = [];

  for (let index = 0; index < memberIds.length; index += chunkSize) {
    const chunk = memberIds.slice(index, index + chunkSize);

    try {
      const outcome = await applyAudienceBulkActionToMembers(
        organizationId,
        chunk,
        { action, reason, filterSnapshot },
        actorProfileId
      );

      succeeded += outcome.succeeded;
      failed.push(...outcome.failed);
      changedIds.push(...outcome.changedIds);
    } catch (error) {
      console.error('runQueuedAudienceBulkAction chunk failed:', error);
      const reasonCode = error instanceof AudienceBulkError ? error.code : 'CHUNK_FAILED';

      for (const memberId of chunk) {
        failed.push({ memberId, reason: reasonCode });
      }
    }
  }

  return { requested: memberIds.length, succeeded, failed, changedIds };
}
