import * as z from 'zod';

import { ZCourseCreateBase, ZCourseUpdateBase } from '../course/course';
import { ZCourseImportDraftPayload } from '../course-import/course-import';
import { ZCourseType } from '../course/course-type';
import { ZOrganizationCourseSort } from '../organization';
import { ZPublicApiPaginationQuery } from './pagination';

export const ZPublicApiCoursesQuery = ZPublicApiPaginationQuery.extend({
  search: z.string().trim().max(200).optional().describe('Matches the course title.'),
  tags: z.string().max(2000).optional().describe('Comma-separated tag slugs; returns courses with any of them.'),
  type: ZCourseType.optional(),
  status: z.enum(['published', 'unpublished']).optional(),
  sort: ZOrganizationCourseSort.optional().describe(
    'price sorts on the stored cost, with free courses as 0. Default: date_created.'
  ),
  order: z.enum(['asc', 'desc']).optional().describe('Default: desc.')
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
