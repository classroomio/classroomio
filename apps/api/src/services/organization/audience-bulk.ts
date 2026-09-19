import { createHash, randomUUID } from 'node:crypto';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { AUDIENCE_BULK_SYNC_MAX } from '@cio/utils/validation/organization';
import {
  AudienceBulkError,
  type BulkApplyOutcome,
  applyAudienceBulkActionToMembers
} from '@cio/core/services/organization/audience-bulk';
import { db } from '@cio/db/drizzle';
import { QUEUE_NAMES, enqueueAudienceBulkAction, getQueue, getQueueJobEnvelope, type JobEnvelope } from '@cio/jobs';
import {
  type OrganizationMemberStatus,
  bulkUpdateOrganizationMemberStatus,
  countAudienceMatchesNotArchived,
  getAudienceMatchSample,
  getBulkAudienceMembersByIds,
  recordOrganizationMemberAudit,
  resolveAudienceMemberIds
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

/** The inverse each reversible action undoes to. `delete` has none. */
const UNDO_STATUS: Record<
  Exclude<TAudienceBulkAction, 'delete' | 'reactivate' | 'unarchive'>,
  OrganizationMemberStatus
> = {
  deactivate: 'ACTIVE',
  archive: 'ACTIVE'
};

/** The applier's codes, mapped to HTTP once, here at the API boundary. */
function toAppError(error: unknown): unknown {
  if (!(error instanceof AudienceBulkError)) return error;

  if (error.code === 'DELETE_NOT_ARCHIVED') {
    return new AppError(error.message, ErrorCodes.ORG_AUDIENCE_DELETE_NOT_ARCHIVED, 409);
  }

  return new AppError(error.message, ErrorCodes.ORG_AUDIENCE_BULK_FAILED, 404);
}

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

/**
 * Resolves the target to member ids. Filter mode reuses the list's
 * `whereClause` builder, then re-checks the previewed count and hash.
 *
 * Ids only, and outside any write transaction, so an oversized target can be
 * handed to the queue without holding one open.
 */
async function resolveTargetIds(orgId: string, data: TBulkAudienceAction): Promise<number[]> {
  if (data.target.mode === 'ids') {
    const members = await getBulkAudienceMembersByIds(orgId, data.target.memberIds);
    return members.map((member) => member.id);
  }

  const matchedIds = await resolveAudienceMemberIds(orgId, data.target.filter);
  const actualHash = computeTargetHash(matchedIds);

  if (matchedIds.length !== data.target.expectedCount || actualHash !== data.target.expectedTargetHash) {
    throw new AppError(
      `These filters now match ${matchedIds.length} learners, not ${data.target.expectedCount}. Review the list again before applying.`,
      ErrorCodes.ORG_AUDIENCE_BULK_TARGET_CHANGED,
      409
    );
  }

  return matchedIds;
}

/** An applier outcome, plus an undo token when the action is reversible. */
function toCompletedResult(
  orgId: string,
  actorProfileId: string,
  action: TAudienceBulkAction,
  outcome: BulkApplyOutcome
): Extract<BulkAudienceActionResult, { mode: 'completed' }> {
  const undoStatus = action === 'deactivate' || action === 'archive' ? UNDO_STATUS[action] : undefined;

  // Over the ids that changed, never the filter — the action moved who matches.
  const undoToken =
    undoStatus && outcome.appliedStatus && outcome.changedIds.length > 0
      ? issueUndoToken({
          orgId,
          actorProfileId,
          memberIds: outcome.changedIds,
          status: undoStatus,
          appliedStatus: outcome.appliedStatus
        })
      : undefined;

  return {
    mode: 'completed',
    requested: outcome.requested,
    succeeded: outcome.succeeded,
    failed: outcome.failed,
    undoToken
  };
}

/** Members per transaction on the queued path. */
const QUEUED_CHUNK_SIZE = 200;

/**
 * Applies a lifecycle action, synchronously up to `AUDIENCE_BULK_SYNC_MAX` and
 * on the queue above it. The queued path returns a job id to poll; its terminal
 * payload is the same `completed` shape, so the client renders one summary.
 */
export async function applyBulkAudienceAction(
  orgId: string,
  data: TBulkAudienceAction,
  actorProfileId: string
): Promise<BulkAudienceActionResult> {
  const memberIds = await resolveTargetIds(orgId, data);

  if (memberIds.length === 0) {
    throw new AppError('No matching learners to act on', ErrorCodes.ORG_AUDIENCE_BULK_FAILED, 404);
  }

  const filterSnapshot = data.target.mode === 'filter' ? { ...data.target.filter } : undefined;

  if (memberIds.length > AUDIENCE_BULK_SYNC_MAX) {
    // Ids, not the filter: the target was verified against the admin's preview
    // hash just now, and re-resolving in the worker would hit a different
    // population because the action changes who matches.
    const jobId = await enqueueAudienceBulkAction({
      organizationId: orgId,
      actorProfileId,
      action: data.action,
      memberIds,
      reason: data.reason,
      filterSnapshot,
      chunkSize: QUEUED_CHUNK_SIZE
    });

    if (!jobId) {
      throw new AppError('Could not queue this action', ErrorCodes.ORG_AUDIENCE_BULK_FAILED, 500);
    }

    return { mode: 'queued', jobId, requested: memberIds.length };
  }

  try {
    const outcome = await applyAudienceBulkActionToMembers(
      orgId,
      memberIds,
      { action: data.action, reason: data.reason, filterSnapshot },
      actorProfileId
    );

    return toCompletedResult(orgId, actorProfileId, data.action, outcome);
  } catch (error) {
    throw toAppError(error);
  }
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

const AUDIENCE_BULK_DOMAIN = 'audience-bulk-action';

/**
 * Status of a queued bulk action, as the same `JobEnvelope` the notify flow
 * polls. The job's own payload carries the organization it was enqueued for,
 * so an admin of one org cannot read another org's run by guessing an id.
 */
export async function getBulkAudienceActionStatus(orgId: string, jobId: string, pollCount = 0): Promise<JobEnvelope> {
  const job = await getQueue(QUEUE_NAMES.audience).getJob(jobId);
  const payloadOrgId = (job?.data as { organizationId?: string } | undefined)?.organizationId;

  if (!job || payloadOrgId !== orgId) {
    throw new AppError('Bulk action not found', ErrorCodes.NOT_FOUND, 404);
  }

  const envelope = await getQueueJobEnvelope(QUEUE_NAMES.audience, jobId, AUDIENCE_BULK_DOMAIN, pollCount);

  if (!envelope) {
    throw new AppError('Bulk action not found', ErrorCodes.NOT_FOUND, 404);
  }

  return envelope;
}
