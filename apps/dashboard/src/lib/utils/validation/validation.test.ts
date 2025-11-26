import { ZodError, z } from 'zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '$lib/utils/translations/en.json' assert { type: 'json' };

import { mapZodErrorsToTranslations } from './validation';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn<(key: string, params?: Record<string, unknown>) => string | null>()
}));

vi.mock('$lib/utils/functions/translations', () => ({
  t: {
    get: mockGet
  }
}));

const createError = (issue: z.core.$ZodIssue) =>
  new ZodError([
    {
      ...issue,
      path: issue.path ?? ['field'],
      message: issue.message ?? 'Issue occurred'
    } as z.core.$ZodIssue
  ]);

function renderTemplate(template: string, params: Record<string, unknown> = {}): string {
  let output = template;

  output = output.replace(
    /\{(\w+),\s*select,\s*undefined\{\}\s*other\{((?:[^{}]|\{[^{}]*\})*)\}\}/g,
    (_match, key: string, content: string) => {
      const value = params[key];
      if (value === undefined || value === null || value === '') {
        return '';
      }

      const renderedContent = content.replace(/\{(\w+)\}/g, (_nestedMatch: string, innerKey: string) => {
        const innerValue = params[innerKey];
        return innerValue === undefined || innerValue === null ? '' : String(innerValue);
      });

      return renderedContent;
    }
  );

  output = output.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });

  return output;
}

describe('mapZodErrorsToTranslations fallback keys', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('prefers entity-specific translation before other fallbacks', () => {
    mockGet.mockImplementation((key) => {
      if (key === 'validations.course.title.too_small') {
        return 'Course-specific translation';
      }
      return null;
    });

    const error = createError({
      code: 'too_small',
      minimum: 3,
      inclusive: true,
      path: ['title'],
      origin: 'zod',
      message: 'Title must be at least 3 characters long'
    });

    expect(mapZodErrorsToTranslations(error, 'course')).toEqual({ title: 'Course-specific translation' });

    expect(mockGet).toHaveBeenCalledWith(
      'validations.course.title.too_small',
      expect.objectContaining({
        entity: 'course',
        field: 'title',
        minimum: 3,
        inclusive: true
      })
    );
  });

  it('falls back to field translation when entity-specific key is missing', () => {
    mockGet.mockImplementation((key) => {
      if (key === 'validations.title.too_small') {
        return 'Field translation';
      }
      return null;
    });

    const error = createError({
      code: 'too_small',
      minimum: 3,
      inclusive: true,
      path: ['title'],
      origin: 'zod',
      message: 'Title must be at least 3 characters long'
    });

    expect(mapZodErrorsToTranslations(error, 'course')).toEqual({ title: 'Field translation' });
  });

  it('falls back to generic translation when no specific keys are found', () => {
    mockGet.mockImplementation((key, params = {}) => {
      if (key === 'validations.generic.too_small') {
        return renderTemplate(enTranslations.validations.generic.too_small, params as Record<string, unknown>);
      }
      return null;
    });

    const error = createError({
      code: 'too_small',
      minimum: 3,
      inclusive: true,
      path: ['title'],
      origin: 'zod',
      message: 'Title must be at least 3 characters long'
    });

    expect(mapZodErrorsToTranslations(error)).toEqual({
      title: renderTemplate(enTranslations.validations.generic.too_small, {
        field: 'title',
        code: 'too_small',
        minimum: 3,
        inclusive: true
      })
    });
  });

  it('falls back to the original Zod message when no translations are available', () => {
    mockGet.mockReturnValue(null);

    const schema = z.object({
      title: z.string().min(5)
    });
    const result = schema.safeParse({ title: 'abc' });

    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    const zodMessage = result.error.issues[0].message;

    expect(mapZodErrorsToTranslations(result.error)).toEqual({
      title: zodMessage
    });
  });
});

