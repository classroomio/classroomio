import { Hono } from '@api/utils/hono';
import { coursesRouter } from './courses';
import { audienceRouter } from './audience';

export const v1Router = new Hono().route('/courses', coursesRouter).route('/audience', audienceRouter);
