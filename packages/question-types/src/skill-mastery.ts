export const SKILL_MASTERY_LEVELS = ['not_started', 'learning', 'proficient', 'mastered'] as const;

export type SkillMasteryLevel = (typeof SKILL_MASTERY_LEVELS)[number];

export const SKILL_MASTERY_CONFIG = {
  recentAttempts: 10,
  decay: 0.8,
  minEvidence: 3,
  masteredMinEvidence: 5,
  proficientAt: 60,
  masteredAt: 85
} as const;

export type SkillMasteryConfig = {
  recentAttempts: number;
  decay: number;
  minEvidence: number;
  masteredMinEvidence: number;
  proficientAt: number;
  masteredAt: number;
};

export type SkillAttempt = {
  /** Share of the question's points the student earned, from 0 to 1. */
  ratio: number;
  attemptedAt: string | number | Date;
};

export type SkillMastery = {
  level: SkillMasteryLevel;
  /** Weighted percentage from 0 to 100, or null when there is no evidence. */
  score: number | null;
  evidenceCount: number;
};

function toTime(value: SkillAttempt['attemptedAt']): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/**
 * The mastery level for a score and the number of attempts behind it. Fewer than `minEvidence` attempts never
 * rate above learning, and mastered needs `masteredMinEvidence` attempts.
 */
export function masteryLevelFor(
  score: number | null,
  evidenceCount: number,
  config: SkillMasteryConfig = SKILL_MASTERY_CONFIG
): SkillMasteryLevel {
  if (evidenceCount === 0 || score === null) return 'not_started';
  if (evidenceCount < config.minEvidence) return 'learning';
  if (score >= config.masteredAt && evidenceCount >= config.masteredMinEvidence) return 'mastered';
  if (score >= config.proficientAt) return 'proficient';

  return 'learning';
}

/**
 * Mastery of one skill for one student from the attempts on questions tagged with it. Takes the newest
 * `recentAttempts` attempts and weights the newest at 1, the next at `decay`, then `decay` squared, and so on;
 * the score is the weighted share of points earned. The same weights are used by the `skill_mastery` analytics
 * metric in SQL.
 */
export function computeSkillMastery(
  attempts: readonly SkillAttempt[],
  config: SkillMasteryConfig = SKILL_MASTERY_CONFIG
): SkillMastery {
  const recent = attempts
    .map((attempt, index) => ({ ...attempt, index, time: toTime(attempt.attemptedAt) }))
    .sort((left, right) => right.time - left.time || right.index - left.index)
    .slice(0, config.recentAttempts);

  if (recent.length === 0) return { level: 'not_started', score: null, evidenceCount: 0 };

  let weightedRatio = 0;
  let totalWeight = 0;
  recent.forEach((attempt, position) => {
    const weight = config.decay ** position;
    const ratio = Math.min(1, Math.max(0, attempt.ratio));
    weightedRatio += ratio * weight;
    totalWeight += weight;
  });

  const score = Math.round((weightedRatio / totalWeight) * 1000) / 10;

  return { level: masteryLevelFor(score, recent.length, config), score, evidenceCount: recent.length };
}
