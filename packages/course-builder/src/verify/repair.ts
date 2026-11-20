import { mapLimit } from '../util/map-limit';
import type { CheckIssue } from './types';

export const MAX_REPAIR_ROUNDS = 2;

export interface RepairOptions {
  issues: CheckIssue[];
  /** Rewrites one flagged item from its issues and the same sources. */
  repair(target: string, issues: CheckIssue[], round: number): Promise<void>;
  /** Runs the checks of one item again after it was rewritten. */
  recheck(target: string): Promise<CheckIssue[]>;
  maxRounds?: number;
  /** Items repaired at once; all of them when unset. */
  concurrency?: number;
}

export interface RepairOutcome {
  repaired: string[];
  /** Items still failing after the last round. The caller removes them and lists them in the build report. */
  removed: Array<{ target: string; reason: string }>;
}

function byTarget(issues: CheckIssue[]): Map<string, CheckIssue[]> {
  const grouped = new Map<string, CheckIssue[]>();
  for (const issue of issues) grouped.set(issue.target, [...(grouped.get(issue.target) ?? []), issue]);

  return grouped;
}

/**
 * Rewrites each flagged item and checks it again, up to `maxRounds` times. Items are repaired in parallel, `concurrency`
 * at a time; each item's rounds run in order. An item that still fails is reported for removal with its last reasons.
 */
export async function repairLoop(options: RepairOptions): Promise<RepairOutcome> {
  const maxRounds = options.maxRounds ?? MAX_REPAIR_ROUNDS;
  const flagged = [...byTarget(options.issues)];
  const outcomes = await mapLimit(flagged, options.concurrency ?? flagged.length, async ([target, initial]) => {
    let open = initial;

    for (let round = 1; round <= maxRounds && open.length; round += 1) {
      await options.repair(target, open, round);
      open = await options.recheck(target);
    }

    return { target, open };
  });

  return {
    repaired: outcomes.filter((outcome) => !outcome.open.length).map((outcome) => outcome.target),
    removed: outcomes
      .filter((outcome) => outcome.open.length)
      .map((outcome) => ({
        target: outcome.target,
        reason: outcome.open.map((issue) => `${issue.kind}: ${issue.reason}`).join('; ')
      }))
  };
}
