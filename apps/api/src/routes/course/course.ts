import { ZCertificateDownload, ZCourseDownloadContent } from '$src/types/course';

import { Hono } from 'hono';
import { generateCertificate } from '$src/utils/certificate';
import { generateCoursePdf } from '$src/utils/course';
import { katexRouter } from '$src/routes/course/katex';
import { lessonRouter } from '$src/routes/course/lesson';
import { presignRouter } from '$src/routes/course/presign';
import { zValidator } from '@hono/zod-validator';

export const courseRouter = new Hono()
  .post('/download/certificate', zValidator('json', ZCertificateDownload), async (c) => {
    const validatedData = c.req.valid('json');

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
    const validatedData = c.req.valid('json');

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
  .route('/presign', presignRouter);
