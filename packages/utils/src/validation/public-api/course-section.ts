import * as z from 'zod';

import { ZPublicApiCourseParam } from './course';
import { ZPublicApiPaginationQuery } from './pagination';

export const ZPublicApiCourseSectionParam = ZPublicApiCourseParam.extend({
  sectionId: z.string().uuid()
});
export type TPublicApiCourseSectionParam = z.infer<typeof ZPublicApiCourseSectionParam>;

export const ZPublicApiCourseSectionsQuery = ZPublicApiPaginationQuery;
export type TPublicApiCourseSectionsQuery = z.infer<typeof ZPublicApiCourseSectionsQuery>;

const SECTION_ORDER_DESCRIPTION =
  'Top-level position, starting at 1. Sections share these positions with lessons and exercises outside any section; the entry at that position and every later one move down one.';

export const ZPublicApiCreateCourseSection = z
  .object({
    title: z.string().min(1),
    order: z.number().int().min(1).optional().describe(SECTION_ORDER_DESCRIPTION),
    moveUngrouped: z.boolean().optional()
  })
  .refine((data) => (data.moveUngrouped ? data.order === undefined : data.order !== undefined), {
    message: 'Send order, or moveUngrouped: true without order',
    path: ['order']
  });
export type TPublicApiCreateCourseSection = z.infer<typeof ZPublicApiCreateCourseSection>;

export const ZPublicApiUpdateCourseSection = z
  .object({
    title: z.string().min(1).optional(),
    order: z.number().int().min(1).optional().describe(SECTION_ORDER_DESCRIPTION)
  })
  .refine((data) => data.title !== undefined || data.order !== undefined, {
    message: 'Provide title or order'
  });
export type TPublicApiUpdateCourseSection = z.infer<typeof ZPublicApiUpdateCourseSection>;
