import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import { ZPublicApiRelatedCourseResponse, ZPublicApiRelatedCoursesQuery } from '../src/validation/public-api';

const schemas = { ZPublicApiRelatedCoursesQuery, ZPublicApiRelatedCourseResponse };

describe('public API related courses contract', () => {
  it.each(Object.entries(schemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' })).toMatchSnapshot(name);
  });
});
