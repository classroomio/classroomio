import * as z from 'zod';

import {
  ZCourseSectionCreate,
  ZCourseSectionPromoteUngrouped,
  ZCourseSectionReorder,
  ZCourseSectionUpdate
} from '../course/section';

export const ZPublicApiSectionParam = z.object({
  courseId: z.string().uuid(),
  sectionId: z.string().uuid()
});
export type TPublicApiSectionParam = z.infer<typeof ZPublicApiSectionParam>;

export const ZPublicApiCreateSection = ZCourseSectionCreate.omit({ courseId: true });
export type TPublicApiCreateSection = z.infer<typeof ZPublicApiCreateSection>;

export const ZPublicApiUpdateSection = ZCourseSectionUpdate;
export type TPublicApiUpdateSection = z.infer<typeof ZPublicApiUpdateSection>;

export const ZPublicApiReorderSections = ZCourseSectionReorder;
export type TPublicApiReorderSections = z.infer<typeof ZPublicApiReorderSections>;

export const ZPublicApiPromoteUngroupedSection = ZCourseSectionPromoteUngrouped;
export type TPublicApiPromoteUngroupedSection = z.infer<typeof ZPublicApiPromoteUngroupedSection>;
