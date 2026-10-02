import { Hono } from '@api/utils/hono';
import { v1CourseCertificateRouter, v1CourseCertificatesRouter } from './certificates';
import { v1CourseContentRouter } from './content';
import { v1CourseRouter } from './course';
import { v1CourseInvitesRouter } from './invites';
import { v1CourseLessonCommentsRouter } from './lesson-comments';
import { v1CourseLessonHistoryRouter, v1CourseLessonTranslationsRouter } from './lesson-translations';
import { v1CourseLessonsRouter } from './lessons';
import { v1CourseMembersRouter } from './members';
import { v1CourseSectionsRouter } from './sections';

export const v1CoursesRouter = new Hono()
  .route('/', v1CourseRouter)
  .route('/:courseId/members', v1CourseMembersRouter)
  .route('/:courseId/invites', v1CourseInvitesRouter)
  .route('/:courseId/certificate', v1CourseCertificateRouter)
  .route('/:courseId/certificates', v1CourseCertificatesRouter)
  .route('/:courseId/sections', v1CourseSectionsRouter)
  .route('/:courseId/lessons/:lessonId/translations', v1CourseLessonTranslationsRouter)
  .route('/:courseId/lessons/:lessonId/history', v1CourseLessonHistoryRouter)
  .route('/:courseId/lessons/:lessonId/comments', v1CourseLessonCommentsRouter)
  .route('/:courseId/lessons', v1CourseLessonsRouter)
  .route('/:courseId/content', v1CourseContentRouter);
