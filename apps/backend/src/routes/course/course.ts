import { Context, Hono } from 'hono';
import { ZCertificateDownload, ZCourseDownloadContent } from '$src/types/course';

import { generateCertificate } from '$src/utils/certificate';
import { generateCoursePdf } from '$src/utils/course';
import { katexRouter } from '$src/routes/course/katex';
import { lessonRouter } from '$src/routes/course/lesson';
import { presignRouter } from '$src/routes/course/presign';
import { z } from 'zod';

export const courseRouter = new Hono();

courseRouter.route('/katex', katexRouter);
courseRouter.route('/lesson', lessonRouter);
courseRouter.route('/presign', presignRouter);

courseRouter.post('/download/certificate', async (c: Context) => {
  try {
    const data = await c.req.json();

    const validatedData = ZCertificateDownload.parse(data);

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        400
      );
    }

    console.error('Error generating certificate:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      500
    );
  }
});

courseRouter.post('/download/content', async (c: Context) => {
  try {
    const data = await c.req.json();
    const validatedData = ZCourseDownloadContent.parse(data);

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
  } catch (error) {
    console.error('Error generating course PDF:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      400
    );
  }
});
