import { Hono } from '@api/utils/hono';
import { createPaymentRequest } from '@api/services/course/payment-request';
import { handleError } from '@api/utils/errors';
import { z } from 'zod';

const ZPaymentRequest = z.object({
  courseId: z.string().min(1),
  studentEmail: z.string().email(),
  studentFullname: z.string().min(1)
});

export const paymentRequestRouter = new Hono()
  /**
   * POST /course/payment-request
   * Creates a payment request and sends emails to teacher and student
   * No authentication required - public route for course landing pages
   */
  .post('/', async (c) => {
    try {
      const body = await c.req.json();
      const validatedData = ZPaymentRequest.parse(body);

      const result = await createPaymentRequest(validatedData);

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
