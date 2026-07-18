import { describe, expect, it } from 'vitest';
import { z, ZodError } from 'zod';
import { Hono } from 'hono';

import { ZCourseType } from '@cio/utils/validation/course';
import { AppError, ErrorCodes, formatZodErrorMessage, handleError, handlePublicApiError } from '@api/utils/errors';

describe('formatZodErrorMessage', () => {
  it('formats issue paths and messages', () => {
    const schema = z.object({
      course: z.object({
        type: ZCourseType
      })
    });

    try {
      schema.parse({ course: { type: 'INVALID' } });
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      expect(formatZodErrorMessage(error as ZodError)).toContain('course.type:');
    }
  });
});

describe('handlePublicApiError', () => {
  const app = new Hono().get('/test', async (c) => {
    try {
      z.object({ allowNewStudent: z.boolean() }).parse({ allowNewStudent: undefined });
      return c.json({ success: true });
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to fetch course structure');
    }
  });

  it('returns validation details for ZodError instead of INTERNAL_ERROR', async () => {
    const response = await app.request('/test');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      error: expect.stringContaining('allowNewStudent'),
      code: ErrorCodes.VALIDATION_ERROR,
      field: 'allowNewStudent'
    });
  });

  it('delegates AppError handling to handleError', async () => {
    const errorApp = new Hono().get('/test', async (c) => {
      try {
        throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch course');
      }
    });

    const response = await errorApp.request('/test');
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      success: false,
      error: 'Course not found',
      code: ErrorCodes.COURSE_NOT_FOUND
    });
  });
});

describe('handleError', () => {
  it('maps postgres unique violations to 409 CONFLICT', async () => {
    const app = new Hono().get('/test', async (c) => {
      try {
        throw {
          name: 'DrizzleQueryError',
          message: 'Failed query',
          cause: {
            code: '23505',
            constraint_name: 'organizationmember_org_email_unique'
          }
        };
      } catch (error) {
        return handleError(c, error, 'Failed to create member');
      }
    });

    const response = await app.request('/test');
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      success: false,
      error: 'Resource already exists',
      code: ErrorCodes.CONFLICT
    });
  });
});
