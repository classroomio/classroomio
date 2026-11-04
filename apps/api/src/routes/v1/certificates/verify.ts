import {
  ZPublicApiCertificateVerificationResponse,
  ZPublicApiVerifyCertificateParam
} from '@cio/utils/validation/public-api';
import {
  CERTIFICATE_VERIFY_MAX_REQUESTS,
  CERTIFICATE_VERIFY_MIN_RESPONSE_MS,
  DEFAULT_WINDOW_MS
} from '@api/constants/rate-limiter';

import { Hono } from '@api/utils/hono';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { certificateVerifyKeyGenerator } from '@api/utils/redis/key-generators';
import { describeRoute, validator } from 'hono-openapi';
import { handlePublicApiError } from '@api/utils/errors';
import { itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { settleNoSoonerThan } from '@api/utils/settle-no-sooner-than';
import { verifyPublicApiCertificateService } from '@api/services/v1/certificates/verify';

const TAG = 'Course Certificates';

const certificateVerifyRateLimit = createRateLimiter({
  windowMs: DEFAULT_WINDOW_MS,
  maxRequests: CERTIFICATE_VERIFY_MAX_REQUESTS,
  message: 'Too many certificate checks. Please try again later.',
  keyGenerator: certificateVerifyKeyGenerator,
  failClosed: true
});

export const v1CertificateVerifyRouter = new Hono().get(
  '/:verificationId',
  describeRoute({
    description:
      'Check that a certificate is real and still valid, and see the names and dates printed on it; no API key is needed.',
    tags: [TAG],
    security: [],
    responses: {
      200: jsonResponse(
        'The certificate exists; status says whether it is valid, expired or revoked',
        itemResponse(ZPublicApiCertificateVerificationResponse)
      ),
      400: { description: 'The verification id is not a UUID' },
      404: { description: 'No certificate has this verification id' },
      429: { description: `More than ${CERTIFICATE_VERIFY_MAX_REQUESTS} checks a minute from one IP address` },
      503: { description: 'The rate limit could not be checked; try again later' }
    }
  }),
  certificateVerifyRateLimit,
  validator('param', ZPublicApiVerifyCertificateParam),
  async (c) => {
    try {
      const params = c.req.valid('param');
      const certificate = await settleNoSoonerThan(
        verifyPublicApiCertificateService(params),
        CERTIFICATE_VERIFY_MIN_RESPONSE_MS
      );

      c.header('Cache-Control', 'public, max-age=60');

      return c.json({ success: true, data: certificate }, 200);
    } catch (error) {
      c.header('Cache-Control', 'no-store');

      return handlePublicApiError(c, error, 'Failed to verify certificate');
    }
  }
);
