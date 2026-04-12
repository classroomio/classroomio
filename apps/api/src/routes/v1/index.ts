import { Hono } from '@api/utils/hono';
import { v1AudienceRouter } from './audience';
import { v1CoursesRouter } from './courses';

export const v1Router = new Hono().route('/audience', v1AudienceRouter).route('/courses', v1CoursesRouter);
