import * as z from 'zod';

import { ZCourseCreateBase, ZCourseUpdateBase } from '../course/course';
import { ZCourseImportDraftPayload } from '../course-import/course-import';
import { ZGetOrganizationCoursesQuery } from '../organization';

export const ZPublicApiCoursesQuery = ZGetOrganizationCoursesQuery;
export type TPublicApiCoursesQuery = z.infer<typeof ZPublicApiCoursesQuery>;

export const ZPublicApiCourseParam = z.object({
  courseId: z.string().uuid()
});
export type TPublicApiCourseParam = z.infer<typeof ZPublicApiCourseParam>;

export const ZPublicApiCreateCourse = ZCourseCreateBase.omit({
  organizationId: true
}).refine((data) => data.type !== 'COMPLIANCE' || data.compliance !== undefined, {
  message: 'Compliance settings are required for COMPLIANCE courses',
  path: ['compliance']
});
export type TPublicApiCreateCourse = z.infer<typeof ZPublicApiCreateCourse>;

export const ZPublicApiUpdateCourse = ZCourseUpdateBase.omit({
  tagIds: true
}).refine((data) => data.type !== 'COMPLIANCE' || data.compliance !== undefined, {
  message: 'Compliance settings are required when changing a course to COMPLIANCE',
  path: ['compliance']
});
export type TPublicApiUpdateCourse = z.infer<typeof ZPublicApiUpdateCourse>;

export const ZPublicApiUpdateCourseStructure = z.object({
  mode: z.enum(['merge', 'replace']).default('merge'),
  idempotencyKey: z.string().min(1).optional(),
  summary: z.record(z.string(), z.unknown()).optional(),
  sourceArtifacts: z.array(z.record(z.string(), z.unknown())).optional(),
  draft: ZCourseImportDraftPayload
});
export type TPublicApiUpdateCourseStructure = z.infer<typeof ZPublicApiUpdateCourseStructure>;

export const ZPublicApiCloneCourse = z.object({
  title: z.string().min(1).describe('Title of the copy'),
  description: z.string().optional().describe("Description of the copy; defaults to the source course's"),
  slug: z
    .string()
    .min(1)
    .optional()
    .describe('URL slug of the copy; must be unused. Defaults to one generated from the title')
});
export type TPublicApiCloneCourse = z.infer<typeof ZPublicApiCloneCourse>;

export const ZPublicApiRelatedCoursesQuery = z.object({
  profileId: z.uuid().optional().describe('Leave out courses this person is already a member of'),
  pricing: z.enum(['free', 'paid']).optional().describe('free: cost is 0; paid: cost above 0. Default: both'),
  limit: z.coerce.number().int().min(1).max(20).default(4)
});
export type TPublicApiRelatedCoursesQuery = z.infer<typeof ZPublicApiRelatedCoursesQuery>;
