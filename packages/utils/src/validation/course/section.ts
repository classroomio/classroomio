import * as z from 'zod';

// Course Section Schemas
export const ZCourseSectionCreate = z.object({
  title: z.string().min(1),
  courseId: z.string().min(1),
  order: z.number().int().min(1)
});
export type TCourseSectionCreate = z.infer<typeof ZCourseSectionCreate>;

export const ZCourseSectionUpdate = z.object({
  title: z.string().min(1).optional(),
  order: z.number().int().min(0).optional()
});
export type TCourseSectionUpdate = z.infer<typeof ZCourseSectionUpdate>;

export const ZCourseSectionPromoteUngrouped = z.object({
  title: z.string().min(1)
});
export type TCourseSectionPromoteUngrouped = z.infer<typeof ZCourseSectionPromoteUngrouped>;

export const ZCourseSectionGetParam = z.object({
  sectionId: z.string().min(1)
});
export type TCourseSectionGetParam = z.infer<typeof ZCourseSectionGetParam>;

export const ZCourseSectionReorder = z
  .object({
    sections: z
      .array(
        z.object({
          id: z.string().min(1),
          order: z.number().int().min(1)
        })
      )
      .min(1)
  })
  .superRefine((value, ctx) => {
    const orders = value.sections.map((section) => section.order).sort((a, b) => a - b);
    if (orders.some((order, index) => order !== index + 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sections'],
        message: 'Section orders must be a contiguous 1-based sequence (1, 2, 3, ...)'
      });
    }
  });
export type TCourseSectionReorder = z.infer<typeof ZCourseSectionReorder>;
