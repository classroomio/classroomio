/** A website course build: `NOTHING_TO_BUILD` when the usefulness gate found too little to teach, before any model call. */
export const COURSE_BUILD_STATUSES = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'NOTHING_TO_BUILD',
  'FAILED',
  'CANCELED'
] as const;
export type TCourseBuildStatus = (typeof COURSE_BUILD_STATUSES)[number];

export const COURSE_BUILD_STAGES = [
  'queued',
  'discover',
  'read',
  'understand',
  'plan',
  'write',
  'finish',
  'export',
  'done'
] as const;
export type TCourseBuildStage = (typeof COURSE_BUILD_STAGES)[number];

export const COURSE_BUILD_SOURCE_STATUSES = ['PENDING', 'READING', 'READ', 'FAILED'] as const;
export type TCourseBuildSourceStatus = (typeof COURSE_BUILD_SOURCE_STATUSES)[number];

export const COURSE_BUILD_COURSE_STATUSES = ['PLANNED', 'WRITING', 'CHECKING', 'EXPORTING', 'READY', 'FAILED'] as const;
export type TCourseBuildCourseStatus = (typeof COURSE_BUILD_COURSE_STATUSES)[number];

/** Internal cap per build (plan §16 question 2); no request is sent once a build has spent it. */
export const COURSE_BUILD_BUDGET_USD = 15;
export const COURSE_BUILD_MAX_PAGES_PER_SOURCE = 300;
export const COURSE_BUILD_PRODUCT_SITE_PAGES = 25;
export const COURSE_BUILD_COURSE_COUNT = 3;
