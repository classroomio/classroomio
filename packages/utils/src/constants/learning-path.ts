/** Postgres `LEARNING_PATH_STATUS` enum values — shared by Drizzle schema and Zod validation. */
export const LEARNING_PATH_STATUS_VALUES = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;

export type TLearningPathStatus = (typeof LEARNING_PATH_STATUS_VALUES)[number];

/** Postgres `LEARNING_PATH_DIFFICULTY` enum values — powers the Difficulty filter and the public stats row. */
export const LEARNING_PATH_DIFFICULTY_VALUES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export type TLearningPathDifficulty = (typeof LEARNING_PATH_DIFFICULTY_VALUES)[number];

/** How much of a path a non-enrolled visitor may explore on the public path page. */
export const LEARNING_PATH_VISITOR_ACCESS_VALUES = ['teaser', 'syllabus', 'preview'] as const;

export type TLearningPathVisitorAccess = (typeof LEARNING_PATH_VISITOR_ACCESS_VALUES)[number];

/** Postgres `LEARNING_PATH_MEMBER_STATUS` enum values — a member's rolled-up progress through a path. */
export const LEARNING_PATH_MEMBER_STATUS_VALUES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;

export type TLearningPathMemberStatus = (typeof LEARNING_PATH_MEMBER_STATUS_VALUES)[number];

/** Postgres `LEARNING_PATH_COURSE_STATUS` enum values — one member's state on one course of a path. */
export const LEARNING_PATH_COURSE_STATUS_VALUES = ['LOCKED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;

export type TLearningPathCourseStatus = (typeof LEARNING_PATH_COURSE_STATUS_VALUES)[number];
