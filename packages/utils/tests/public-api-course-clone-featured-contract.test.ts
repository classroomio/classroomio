import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiCloneCourse,
  ZPublicApiFeaturedCoursesResponse,
  ZPublicApiSetFeaturedCourses
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const schemas = { ZPublicApiCloneCourse, ZPublicApiSetFeaturedCourses, ZPublicApiFeaturedCoursesResponse };

describe('public API course clone and featured contract', () => {
  it.each(Object.entries(schemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' })).toMatchSnapshot(name);
  });
});
