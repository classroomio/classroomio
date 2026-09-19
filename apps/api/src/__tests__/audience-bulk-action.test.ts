import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getBulkAudienceMembersByIds: vi.fn(),
  getAudienceMatchSample: vi.fn(),
  countAudienceMatchesNotArchived: vi.fn(),
  bulkUpdateOrganizationMemberStatus: vi.fn(),
  bulkDeleteOrganizationAudienceMembers: vi.fn(),
  deleteGroupMembershipsForOrgProfiles: vi.fn(),
  recordOrganizationMemberAudit: vi.fn(),
  resolveAudienceMemberIds: vi.fn(),
  revokeActiveOrganizationInvitesByEmails: vi.fn()
}));

vi.mock('@cio/jobs', () => ({
  QUEUE_NAMES: { audience: 'audience' },
  enqueueAudienceBulkAction: vi.fn(async () => 'job-1'),
  getQueue: vi.fn(),
  getQueueJobEnvelope: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({
  // The service owns one transaction at its boundary; the tests exercise the
  // logic inside it, so the transaction is a pass-through here.
  db: { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({})) }
}));

import {
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
import { enqueueAudienceBulkAction, getQueue, getQueueJobEnvelope } from '@cio/jobs';
import { runQueuedAudienceBulkAction } from '@cio/core/services/organization/audience-bulk';
import {
  applyBulkAudienceAction,
  computeTargetHash,
  getBulkAudienceActionStatus,
  previewBulkAudienceAction,
  undoBulkAudienceAction
} from '@api/services/organization/audience-bulk';

const ORG = 'org-1';
const ACTOR = 'actor-1';

type Member = { id: number; profileId: string | null; email: string | null; status: string };

function member(id: number, status: Member['status'] = 'ACTIVE'): Member {
  return { id, profileId: `profile-${id}`, email: `l${id}@test.dev`, status };
}

function filterTarget(memberIds: number[], overrides: Record<string, unknown> = {}) {
  return {
    mode: 'filter' as const,
    filter: { status: 'ACTIVE' as const, excludeRecentJoiners: true },
    expectedCount: memberIds.length,
    expectedTargetHash: computeTargetHash(memberIds),
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('computeTargetHash', () => {
  it('is independent of the order ids arrive in', () => {
    expect(computeTargetHash([3, 1, 2])).toBe(computeTargetHash([1, 2, 3]));
  });

  it('changes when the membership of the set changes', () => {
    expect(computeTargetHash([1, 2, 3])).not.toBe(computeTargetHash([1, 2, 4]));
  });

  it('distinguishes sets of the same size', () => {
    // The whole point: a matching count must not be taken as a matching target.
    const before = computeTargetHash([1, 2, 3]);
    const after = computeTargetHash([1, 2, 9]);

    expect(before).not.toBe(after);
  });
});

describe('applyBulkAudienceAction — filter mode drift', () => {
  it('rejects when the matched set changed identity but kept its size', async () => {
    // The admin reviewed {1,2,3}; by apply time learner 3 became active and 9 went dormant.
    const target = filterTarget([1, 2, 3]);
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue([1, 2, 9]);

    await expect(applyBulkAudienceAction(ORG, { target, action: 'archive' }, ACTOR)).rejects.toMatchObject({
      statusCode: 409,
      code: 'ORG_AUDIENCE_BULK_TARGET_CHANGED'
    });

    expect(bulkUpdateOrganizationMemberStatus).not.toHaveBeenCalled();
  });

  it('rejects when the matched count changed', async () => {
    const target = filterTarget([1, 2, 3]);
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue([1, 2]);

    await expect(applyBulkAudienceAction(ORG, { target, action: 'archive' }, ACTOR)).rejects.toMatchObject({
      statusCode: 409
    });
  });

  it('proceeds when the matched set is unchanged', async () => {
    const target = filterTarget([1, 2, 3]);
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue([1, 2, 3]);
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1), member(2), member(3)] as never);
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1, 2, 3]);

    const result = await applyBulkAudienceAction(ORG, { target, action: 'archive' }, ACTOR);

    expect(result).toMatchObject({ mode: 'completed', requested: 3, succeeded: 3 });
    expect(bulkUpdateOrganizationMemberStatus).toHaveBeenCalledWith(ORG, [1, 2, 3], 'ARCHIVED', ACTOR, {});
  });
});

