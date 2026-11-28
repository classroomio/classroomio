import { describe, expect, it } from 'vitest';
import { zValidator } from '@hono/zod-validator';
import { ZUuid } from '@cio/utils/validation';
import { z } from 'zod';

import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';

import { invalidCourseIdHook, invalidIdResponse } from './id-validation';

const COURSE_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

const app = new Hono()
  .get('/course/:courseId', zValidator('param', z.object({ courseId: ZUuid }), invalidCourseIdHook), (c) =>
    c.json({ success: true })
  )
  .get('/label/:label', (c) => invalidIdResponse(c, c.req.param('label')));

describe('invalidCourseIdHook', () => {
  it('answers a malformed course id with the same 400 body the middlewares send', async () => {
    const response = await app.request('/course/not-a-uuid');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Invalid course ID',
      code: ErrorCodes.VALIDATION_ERROR
    });
  });

  it('lets a well-formed course id through', async () => {
    const response = await app.request(`/course/${COURSE_ID}`);

    expect(response.status).toBe(200);
  });
});

describe('invalidIdResponse', () => {
  it('names the id that is malformed', async () => {
    const response = await app.request('/label/cohort');

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('Invalid cohort ID');
  });
});
