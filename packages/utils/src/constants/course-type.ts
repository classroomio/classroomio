/** Postgres `COURSE_TYPE` enum values — shared by Drizzle schema and Zod validation. */
export const COURSE_TYPE_VALUES = ['SELF_PACED', 'LIVE_CLASS', 'COMPLIANCE', 'PUBLIC'] as const;

export type TCourseType = (typeof COURSE_TYPE_VALUES)[number];