describe('applyBulkAudienceAction — delete gate', () => {
  it('refuses to delete learners that are not archived', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1, 'ARCHIVED'), member(2, 'ACTIVE')] as never);

    await expect(
      applyBulkAudienceAction(ORG, { target: { mode: 'ids', memberIds: [1, 2] }, action: 'delete' }, ACTOR)
    ).rejects.toMatchObject({ statusCode: 409, code: 'ORG_AUDIENCE_DELETE_NOT_ARCHIVED' });

    expect(bulkDeleteOrganizationAudienceMembers).not.toHaveBeenCalled();
  });

  it('deletes when every member is archived, clearing enrolments and invites', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1, 'ARCHIVED'), member(2, 'ARCHIVED')] as never);
    vi.mocked(bulkDeleteOrganizationAudienceMembers).mockResolvedValue([1, 2]);

    const result = await applyBulkAudienceAction(
      ORG,
      { target: { mode: 'ids', memberIds: [1, 2] }, action: 'delete' },
      ACTOR
    );

    expect(result).toMatchObject({ mode: 'completed', succeeded: 2 });
    expect(deleteGroupMembershipsForOrgProfiles).toHaveBeenCalledWith(ORG, ['profile-1', 'profile-2'], {});
    expect(revokeActiveOrganizationInvitesByEmails).toHaveBeenCalled();
    // Audit rows are written before the delete, while the identities still exist.
    expect(recordOrganizationMemberAudit).toHaveBeenCalled();
  });

  it('offers no undo for a delete', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1, 'ARCHIVED')] as never);
    vi.mocked(bulkDeleteOrganizationAudienceMembers).mockResolvedValue([1]);

    const result = await applyBulkAudienceAction(
      ORG,
      { target: { mode: 'ids', memberIds: [1] }, action: 'delete' },
      ACTOR
    );

    expect(result).toMatchObject({ mode: 'completed' });
    expect('undoToken' in result ? result.undoToken : undefined).toBeUndefined();
  });
});

