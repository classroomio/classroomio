export const DISCRIMINATION_GROUP_SHARE = 0.27;

export type ItemResponse = {
  /** Share of the question's points the student earned, from 0 to 1. */
  ratio: number;
  /** Share of the exercise's points the same student earned, from 0 to 1. */
  totalRatio: number;
};

export type DiscriminationGroup = 'upper' | 'lower' | null;

/**
 * Share of students who earned full points on the question, as a percentage from 0 to 100, or null for no responses.
 */
export function computeFacility(responses: readonly Pick<ItemResponse, 'ratio'>[]): number | null {
  if (responses.length === 0) return null;

  const correct = responses.filter((response) => response.ratio >= 1).length;

  return Math.round((correct / responses.length) * 1000) / 10;
}

/**
 * Splits students into the upper and lower 27% by total score. A student is upper when at most 27% of students
 * score at or above them, lower when at most 27% score at or below them, so tied scores always share a group.
 */
export function assignDiscriminationGroups(totals: readonly number[]): DiscriminationGroup[] {
  const count = totals.length;

  return totals.map((total) => {
    const atOrAbove = totals.filter((other) => other >= total).length / count;
    const atOrBelow = totals.filter((other) => other <= total).length / count;

    if (atOrAbove <= DISCRIMINATION_GROUP_SHARE) return 'upper';
    if (atOrBelow <= DISCRIMINATION_GROUP_SHARE) return 'lower';

    return null;
  });
}

/**
 * Upper-lower discrimination index, from -1 to 1: the average item score of the upper 27% minus that of the lower
 * 27%. Null when either group is empty. Above 0.3 separates strong from weak students; below 0.1 or negative
 * deserves review.
 */
export function computeDiscrimination(responses: readonly ItemResponse[]): number | null {
  const groups = assignDiscriminationGroups(responses.map((response) => response.totalRatio));
  const upper = responses.filter((_, index) => groups[index] === 'upper');
  const lower = responses.filter((_, index) => groups[index] === 'lower');

  if (upper.length === 0 || lower.length === 0) return null;

  const average = (items: readonly ItemResponse[]) => items.reduce((sum, item) => sum + item.ratio, 0) / items.length;

  return Math.round((average(upper) - average(lower)) * 100) / 100;
}

export const ITEM_ANALYSIS_THRESHOLDS = {
  /** Facility percentage below which a question is flagged as too hard. */
  tooHardBelow: 30,
  /** Facility percentage above which a question is flagged as too easy. */
  tooEasyAbove: 90,
  /** Discrimination (upper minus lower group, 0 to 1) below which a question separates students poorly. */
  poorDiscriminationBelow: 0.2
} as const;

export type ItemFlag = 'too_hard' | 'too_easy' | 'poor_discrimination';

/** The review flags for one question from its facility percentage and discrimination; null values raise no flag. */
export function flagItem(facility: number | null, discrimination: number | null): ItemFlag[] {
  const flags: ItemFlag[] = [];

  if (facility !== null && facility < ITEM_ANALYSIS_THRESHOLDS.tooHardBelow) flags.push('too_hard');
  if (facility !== null && facility > ITEM_ANALYSIS_THRESHOLDS.tooEasyAbove) flags.push('too_easy');
  if (discrimination !== null && discrimination < ITEM_ANALYSIS_THRESHOLDS.poorDiscriminationBelow) {
    flags.push('poor_discrimination');
  }

  return flags;
}
