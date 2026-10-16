import * as z from 'zod';

import { ZTagColor } from '../tag/tag';
import { ZPublicApiPaginationQuery } from './pagination';

const name = z.string().min(1).max(80);
const description = z.string().max(240);
const atLeastOneField = (value: object) => Object.keys(value).length > 0;

export const ZPublicApiTagGroupParam = z.object({
  groupId: z.string().uuid()
});
export type TPublicApiTagGroupParam = z.infer<typeof ZPublicApiTagGroupParam>;

export const ZPublicApiTagParam = z.object({
  tagId: z.string().uuid()
});
export type TPublicApiTagParam = z.infer<typeof ZPublicApiTagParam>;

export const ZPublicApiTagsQuery = ZPublicApiPaginationQuery.extend({
  courseId: z.string().uuid().optional().describe('Only return the tags assigned to this course')
});
export type TPublicApiTagsQuery = z.infer<typeof ZPublicApiTagsQuery>;

export const ZPublicApiCreateTagGroup = z.object({
  name,
  description: description.optional(),
  order: z.number().int().min(0).optional()
});
export type TPublicApiCreateTagGroup = z.infer<typeof ZPublicApiCreateTagGroup>;

export const ZPublicApiUpdateTagGroup = z
  .object({
    name: name.optional(),
    description: description.optional(),
    order: z.number().int().min(0).optional()
  })
  .refine(atLeastOneField, { message: 'At least one field is required' });
export type TPublicApiUpdateTagGroup = z.infer<typeof ZPublicApiUpdateTagGroup>;

export const ZPublicApiCreateTag = z.object({
  name,
  description: description.optional(),
  groupId: z.string().uuid(),
  color: ZTagColor
});
export type TPublicApiCreateTag = z.infer<typeof ZPublicApiCreateTag>;

export const ZPublicApiUpdateTag = z
  .object({
    name: name.optional(),
    description: description.optional(),
    groupId: z.string().uuid().optional(),
    color: ZTagColor.optional()
  })
  .refine(atLeastOneField, { message: 'At least one field is required' });
export type TPublicApiUpdateTag = z.infer<typeof ZPublicApiUpdateTag>;
