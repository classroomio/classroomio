import * as z from 'zod';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
export const ZPublicApiTagGroupResponse = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ZPublicApiTagResponse = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  groupId: z.string().uuid(),
  name: z.string(),
  slug: z.string().describe('Used by the tags filter on the course list'),
  description: z.string().nullable(),
  color: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ZPublicApiTagGroupWithTagsResponse = ZPublicApiTagGroupResponse.extend({
  tags: z.array(
    ZPublicApiTagResponse.extend({
      courseCount: z.number().describe('Active courses that carry this tag')
    })
  )
});

export const ZPublicApiCourseTagResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  color: z.string()
});
