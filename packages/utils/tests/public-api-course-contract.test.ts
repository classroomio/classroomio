import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import { ZPublicApiCoursesQuery } from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiCoursesQuery
};

describe('public API course request contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('keeps the course list bounds', () => {
    expect(ZPublicApiCoursesQuery.parse({})).toEqual({ page: 1, limit: 20 });
    expect(ZPublicApiCoursesQuery.safeParse({ sort: 'name', order: 'asc' }).success).toBe(true);
    expect(ZPublicApiCoursesQuery.safeParse({ sort: 'price' }).success).toBe(true);
    expect(ZPublicApiCoursesQuery.safeParse({ sort: 'title' }).success).toBe(false);
    expect(ZPublicApiCoursesQuery.safeParse({ search: 'a'.repeat(201) }).success).toBe(false);
  });
});
