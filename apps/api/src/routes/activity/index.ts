import { Hono } from '@api/utils/hono';
import { activityContentRouter } from './content';
import { activityCoursesRouter } from './courses';
import { activityPlayerRouter } from './player';
import { packagesRouter } from './packages';
import { runtimeScormRouter } from './runtime-scorm';

export const activityRouter = new Hono()
  .route('/content', activityContentRouter)
  .route('/courses', activityCoursesRouter)
  .route('/packages', packagesRouter)
  .route('/scorm/runtime', runtimeScormRouter)
  .route('/', activityPlayerRouter);
