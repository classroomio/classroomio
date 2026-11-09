import * as z from 'zod';

import { ZCourseCreateBase, ZCourseUpdateBase } from '../course/course';
import { ZCourseImportDraftPayload } from '../course-import/course-import';
import { ZCourseType } from '../course/course-type';
import { ZOrganizationCourseSort } from '../organization';
import { ZPublicApiPaginationQuery } from './pagination';

export const ZPublicApiCoursesQuery = ZPublicApiPaginationQuery.extend({
  search: z.string().trim().max(200).optional().describe('Matches the course title.'),
  slug: z.string().trim().min(1).max(200).optional().describe('Exact course slug'),
  title: z.string().trim().min(1).max(200).optional().describe('Exact course title, case-insensitive'),
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

export const ZPublicApiUpdateCourse = ZCourseUpdateBase.extend({
  tagIds: z
    .array(z.string().uuid())
    .max(100)
    .optional()
    .describe(
      "Replaces the course's tags. Send [] to remove them all. Keys without public_api:* (MCP keys) may only send this field or addTagIds."
    ),
  addTagIds: z
    .array(z.string().uuid())
    .min(1)
    .max(100)
    .optional()
    .describe("Adds these tags and keeps the existing ones; safe to call in parallel. Can't be sent with tagIds.")
})
  .refine((data) => data.type !== 'COMPLIANCE' || data.compliance !== undefined, {
    message: 'Compliance settings are required when changing a course to COMPLIANCE',
    path: ['compliance']
  })
  .refine((data) => data.tagIds === undefined || data.addTagIds === undefined, {
    message: 'Send either tagIds or addTagIds, not both',
    path: ['addTagIds']
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
