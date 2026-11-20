import type { AddMembersSummary } from './types';

/** Outcome counts shared by the inline add-members response and a finished bulk job. */
interface AddMembersCounts {
  enrolled?: number;
  invited?: number;
  failed?: unknown[];
  skippedStaffInviteEmails?: string[];
  members?: unknown[];
}

/**
 * Reduces an add-members result (inline or a finished bulk job) to what the
 * snackbar shows. Failures and emails skipped for an existing staff invite
 * both count as "not added" so a partial add never reads as full success.
 */
export function summarizeAddMembersCounts(counts: AddMembersCounts): Exclude<AddMembersSummary, { kind: 'queued' }> {
  const added = counts.enrolled ?? counts.members?.length ?? 0;
  const invited = counts.invited ?? 0;
  const notAdded = (counts.failed?.length ?? 0) + (counts.skippedStaffInviteEmails?.length ?? 0);

  if (notAdded > 0) {
    return { kind: 'partial', added, invited, notAdded };
  }

  return { kind: 'added', added, invited };
}

/** Summarizes the add-members response: queued runs are tracked by job id. */
export function summarizeAddMembersResult(
  data: { mode: 'queued'; jobId: string; requested: number } | ({ mode: 'completed' } & AddMembersCounts)
): AddMembersSummary {
  if (data.mode === 'queued') {
    return { kind: 'queued', jobId: data.jobId, requested: data.requested };
  }

  return summarizeAddMembersCounts(data);
}