describe('applyBulkAudienceAction — reporting and undo', () => {
  it('reports members that were already in the target state as failures rather than successes', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1), member(2)] as never);
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1]);

    const result = await applyBulkAudienceAction(
      ORG,
      { target: { mode: 'ids', memberIds: [1, 2] }, action: 'deactivate' },
      ACTOR
    );

    expect(result).toMatchObject({
      mode: 'completed',
      requested: 2,
      succeeded: 1,
      failed: [{ memberId: 2, reason: 'ALREADY_IN_STATE' }]
    });
  });

  it('undoes exactly the ids that changed, not a re-run of the filter', async () => {
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue([1, 2, 3]);
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1), member(2), member(3)] as never);
    // Only two of the three actually changed.
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1, 3]);

    const applied = await applyBulkAudienceAction(ORG, { target: filterTarget([1, 2, 3]), action: 'archive' }, ACTOR);

    const token = applied.mode === 'completed' ? applied.undoToken : undefined;
    expect(token).toBeDefined();

    // By undo time those two are archived — which is what makes them revertable.
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1, 'ARCHIVED'), member(3, 'ARCHIVED')] as never);
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1, 3]);
    await undoBulkAudienceAction(ORG, token!, ACTOR);

    expect(bulkUpdateOrganizationMemberStatus).toHaveBeenLastCalledWith(ORG, [1, 3], 'ACTIVE', ACTOR, {});
    // The filter is never re-resolved during undo — it would match a different
    // population now that the action changed who is archived.
    expect(resolveAudienceMemberIds).toHaveBeenCalledTimes(1);
  });

  it('does not overturn a newer decision made by another admin', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1), member(2)] as never);
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1, 2]);

    const applied = await applyBulkAudienceAction(
      ORG,
      { target: { mode: 'ids', memberIds: [1, 2] }, action: 'deactivate' },
      ACTOR
    );
    const token = applied.mode === 'completed' ? applied.undoToken! : '';

    // Someone archived learner 2 during the undo window — a more deliberate
    // decision than the one being undone, so undo must leave them alone.
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([
      member(1, 'DEACTIVATED'),
      member(2, 'ARCHIVED')
    ] as never);
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1]);

    const result = await undoBulkAudienceAction(ORG, token, ACTOR);

    expect(bulkUpdateOrganizationMemberStatus).toHaveBeenLastCalledWith(ORG, [1], 'ACTIVE', ACTOR, {});
    expect(result).toMatchObject({
      succeeded: 1,
      failed: [{ memberId: 2, reason: 'CHANGED_SINCE' }]
    });
  });

  it('accounts for a member deleted during the undo window', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1), member(2)] as never);
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1, 2]);

    const applied = await applyBulkAudienceAction(
      ORG,
      { target: { mode: 'ids', memberIds: [1, 2] }, action: 'archive' },
      ACTOR
    );
    const token = applied.mode === 'completed' ? applied.undoToken! : '';

    // Learner 2 was deleted, so no row comes back for them at all.
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1, 'ARCHIVED')] as never);
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1]);

    const result = await undoBulkAudienceAction(ORG, token, ACTOR);

    // requested must equal succeeded + failed, or the summary is unexplainable.
    expect(result).toMatchObject({ requested: 2, succeeded: 1 });
    expect(result.mode === 'completed' && result.failed).toEqual([{ memberId: 2, reason: 'CHANGED_SINCE' }]);
  });

  it('burns the undo token so it cannot be replayed', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1)] as never);
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1]);

    const applied = await applyBulkAudienceAction(
      ORG,
      { target: { mode: 'ids', memberIds: [1] }, action: 'deactivate' },
      ACTOR
    );
    const token = applied.mode === 'completed' ? applied.undoToken! : '';

    await undoBulkAudienceAction(ORG, token, ACTOR);
    await expect(undoBulkAudienceAction(ORG, token, ACTOR)).rejects.toMatchObject({ statusCode: 410 });
  });

  it('refuses an undo token issued for a different organization', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1)] as never);
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockResolvedValue([1]);

    const applied = await applyBulkAudienceAction(
      ORG,
      { target: { mode: 'ids', memberIds: [1] }, action: 'archive' },
      ACTOR
    );
    const token = applied.mode === 'completed' ? applied.undoToken! : '';

    await expect(undoBulkAudienceAction('other-org', token, ACTOR)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('queues a batch larger than the synchronous ceiling instead of applying it inline', async () => {
    const many = Array.from({ length: 1001 }, (_, index) => member(index + 1));
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue(many as never);

    const result = await applyBulkAudienceAction(
      ORG,
      { target: { mode: 'ids', memberIds: many.map((candidate) => candidate.id) }, action: 'archive' },
      ACTOR
    );

    expect(result).toEqual({ mode: 'queued', jobId: 'job-1', requested: 1001 });
    // Nothing is written on the request thread.
    expect(bulkUpdateOrganizationMemberStatus).not.toHaveBeenCalled();
  });
});

