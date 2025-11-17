import { Hono } from '@api/utils/hono';
import { ZLessonDownloadContent } from '@cio/utils/validation/course';
import { generateLessonPdf } from '@api/utils/lesson';
import { zValidator } from '@hono/zod-validator';

export const lessonRouter = new Hono().post('/download/pdf', zValidator('json', ZLessonDownloadContent), async (c) => {
  const validatedData = c.req.valid('json');

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
});
