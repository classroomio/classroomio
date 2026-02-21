import { Hono } from '@api/utils/hono';
import { createPaymentRequest } from '@api/services/course/payment-request';
import { handleError } from '@api/utils/errors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const ZPaymentRequest = z.object({
  studentEmail: z.string().email(),
  studentFullname: z.string().min(1)
});

export const paymentRequestRouter = new Hono()
  /**
   * POST /course/:courseId/payment-request
   * Creates a payment request and sends emails to teacher and student
   * No authentication required - public route for course landing pages
   */
  .post('/', zValidator('json', ZPaymentRequest), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');

      const result = await createPaymentRequest({
        courseId,
        studentEmail: data.studentEmail,
        studentFullname: data.studentFullname
      });

      return c.json(
        {
          success: true,
          data: result
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create payment request');
    }
  });
