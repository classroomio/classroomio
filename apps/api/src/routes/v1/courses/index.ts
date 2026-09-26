import { Hono } from '@api/utils/hono';
import { v1CourseCertificateRouter, v1CourseCertificatesRouter } from './certificates';
import { v1CourseRouter } from './course';
import { v1CourseInvitesRouter } from './invites';
import { v1CourseMembersRouter } from './members';

export const v1CoursesRouter = new Hono()
  .route('/', v1CourseRouter)
  .route('/:courseId/members', v1CourseMembersRouter)
  .route('/:courseId/invites', v1CourseInvitesRouter)
  .route('/:courseId/certificate', v1CourseCertificateRouter)
  .route('/:courseId/certificates', v1CourseCertificatesRouter);
