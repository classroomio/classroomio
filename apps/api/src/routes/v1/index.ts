import { Hono } from '@api/utils/hono';
import { publicApiCors } from '@api/middlewares/cors';
import { v1AudienceRouter } from './audience';
import { v1CoursesRouter } from './courses';

export const v1Router = new Hono()
  .use('*', publicApiCors)
  .route('/audience', v1AudienceRouter)
  .route('/courses', v1CoursesRouter);
