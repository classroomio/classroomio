import * as z from 'zod';

import {
  COURSE_BUILD_BUDGET_USD,
  COURSE_BUILD_COURSE_COUNT,
  COURSE_BUILD_MAX_PAGES_PER_SOURCE,
  COURSE_BUILD_PRODUCT_SITE_PAGES
} from '../../constants/course-build';

/** The onboarding answers the course list is planned for. */
export const ZCourseBuildAnswers = z.object({
  firstOutcome: z.string().max(40),
  jobRole: z.string().max(40),
  companySize: z.string().max(20),
  learningMethod: z.string().max(40)
});
export type TCourseBuildAnswers = z.infer<typeof ZCourseBuildAnswers>;

/** What a course build reads and how far it may go, stored on the job. */
export const ZCourseBuildScope = z.object({
  websiteUrl: z.string().url().max(2048),
  locale: z.string().min(2).max(10),
  answers: ZCourseBuildAnswers,
  courseCount: z.number().int().min(1).max(8).default(COURSE_BUILD_COURSE_COUNT),
  maxPagesPerSource: z.number().int().min(1).max(5_000).default(COURSE_BUILD_MAX_PAGES_PER_SOURCE),
  productSitePages: z.number().int().min(0).max(200).default(COURSE_BUILD_PRODUCT_SITE_PAGES),
  budgetUsd: z.number().min(0).max(100).default(COURSE_BUILD_BUDGET_USD)
});
export type TCourseBuildScope = z.infer<typeof ZCourseBuildScope>;
export type TCourseBuildScopeInput = z.input<typeof ZCourseBuildScope>;
