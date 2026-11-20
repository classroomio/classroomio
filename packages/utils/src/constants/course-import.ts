/** Postgres `COURSE_IMPORT_SOURCE_TYPE` enum values: what a course import draft was produced from. Shared by Drizzle schema and Zod validation. */
export const COURSE_IMPORT_SOURCE_TYPES = ['prompt', 'pdf', 'course', 'website', 'sample'] as const;

export type TCourseImportSourceType = (typeof COURSE_IMPORT_SOURCE_TYPES)[number];

/** What a draft's citation can point to. A sample course cites nothing, so `sample` is not one. */
export const COURSE_IMPORT_REFERENCE_TYPES = ['prompt', 'pdf', 'course', 'website'] as const;

export type TCourseImportReferenceType = (typeof COURSE_IMPORT_REFERENCE_TYPES)[number];
