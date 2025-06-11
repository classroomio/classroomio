import { Context, Hono } from 'hono';
import { ZCertificateDownload} from '$src/types/course';
import { generateCertificate } from '$src/utils/certificate';
import { z } from 'zod';

export const certificateDownloadRouter = new Hono();

certificateDownloadRouter.post('/download', async (c: Context) => {
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