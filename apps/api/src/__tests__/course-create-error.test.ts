import { describe, expect, it, vi } from 'vitest';

import { createCourse } from '@cio/db/queries/course';
import { isUniqueConstraintViolation } from '@cio/utils/errors';

describe('createCourse errors', () => {
  it('keeps the database error as the cause so a taken slug stays a unique violation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const uniqueViolation = Object.assign(new Error('duplicate key value'), { code: '23505' });
    const client = {
      insert: () => ({ values: () => ({ returning: () => Promise.reject(uniqueViolation) }) })
    };

    const error = await createCourse({ title: 'Copy', slug: 'taken' } as never, client as never).catch((e) => e);

    expect(error.cause).toBe(uniqueViolation);
    expect(isUniqueConstraintViolation(error)).toBe(true);
  });
});
