import * as z from 'zod';

// Course Section Schemas
export const ZCourseSectionCreate = z.object({
  title: z.string().min(1),
  courseId: z.string().min(1),
  order: z.number().int().min(0).optional()
});
export type TCourseSectionCreate = z.infer<typeof ZCourseSectionCreate>;

export const ZCourseSectionUpdate = z.object({
  title: z.string().min(1).optional(),
  order: z.number().int().min(0).optional()
});
export type TCourseSectionUpdate = z.infer<typeof ZCourseSectionUpdate>;

export const ZCourseSectionGetParam = z.object({
  sectionId: z.string().min(1)
});
export type TCourseSectionGetParam = z.infer<typeof ZCourseSectionGetParam>;

export const ZCourseSectionReorder = z.object({
  sections: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.number().int().min(0)
      })
    )
    .min(1)
});
export type TCourseSectionReorder = z.infer<typeof ZCourseSectionReorder>;
