import { Hono } from '@api/utils/hono';
import { v1CourseCertificateRouter, v1CourseCertificatesRouter } from './certificates';
import { v1CourseRouter } from './course';
import { v1CourseExercisesRouter } from './exercises';
import { v1CourseInvitesRouter } from './invites';
import { v1CourseMarksRouter } from './marks';
import { v1CourseMembersRouter } from './members';
import { v1CourseSubmissionsRouter } from './submissions';

export const v1CoursesRouter = new Hono()
  .route('/', v1CourseRouter)
  .route('/:courseId/members', v1CourseMembersRouter)
  .route('/:courseId/invites', v1CourseInvitesRouter)
  .route('/:courseId/certificate', v1CourseCertificateRouter)
  .route('/:courseId/certificates', v1CourseCertificatesRouter)
  .route('/:courseId/exercises', v1CourseExercisesRouter)
  .route('/:courseId/submissions', v1CourseSubmissionsRouter)
  .route('/:courseId/marks', v1CourseMarksRouter);
