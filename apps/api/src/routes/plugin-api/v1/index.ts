import { Hono } from '@api/utils/hono';
import { pluginApiCertificatesRouter } from './certificates';
import { pluginApiCoursesRouter } from './courses';
import { pluginApiExercisesRouter } from './exercises';
import { pluginApiIdentityRouter } from './identity';
import { pluginApiLessonsRouter } from './lessons';
import { pluginApiOrganizationRouter } from './organization';
import { pluginApiStorageRouter } from './storage';

export const pluginApiV1Router = new Hono()
  .route('/identity', pluginApiIdentityRouter)
  .route('/organization', pluginApiOrganizationRouter)
  .route('/courses', pluginApiCoursesRouter)
  .route('/lessons', pluginApiLessonsRouter)
  .route('/exercises', pluginApiExercisesRouter)
  .route('/certificates', pluginApiCertificatesRouter)
  .route('/storage', pluginApiStorageRouter);
