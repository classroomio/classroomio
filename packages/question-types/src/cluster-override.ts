import type { AnswerClusterOverride } from './answer-data';
import { roundPoints } from './points';

export type ClusterVerdict = 'correct' | 'partial' | 'wrong';

/**
 * A teacher's decision about every answer that normalises to `key`. Rules live in `question.settings.clusterOverrides`
 * so they apply to later submissions too and can be removed to undo the decision. A rule without a verdict only
 * attaches `feedback`.
 */
export type ClusterOverrideRule = {
  key: string;
  /** The answer as the teacher saw it, kept so the rule stays readable if the answers are later deleted. */
  label: string;
  verdict?: ClusterVerdict;
  /** Points a `partial` verdict awards. */
  points?: number;
  feedback?: string;
  setBy: string;
  setAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The cluster rules stored in a question's settings; malformed entries are dropped. */
export function readClusterOverrides(settings: unknown): ClusterOverrideRule[] {
  const raw = isRecord(settings) ? settings.clusterOverrides : undefined;
  if (!Array.isArray(raw)) return [];

  return raw.filter(
    (rule): rule is ClusterOverrideRule =>
      isRecord(rule) && typeof rule.key === 'string' && typeof rule.setBy === 'string' && typeof rule.setAt === 'string'
  );
}

/** Returns the settings with `rule` added, replacing any rule that has the same key. */
export function withClusterOverride(
  settings: Record<string, unknown> | null | undefined,
  rule: ClusterOverrideRule
): Record<string, unknown> {
  const others = readClusterOverrides(settings).filter((existing) => existing.key !== rule.key);

  return { ...(settings ?? {}), clusterOverrides: [...others, rule] };
}

/** Returns the settings without the rule for `key`; the field is dropped when no rule is left. */
export function withoutClusterOverride(
  settings: Record<string, unknown> | null | undefined,
  key: string
): Record<string, unknown> {
  const { clusterOverrides: _previous, ...rest } = settings ?? {};
  const remaining = readClusterOverrides(settings).filter((existing) => existing.key !== key);

  return remaining.length > 0 ? { ...rest, clusterOverrides: remaining } : rest;
}

/** What a rule stamps onto one answer. */
export function toAnswerClusterOverride(rule: ClusterOverrideRule): AnswerClusterOverride {
  const { verdict, points, feedback, key, setBy, setAt } = rule;

  return { key, verdict, points, feedback, setBy, setAt };
}

/** Points an answer earns under its stamped verdict, or null when the stamp only carries feedback. */
export function resolveClusterOverridePoints(override: AnswerClusterOverride, maxPoints: number): number | null {
  if (override.verdict === 'correct') return maxPoints;
  if (override.verdict === 'wrong') return 0;
  if (override.verdict !== 'partial') return null;

  return roundPoints(Math.min(Math.max(0, override.points ?? 0), maxPoints));
}