describe('previewBulkAudienceAction — bounded work', () => {
  it('samples and counts with dedicated queries instead of loading the matched set', async () => {
    // A filter matching 20,000 learners must not pull 20,000 rows to show five.
    const matchedIds = Array.from({ length: 20_000 }, (_, index) => index + 1);
    const filter = { status: 'ACTIVE' } as never;
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue(matchedIds);
    vi.mocked(getAudienceMatchSample).mockResolvedValue([member(1), member(2)] as never);
    vi.mocked(countAudienceMatchesNotArchived).mockResolvedValue(19_998);

    const preview = await previewBulkAudienceAction(ORG, filter);

    expect(preview.count).toBe(20_000);
    expect(preview.sample).toHaveLength(2);
    expect(preview.notArchivedCount).toBe(19_998);
    // The full-row loader is never reached on this path.
    expect(getBulkAudienceMembersByIds).not.toHaveBeenCalled();
    expect(getAudienceMatchSample).toHaveBeenCalledWith(ORG, filter, 5);
  });

  it('hashes the whole matched set, not just the sample', async () => {
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue([1, 2, 3]);
    vi.mocked(getAudienceMatchSample).mockResolvedValue([member(1)] as never);
    vi.mocked(countAudienceMatchesNotArchived).mockResolvedValue(0);

    const preview = await previewBulkAudienceAction(ORG, { status: 'ACTIVE' } as never);

    expect(preview.targetHash).toBe(computeTargetHash([1, 2, 3]));
  });
});

describe('applyBulkAudienceAction — the queued path', () => {
  it('hands an oversized filter match to the queue without fetching its members', async () => {
    const many = Array.from({ length: 5_000 }, (_, index) => index + 1);
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue(many);

    const result = await applyBulkAudienceAction(ORG, { target: filterTarget(many), action: 'archive' }, ACTOR);

    expect(result).toEqual({ mode: 'queued', jobId: 'job-1', requested: 5_000 });
    // No 5,000-id IN clause is issued on the request thread.
    expect(getBulkAudienceMembersByIds).not.toHaveBeenCalled();
  });

  it('enqueues the resolved ids, not the filter', async () => {
    // Re-running the filter in the worker would hit a different population,
    // because the action itself changes who matches it.
    const many = Array.from({ length: 1_500 }, (_, index) => index + 1);
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue(many);

    await applyBulkAudienceAction(
      ORG,
      { target: filterTarget(many), action: 'deactivate', reason: 'Offboarding' },
      ACTOR
    );

    expect(enqueueAudienceBulkAction).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG,
        actorProfileId: ACTOR,
        action: 'deactivate',
        memberIds: many,
        reason: 'Offboarding',
        filterSnapshot: { status: 'ACTIVE', excludeRecentJoiners: true }
      })
    );
  });

  it('offers no undo token for a queued action', async () => {
    const many = Array.from({ length: 1_500 }, (_, index) => index + 1);
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue(many);

    const result = await applyBulkAudienceAction(ORG, { target: filterTarget(many), action: 'archive' }, ACTOR);

    expect(result).not.toHaveProperty('undoToken');
  });

  it('fails loudly when the queue will not accept the job', async () => {
    const many = Array.from({ length: 1_500 }, (_, index) => index + 1);
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue(many);
    vi.mocked(enqueueAudienceBulkAction).mockResolvedValueOnce(undefined);

    await expect(
      applyBulkAudienceAction(ORG, { target: filterTarget(many), action: 'archive' }, ACTOR)
    ).rejects.toMatchObject({ statusCode: 500 });
  });

  it('still verifies the preview hash before queueing', async () => {
    const many = Array.from({ length: 1_500 }, (_, index) => index + 1);
    vi.mocked(resolveAudienceMemberIds).mockResolvedValue(many);

    await expect(
      applyBulkAudienceAction(
        ORG,
        { target: filterTarget(many, { expectedTargetHash: computeTargetHash([1, 2]) }), action: 'archive' },
        ACTOR
      )
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(enqueueAudienceBulkAction).not.toHaveBeenCalled();
  });
});

