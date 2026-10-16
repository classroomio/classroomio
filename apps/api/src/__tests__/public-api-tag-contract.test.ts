import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiCourseTagResponse,
  ZPublicApiCreateTag,
  ZPublicApiCreateTagGroup,
  ZPublicApiTagGroupParam,
  ZPublicApiTagGroupResponse,
  ZPublicApiTagGroupWithTagsResponse,
  ZPublicApiTagParam,
  ZPublicApiTagResponse,
  ZPublicApiTagsQuery,
  ZPublicApiUpdateCourse,
  ZPublicApiUpdateCourseResponse,
  ZPublicApiUpdateTag,
  ZPublicApiUpdateTagGroup
} from '@cio/utils/validation/public-api';

// Snapshots fail when a dashboard schema change would quietly change the public tag contract.
describe('public tag contract', () => {
  it.each(
    Object.entries({
      ZPublicApiTagGroupParam,
      ZPublicApiTagParam,
      ZPublicApiTagsQuery,
      ZPublicApiCreateTagGroup,
      ZPublicApiUpdateTagGroup,
      ZPublicApiCreateTag,
      ZPublicApiUpdateTag,
      ZPublicApiTagGroupResponse,
      ZPublicApiTagResponse,
      ZPublicApiTagGroupWithTagsResponse,
      ZPublicApiCourseTagResponse,
      ZPublicApiUpdateCourseResponse
    })
  )('%s', (_name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot();
  });

  it('accepts tagIds on the course update and caps it at 100', () => {
    const tagId = '11111111-1111-4111-8111-111111111111';

    expect(ZPublicApiUpdateCourse.parse({ tagIds: [tagId] })).toEqual({ tagIds: [tagId] });
    expect(ZPublicApiUpdateCourse.safeParse({ tagIds: Array(101).fill(tagId) }).success).toBe(false);
    expect(ZPublicApiUpdateCourse.safeParse({ tagIds: ['not-a-uuid'] }).success).toBe(false);
  });

  it('limits tag colours to the dashboard palette', () => {
    const groupId = '11111111-1111-4111-8111-111111111111';

    expect(ZPublicApiCreateTag.safeParse({ name: 'Safety', groupId, color: '#EF4444' }).success).toBe(true);
    expect(ZPublicApiCreateTag.safeParse({ name: 'Safety', groupId, color: '#000000' }).success).toBe(false);
  });
});
