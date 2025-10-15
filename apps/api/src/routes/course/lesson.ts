import { Hono } from 'hono';
import { TLessonDownloadContent, ZLessonDownloadContent } from '$src/types/course/lesson';
import { generateLessonPdf } from '$src/utils/lesson';
import { zValidator } from '@hono/zod-validator';

export const lessonRouter = new Hono().post(
  '/download/pdf',
  zValidator('json', ZLessonDownloadContent),
  async (c) => {
    const validatedData = (c.req.valid as (key: 'json') => TLessonDownloadContent)('json');

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
  }
);
