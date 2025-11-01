import { Hono } from 'hono';
import { TCourseClone,TCourseDownloadContent, TCertificateDownload, ZCertificateDownload, ZCourseDownloadContent } from '@api/types/course';

import { generateCertificate } from '@api/utils/certificate';
import { generateCoursePdf } from '@api/utils/course';
import { katexRouter } from '@api/routes/course/katex';
import { lessonRouter } from '@api/routes/course/lesson';
import { presignRouter } from '@api/routes/course/presign';
import { cloneRouter } from '@api/routes/course/clone';
import { zValidator } from '@hono/zod-validator';

export const courseRouter = new Hono()
  .post('/download/certificate', zValidator('json', ZCertificateDownload), async (c) => {
    const validatedData = (c.req.valid as (key: 'json') => TCertificateDownload)('json');

    const result = await generateCertificate(validatedData);

    c.header('Content-Type', 'application/pdf');
    c.header(
      'Content-Disposition',
      `attachment; filename="certificate-${validatedData.courseName}.pdf"`
    );

    return c.body(
      new ReadableStream({
        start(controller) {
          controller.enqueue(result);
          controller.close();
        }
      })
    );
  })
  .post('/download/content', zValidator('json', ZCourseDownloadContent), async (c) => {
    const validatedData = (c.req.valid as (key: 'json') => TCourseDownloadContent)('json');

    const pdfBuffer = await generateCoursePdf(validatedData);

    c.header('Content-Type', 'application/pdf');

    return c.body(
      new ReadableStream({
        start(controller) {
          controller.enqueue(pdfBuffer);
          controller.close();
        }
      })
    );
  })
  .route('/katex', katexRouter)
  .route('/lesson', lessonRouter)
  .route('/presign', presignRouter)
  .route('/clone', cloneRouter);
