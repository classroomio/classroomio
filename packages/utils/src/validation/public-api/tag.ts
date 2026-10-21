import * as z from 'zod';

import { ZTagColor } from '../tag/tag';
import { ZPublicApiPaginationQuery } from './pagination';

const name = z.string().min(1).max(80);
const description = z.string().max(240);
const atLeastOneField = (value: object) => Object.keys(value).length > 0;

const tagName = name.describe(
  "Tag name, unique in the organization ignoring case. Its slug, made from the name, is what the course list's tags filter matches."
);
const groupName = name.describe('Tag group name, unique in the organization ignoring case');
const groupOrder = z.number().int().min(0).describe('Position in GET /tags, lowest first; ties sort by name');
const groupId = z.string().uuid().describe('Tag group id from GET /tags');
const color = ZTagColor.describe('One of the dashboard tag palette colours');

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
  name: groupName,
  description: description.optional(),
  order: groupOrder.optional()
});
export type TPublicApiCreateTagGroup = z.infer<typeof ZPublicApiCreateTagGroup>;

export const ZPublicApiUpdateTagGroup = z
  .object({
    name: groupName.optional(),
    description: description.optional(),
    order: groupOrder.optional()
  })
  .refine(atLeastOneField, { message: 'At least one field is required' })
  .describe('Only the fields you send change; renaming changes the slug');
export type TPublicApiUpdateTagGroup = z.infer<typeof ZPublicApiUpdateTagGroup>;

export const ZPublicApiCreateTag = z.object({
  name: tagName,
  description: description.optional(),
  groupId,
  color
});
export type TPublicApiCreateTag = z.infer<typeof ZPublicApiCreateTag>;

export const ZPublicApiUpdateTag = z
  .object({
    name: tagName.optional(),
    description: description.optional(),
    groupId: groupId.optional(),
    color: color.optional()
  })
  .refine(atLeastOneField, { message: 'At least one field is required' })
  .describe(
    'Only the fields you send change; renaming changes the slug, so course filters on the old slug stop matching'
  );
export type TPublicApiUpdateTag = z.infer<typeof ZPublicApiUpdateTag>;
