import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiCourseTemplateListItemResponse,
  ZPublicApiCourseTemplateParam,
  ZPublicApiCourseTemplateResponse,
  ZPublicApiCourseTemplatesQuery,
  ZPublicApiCreateCourseFromTemplate,
  ZPublicApiSaveCourseTemplate
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiCourseTemplatesQuery,
  ZPublicApiCourseTemplateParam,
  ZPublicApiCreateCourseFromTemplate,
  ZPublicApiSaveCourseTemplate
};

const responseSchemas = {
  ZPublicApiCourseTemplateListItemResponse,
  ZPublicApiCourseTemplateResponse
};

describe('public API course template contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it.each(Object.entries(responseSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('only accepts the documented template sources', () => {
    expect(ZPublicApiCourseTemplatesQuery.parse({})).toEqual({ source: 'all', page: 1, limit: 20 });
    expect(ZPublicApiCourseTemplatesQuery.safeParse({ source: 'org' }).success).toBe(true);
    expect(ZPublicApiCourseTemplatesQuery.safeParse({ source: 'global' }).success).toBe(true);
    expect(ZPublicApiCourseTemplatesQuery.safeParse({ source: 'platform' }).success).toBe(false);
  });

  it('needs a uuid template id', () => {
    expect(ZPublicApiCourseTemplateParam.safeParse({ templateId: 'abc' }).success).toBe(false);
  });

  it.each([
    ['ZPublicApiCreateCourseFromTemplate', ZPublicApiCreateCourseFromTemplate],
    ['ZPublicApiSaveCourseTemplate', ZPublicApiSaveCourseTemplate]
  ])('%s trims the title and refuses a blank one', (_name, schema) => {
    expect(schema.parse({ title: '  Onboarding  ' })).toEqual({ title: 'Onboarding' });
    expect(schema.safeParse({ title: '   ' }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });
});
