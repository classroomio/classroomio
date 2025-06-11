import { Context, Hono } from 'hono';
import {ZCourseDownloadContent } from '$src/types/course';
import { generateCoursePdf } from '$src/utils/course';


export const courseDownloadRouter = new Hono();

courseDownloadRouter.post('/download', async (c: Context) => {
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
  