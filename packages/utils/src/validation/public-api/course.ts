import * as z from 'zod';

import { ZCourseCreateBase, ZCourseUpdateBase } from '../course/course';
import { ZCourseImportDraftPayload } from '../course-import/course-import';

export const ZPublicApiCoursesQuery = z.object({
  tags: z.string().optional()
});
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
