import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiAddCourseMember,
  ZPublicApiCourseInvitesQuery,
  ZPublicApiCourseMemberAnalyticsQuery,
  ZPublicApiCourseMembersQuery,
  ZPublicApiCreateCourseInvite,
  ZPublicApiUpdateCourseMember
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiCourseMembersQuery,
  ZPublicApiAddCourseMember,
  ZPublicApiUpdateCourseMember,
  ZPublicApiCourseMemberAnalyticsQuery,
  ZPublicApiCourseInvitesQuery,
  ZPublicApiCreateCourseInvite
};

describe('public API course member request contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('keeps the validation rules that are not visible in the JSON shape', () => {
    expect(ZPublicApiAddCourseMember.safeParse({ roleId: 3 }).success).toBe(false);
    expect(ZPublicApiAddCourseMember.safeParse({ roleId: 4, email: 'a@example.com' }).success).toBe(false);
    expect(ZPublicApiAddCourseMember.safeParse({ roleId: 3, email: 'a@example.com' }).success).toBe(true);
    expect(ZPublicApiUpdateCourseMember.safeParse({}).success).toBe(false);
    expect(ZPublicApiCreateCourseInvite.safeParse({}).success).toBe(false);
    expect(ZPublicApiCreateCourseInvite.safeParse({ recipientCsv: '  ' }).success).toBe(false);
    expect(ZPublicApiCreateCourseInvite.safeParse({ recipientEmails: ['a@example.com'] }).success).toBe(true);
  });
});
