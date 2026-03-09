import * as z from 'zod';

export const TAG_COLOR_OPTIONS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#84CC16',
  '#22C55E',
  '#14B8A6',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899'
] as const;

export const ZTagColor = z.enum(TAG_COLOR_OPTIONS);
export type TTagColor = z.infer<typeof ZTagColor>;

export const ZTagGroupParam = z.object({
  groupId: z.uuid()
});
export type TTagGroupParam = z.infer<typeof ZTagGroupParam>;

export const ZTagGroupCreate = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(240).optional(),
  order: z.number().int().min(0).optional()
});
export type TTagGroupCreate = z.infer<typeof ZTagGroupCreate>;

export const ZTagGroupUpdate = ZTagGroupCreate.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required'
});
export type TTagGroupUpdate = z.infer<typeof ZTagGroupUpdate>;

export const ZTagParam = z.object({
  tagId: z.uuid()
});
export type TTagParam = z.infer<typeof ZTagParam>;

export const ZTagCreate = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(240).optional(),
  groupId: z.uuid(),
  color: ZTagColor
});
export type TTagCreate = z.infer<typeof ZTagCreate>;

export const ZTagUpdate = z
  .object({
    name: z.string().min(1).max(80).optional(),
    description: z.string().max(240).optional(),
    groupId: z.uuid().optional(),
    color: ZTagColor.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });
export type TTagUpdate = z.infer<typeof ZTagUpdate>;

export const ZCourseTagParam = z.object({
  courseId: z.uuid()
});
export type TCourseTagParam = z.infer<typeof ZCourseTagParam>;

export const ZCourseTagAssignment = z.object({
  tagIds: z.array(z.uuid()).max(100).default([])
});
export type TCourseTagAssignment = z.infer<typeof ZCourseTagAssignment>;
