export const DEFAULT_WEEKLY_LESSON_TARGET = 3;
export const MIN_WEEKLY_LESSON_TARGET = 1;
export const MAX_WEEKLY_LESSON_TARGET = 50;

export const STREAK_MILESTONE_DAYS = [3, 7, 14, 30, 60, 100] as const;

export const STREAK_HISTORY_DAYS = 7;

/** Learner-local hour at which the streak-at-risk reminder goes out. */
export const STREAK_RISK_LOCAL_HOUR = 19;

/** How far back activity is read when computing the best streak. */
export const STREAK_LOOKBACK_DAYS = 400;
