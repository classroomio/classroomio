import * as z from 'zod';

import { ZPublicApiPaginationQuery } from './pagination';

export const COURSE_TEMPLATE_SOURCES = ['org', 'global'] as const;

export const ZPublicApiCourseTemplatesQuery = ZPublicApiPaginationQuery.extend({
  source: z
    .enum(['all', ...COURSE_TEMPLATE_SOURCES])
    .default('all')
    .describe("org = the organization's own templates, global = curated templates shared with every organization")
});
export type TPublicApiCourseTemplatesQuery = z.infer<typeof ZPublicApiCourseTemplatesQuery>;

export const ZPublicApiCourseTemplateParam = z.object({
  templateId: z.string().uuid()
});
export type TPublicApiCourseTemplateParam = z.infer<typeof ZPublicApiCourseTemplateParam>;

export const ZPublicApiCreateCourseFromTemplate = z.object({
  title: z.string().trim().min(1).describe('Title of the new course')
});
export type TPublicApiCreateCourseFromTemplate = z.infer<typeof ZPublicApiCreateCourseFromTemplate>;

export const ZPublicApiSaveCourseTemplate = z.object({
  title: z.string().trim().min(1).describe('Title of the new template')
});
export type TPublicApiSaveCourseTemplate = z.infer<typeof ZPublicApiSaveCourseTemplate>;