describe('mapZodErrorsToTranslations generic parameter coverage', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  const cases: Array<{
    code: z.core.$ZodIssue['code'];
    issue: Partial<z.core.$ZodIssue> & Record<string, unknown>;
    expectedParams: Record<string, unknown>;
  }> = [
    {
      code: 'invalid_type',
      issue: {
        expected: 'string',
        received: 'number',
        path: ['field'],
        origin: 'zod',
        message: 'Field must be a string'
      },
      expectedParams: { expected: 'string', received: 'number' }
    },
    {
      code: 'too_small',
      issue: {
        minimum: 3,
        inclusive: true,
        exact: false,
        path: ['field'],
        origin: 'zod',
        message: 'Field must be at least 3 characters long'
      },
      expectedParams: { minimum: 3, inclusive: true, exact: false }
    },
    {
      code: 'too_big',
      issue: {
        maximum: 10,
        inclusive: false,
        exact: false,
        path: ['field'],
        origin: 'zod',
        message: 'Field must be less than 10 characters long'
      },
      expectedParams: { maximum: 10, inclusive: false, exact: false }
    },
    {
      code: 'invalid_format',
      issue: {
        validation: 'email',
        regex: /@/,
        path: ['field'],
        origin: 'zod',
        message: 'Field must be a valid email address'
      },
      expectedParams: { validation: 'email', regex: /@/ }
    },
    {
      code: 'not_multiple_of',
      issue: { multipleOf: 5, path: ['field'], origin: 'zod', message: 'Field must be a multiple of 5' },
      expectedParams: { multipleOf: 5 }
    },
    {
      code: 'unrecognized_keys',
      issue: {
        keys: ['foo', 'bar'],
        path: ['field'],
        origin: 'zod',
        message: 'Field must not contain unrecognized keys'
      },
      expectedParams: { keys: 'foo, bar' }
    },
    {
      code: 'invalid_union',
      issue: {
        unionErrors: [new ZodError([]), new ZodError([])],
        path: ['field'],
        origin: 'zod',
        message: 'Field must be a valid union'
      },
      expectedParams: { unionErrors: 2 }
    },
    {
      code: 'invalid_key',
      issue: { key: 'unexpected', path: ['field'], origin: 'zod', message: 'Field must not contain unexpected keys' },
      expectedParams: { key: 'unexpected' }
    },
    {
      code: 'invalid_element',
      issue: {
        index: 1,
        element: { foo: 'bar' },
        path: ['field'],
        origin: 'zod',
        message: 'Field must not contain invalid elements'
      },
      expectedParams: { index: 1, element: { foo: 'bar' } }
    },
    {
      code: 'invalid_value',
      issue: { expected: 'A', received: 'B', path: ['field'], origin: 'zod', message: 'Field must be a valid value' },
      expectedParams: { expected: 'A', received: 'B' }
    },
    {
      code: 'custom',
      issue: { params: { reason: 'Invalid' }, message: 'Custom message', path: ['field'], origin: 'zod' },
      expectedParams: { params: JSON.stringify({ reason: 'Invalid' }), message: 'Custom message' }
    }
  ];

  it.each(cases)('passes expected params to generic translation for %s', ({ code, issue, expectedParams }) => {
    mockGet.mockImplementation((key, params = {}) =>
      key === `validations.generic.${code}`
        ? renderTemplate(
            enTranslations.validations.generic[code as keyof typeof enTranslations.validations.generic],
            params as Record<string, unknown>
          )
        : null
    );

    const error = createError({
      code,
      ...issue
    } as z.core.$ZodIssue);

    const result = mapZodErrorsToTranslations(error);
    const call = mockGet.mock.calls.find(([calledKey]) => calledKey === `validations.generic.${code}`);

    expect(call?.[0]).toBe(`validations.generic.${code}`);
    expect(call?.[1]).toEqual(
      expect.objectContaining({
        field: 'field',
        code,
        ...expectedParams
      })
    );

    const renderedMessage = renderTemplate(
      enTranslations.validations.generic[code as keyof typeof enTranslations.validations.generic],
      (call?.[1] ?? {}) as Record<string, unknown>
    );

    expect(result).toEqual({ field: renderedMessage });
  });
});
