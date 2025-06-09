import { Context, Hono } from 'hono';
import { ZCertificateDownload, ZLessonDownloadContent } from '$src/types/course/lesson';

import { generateLessonPdf } from '$src/utils/lesson';

export const lessonRouter = new Hono();

lessonRouter.post('/download/pdf', async (c: Context) => {
  try {
    const data = await c.req.json();
    const validatedData = ZLessonDownloadContent.parse(data);

    const pdfBuffer = await generateLessonPdf(validatedData);

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
    console.error('Error generating lesson PDF:', error);
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