describe('runQueuedAudienceBulkAction', () => {
  it('applies the whole target in chunked transactions and folds the results', async () => {
    const memberIds = Array.from({ length: 250 }, (_, index) => index + 1);
    vi.mocked(getBulkAudienceMembersByIds).mockImplementation(
      async (_orgId, ids) => ids.map((id) => member(id)) as never
    );
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockImplementation(async (_orgId, ids) => ids as never);

    const outcome = await runQueuedAudienceBulkAction({
      organizationId: ORG,
      actorProfileId: ACTOR,
      action: 'archive',
      memberIds,
      chunkSize: 100
    });

    expect(outcome).toMatchObject({ requested: 250, succeeded: 250, failed: [] });
    // 100 + 100 + 50 — one transaction each, so no single statement holds 250 rows.
    expect(vi.mocked(getBulkAudienceMembersByIds).mock.calls.map((call) => call[1].length)).toEqual([100, 100, 50]);
  });

  it('records a failing chunk against its members and finishes the rest', async () => {
    const memberIds = [1, 2, 3, 4];
    vi.mocked(getBulkAudienceMembersByIds).mockImplementation(async (_orgId, ids) => {
      if (ids.includes(3)) throw new Error('deadlock detected');

      return ids.map((id) => member(id)) as never;
    });
    vi.mocked(bulkUpdateOrganizationMemberStatus).mockImplementation(async (_orgId, ids) => ids as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const outcome = await runQueuedAudienceBulkAction({
      organizationId: ORG,
      actorProfileId: ACTOR,
      action: 'archive',
      memberIds,
      chunkSize: 2
    });

    expect(outcome.succeeded).toBe(2);
    expect(outcome.failed).toEqual([
      { memberId: 3, reason: 'CHUNK_FAILED' },
      { memberId: 4, reason: 'CHUNK_FAILED' }
    ]);
  });

  it('refuses to delete a chunk holding a learner that is not archived', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1, 'ARCHIVED'), member(2, 'ACTIVE')] as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const outcome = await runQueuedAudienceBulkAction({
      organizationId: ORG,
      actorProfileId: ACTOR,
      action: 'delete',
      memberIds: [1, 2],
      chunkSize: 100
    });

    expect(outcome.succeeded).toBe(0);
    expect(outcome.failed).toEqual([
      { memberId: 1, reason: 'DELETE_NOT_ARCHIVED' },
      { memberId: 2, reason: 'DELETE_NOT_ARCHIVED' }
    ]);
    expect(bulkDeleteOrganizationAudienceMembers).not.toHaveBeenCalled();
  });
});

describe('getBulkAudienceActionStatus', () => {
  function queueHolding(job: unknown) {
    return { getJob: vi.fn(async () => job) } as never;
  }

  it('returns the envelope for a job enqueued by this organization', async () => {
    vi.mocked(getQueue).mockReturnValue(queueHolding({ id: 'job-1', data: { organizationId: ORG } }));
    vi.mocked(getQueueJobEnvelope).mockResolvedValue({
      job: { id: 'job-1', status: 'running' },
      events: [],
      nextPollMs: 2_000
    } as never);

    const envelope = await getBulkAudienceActionStatus(ORG, 'job-1');

    expect(envelope.job.status).toBe('running');
  });

  it('hides a job belonging to another organization behind the same 404 as a missing one', async () => {
    // Job ids are guessable integers, so the payload's org is the only thing
    // standing between an admin and another tenant's run.
    vi.mocked(getQueue).mockReturnValue(queueHolding({ id: 'job-1', data: { organizationId: 'other-org' } }));

    await expect(getBulkAudienceActionStatus(ORG, 'job-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(getQueueJobEnvelope).not.toHaveBeenCalled();
  });

  it('404s once retention has swept the job', async () => {
    vi.mocked(getQueue).mockReturnValue(queueHolding(undefined));

    await expect(getBulkAudienceActionStatus(ORG, 'job-1')).rejects.toMatchObject({ statusCode: 404 });
  });
});
