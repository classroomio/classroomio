import { Hono } from '@api/utils/hono';
import { publicCourseRouter } from './public-course';
import { orgSiteOgRouter } from './og';
import { publicDocRouter } from './public-doc';

export * from './public-course';
export * from './lesson-markdown';
export * from './og';
export * from './public-doc';

export const orgSiteRouter = new Hono()
  .route('/course', publicCourseRouter)
  .route('/og', orgSiteOgRouter)
  .route('/doc', publicDocRouter);
