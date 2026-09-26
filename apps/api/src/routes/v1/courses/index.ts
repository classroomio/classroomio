import { Hono } from '@api/utils/hono';
import { automationKeyScopesMiddleware } from '@api/middlewares/automation-key-scopes';
import { v1CourseCertificateRouter, v1CourseCertificatesRouter } from './certificates';
import { v1CourseRouter } from './course';

export const v1CoursesRouter = new Hono()
  .route('/:courseId/certificate', v1CourseCertificateRouter)
  .route('/:courseId/certificates', v1CourseCertificatesRouter)
  .use('*', automationKeyScopesMiddleware(['public_api:*']))
  .route('/', v1CourseRouter);
