import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';

import { paymentRequestRouter } from './payment-request';

const mocks = vi.hoisted(() => ({
  createPaymentRequest: vi.fn()
}));

vi.mock('@api/services/course/payment-request', () => ({
  createPaymentRequest: mocks.createPaymentRequest
}));

const COURSE_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const body = JSON.stringify({ studentEmail: 'student@example.com', studentFullname: 'Ada Lovelace' });
const init = { method: 'POST', headers: { 'content-type': 'application/json' }, body };

function buildApp() {
  return new Hono().route('/course/:courseId/payment-request', paymentRequestRouter);
}

describe('POST /course/:courseId/payment-request', () => {
  beforeEach(() => {
    mocks.createPaymentRequest.mockReset();
    mocks.createPaymentRequest.mockResolvedValue({ id: 'request-1' });
  });

  it('answers 400 for a malformed course id, without creating a request', async () => {
    const response = await buildApp().request('/course/not-a-uuid/payment-request', init);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Invalid course ID',
      code: ErrorCodes.VALIDATION_ERROR
    });
    expect(mocks.createPaymentRequest).not.toHaveBeenCalled();
  });

  it('creates the request for a well-formed course id', async () => {
    const response = await buildApp().request(`/course/${COURSE_ID}/payment-request`, init);

    expect(response.status).toBe(200);
    expect(mocks.createPaymentRequest).toHaveBeenCalledWith({
      courseId: COURSE_ID,
      studentEmail: 'student@example.com',
      studentFullname: 'Ada Lovelace'
    });
  });
});
