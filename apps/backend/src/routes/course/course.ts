import { Hono } from 'hono';
import { katexRouter } from '$src/routes/course/katex';
import { lessonRouter } from '$src/routes/course/lesson';
import { presignRouter } from '$src/routes/course/presign';
import { courseDownloadRouter } from './download/course-content';
import { certificateDownloadRouter } from './download/certificate';

export const courseRouter = new Hono();

courseRouter.route('/katex', katexRouter);
courseRouter.route('/lesson', lessonRouter);
courseRouter.route('/presign', presignRouter);
courseRouter.route('/content', courseDownloadRouter);
courseRouter.route('/certificate', certificateDownloadRouter);


