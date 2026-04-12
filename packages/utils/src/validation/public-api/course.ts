import * as z from 'zod';

import { ZCourseCreate, ZCourseUpdate } from '../course/course';
import { ZCourseImportDraftPayload } from '../course-import/course-import';

export const ZPublicApiCoursesQuery = z.object({
  tags: z.string().optional()
});
export type TPublicApiCoursesQuery = z.infer<typeof ZPublicApiCoursesQuery>;

export const ZPublicApiCourseParam = z.object({
  courseId: z.string().uuid()
});
export type TPublicApiCourseParam = z.infer<typeof ZPublicApiCourseParam>;

export const ZPublicApiCreateCourse = ZCourseCreate.omit({
  organizationId: true
});
export type TPublicApiCreateCourse = z.infer<typeof ZPublicApiCreateCourse>;

export const ZPublicApiUpdateCourse = ZCourseUpdate.omit({
  tagIds: true
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
