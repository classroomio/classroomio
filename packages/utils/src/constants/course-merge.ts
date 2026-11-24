export const COURSE_MERGE_STATUS_VALUES = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'REVERTING',
  'REVERTED',
  'FINALIZED'
] as const;

export type TCourseMergeStatus = (typeof COURSE_MERGE_STATUS_VALUES)[number];

/** Days after a merge completes during which it can be undone. */
export const COURSE_MERGE_UNDO_WINDOW_DAYS = 30;
