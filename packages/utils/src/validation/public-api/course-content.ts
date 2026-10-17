import * as z from 'zod';

import { ZCourseContentReorder } from '../course/course';

const MAX_ITEMS = 500;

const ZContentItemRef = z.object({
  id: z.string().uuid(),
  type: z.enum(['LESSON', 'EXERCISE'])
});

function rejectDuplicateItems(data: { items?: Array<{ id: string; type: string }> }, ctx: z.RefinementCtx) {
  const seen = new Set<string>();
  data.items?.forEach((item, index) => {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) {
      ctx.addIssue({
        code: 'custom',
        path: ['items', index, 'id'],
        message: 'Item IDs must be unique per content type'
      });
    }
    seen.add(key);
  });
}

export const ZPublicApiReorderCourseContent = z
  .object({
    sections: z
      .array(z.object({ id: z.string().uuid(), order: z.number().int().min(1) }))
      .min(1)
      .max(MAX_ITEMS)
      .optional(),
    items: z
      .array(
        ZContentItemRef.extend({
          order: z.number().int().min(1).optional(),
          sectionId: z.string().uuid().nullable().optional()
        })
      )
      .min(1)
      .max(MAX_ITEMS)
      .optional()
  })
  // Same ordering rules as the dashboard.
  .superRefine((data, ctx) => {
    ZCourseContentReorder.safeParse(data).error?.issues.forEach((issue) =>
      ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message })
    );
  });
export type TPublicApiReorderCourseContent = z.infer<typeof ZPublicApiReorderCourseContent>;

export const ZPublicApiUpdateCourseContentLock = z
  .object({
    items: z
      .array(ZContentItemRef.extend({ isUnlocked: z.boolean() }))
      .min(1)
      .max(MAX_ITEMS)
  })
  .superRefine(rejectDuplicateItems);
export type TPublicApiUpdateCourseContentLock = z.infer<typeof ZPublicApiUpdateCourseContentLock>;

export const ZPublicApiDeleteCourseContent = z
  .object({
    items: z.array(ZContentItemRef).min(1).max(MAX_ITEMS)
  })
  .superRefine(rejectDuplicateItems);
export type TPublicApiDeleteCourseContent = z.infer<typeof ZPublicApiDeleteCourseContent>;
