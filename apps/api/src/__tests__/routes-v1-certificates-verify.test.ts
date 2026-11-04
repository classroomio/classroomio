import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

type LimiterOptions = { keyGenerator?: (c: Context) => string; maxRequests?: number; failClosed?: boolean };

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  limiterOptions: [] as LimiterOptions[],
  limit: vi.fn()
}));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '203.0.113.7' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: (options: LimiterOptions) => {
    mocks.limiterOptions.push(options);

    return async (c: Context, next: Next) => mocks.limit(options, c, next);
  }
}));

vi.mock('@api/services/organization/automation-key', () => ({
  authenticateOrganizationApiKeyService: mocks.authenticate,
  organizationApiKeyHasScopes: () => true,
  touchOrganizationApiKeyLastUsedService: vi.fn()
}));

vi.mock('@api/services/v1/certificates/verify', () => ({
  verifyPublicApiCertificateService: vi.fn()
}));

import { enrichPublicApiOpenApiSpec, PUBLIC_API_BEARER_SCHEME } from '@cio/utils/openapi/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { CERTIFICATE_VERIFY_MAX_REQUESTS, CERTIFICATE_VERIFY_MIN_RESPONSE_MS } from '@api/constants/rate-limiter';
import { certificateVerifyKeyGenerator } from '@api/utils/redis/key-generators';
import { verifyPublicApiCertificateService } from '@api/services/v1/certificates/verify';
import { v1Router } from '@api/routes/v1';

const VERIFICATION_ID = '33333333-3333-4333-8333-333333333333';
const VERIFY_PATH = `/public-api/v1/certificates/verify/${VERIFICATION_ID}`;

const app = new Hono().route('/public-api/v1', v1Router);

const certificate = {
  verificationId: VERIFICATION_ID,
  status: 'valid' as const,
  studentName: 'Ada Obi',
  courseTitle: 'Fire Safety',
  organizationName: 'Acme Academy',
  issuedAt: '2026-01-02 03:04:05+00',
  expiresAt: null,
  revokedAt: null
};

const verifyLimiterOptions = () => {
  const options = mocks.limiterOptions.find((entry) => entry.keyGenerator === certificateVerifyKeyGenerator);
  if (!options) throw new Error('certificate verify rate limiter was not created');

  return options;
};

beforeEach(() => {
  mocks.authenticate.mockReset();
  mocks.limit.mockReset();
  mocks.limit.mockImplementation((_options: LimiterOptions, _c: Context, next: Next) => next());
  vi.mocked(verifyPublicApiCertificateService).mockReset();
  vi.mocked(verifyPublicApiCertificateService).mockResolvedValue(certificate);
});

describe('GET /public-api/v1/certificates/verify/:verificationId', () => {
  it('answers without an API key and never runs the key check', async () => {
    const response = await app.request(VERIFY_PATH);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: certificate });
    expect(verifyPublicApiCertificateService).toHaveBeenCalledWith({ verificationId: VERIFICATION_ID });
    expect(mocks.authenticate).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60');
  });

  it('ignores an API key sent anyway', async () => {
    const response = await app.request(VERIFY_PATH, { headers: { Authorization: 'Bearer cio_api_invalid' } });

    expect(response.status).toBe(200);
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown id, no sooner than a real one, and is not cached', async () => {
    vi.mocked(verifyPublicApiCertificateService).mockRejectedValue(
      new AppError('Certificate not found', ErrorCodes.NOT_FOUND, 404)
    );
    const startedAt = performance.now();

    const response = await app.request(VERIFY_PATH);

    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(CERTIFICATE_VERIFY_MIN_RESPONSE_MS - 5);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.NOT_FOUND });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('waits the same minimum time before answering a real id', async () => {
    const startedAt = performance.now();

    await app.request(VERIFY_PATH);

    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(CERTIFICATE_VERIFY_MIN_RESPONSE_MS - 5);
  });

  it('returns 400 for an id that is not a UUID without looking it up', async () => {
    const response = await app.request('/public-api/v1/certificates/verify/not-a-uuid');

    expect(response.status).toBe(400);
    expect(verifyPublicApiCertificateService).not.toHaveBeenCalled();
  });

  it('limits checks to 30 a minute per IP address and fails closed', () => {
    const options = verifyLimiterOptions();
    const context = { req: { header: () => undefined }, env: {} } as unknown as Context;

    expect(options.maxRequests).toBe(CERTIFICATE_VERIFY_MAX_REQUESTS);
    expect(CERTIFICATE_VERIFY_MAX_REQUESTS).toBe(30);
    expect(options.failClosed).toBe(true);
    expect(options.keyGenerator?.(context)).toBe('certificate_verify:203.0.113.7');
  });

  it('runs the rate limit before the lookup', async () => {
    mocks.limit.mockImplementation((options: LimiterOptions, c: Context, next: Next) =>
      options.keyGenerator === certificateVerifyKeyGenerator ? c.json({ error: 'Too Many Requests' }, 429) : next()
    );

    const response = await app.request(VERIFY_PATH);

    expect(response.status).toBe(429);
    expect(verifyPublicApiCertificateService).not.toHaveBeenCalled();
  });

  it('still requires a key for any other path under /certificates', async () => {
    const response = await app.request('/public-api/v1/certificates');

    expect(response.status).toBe(401);
    expect(verifyPublicApiCertificateService).not.toHaveBeenCalled();
  });
});

describe('certificate verify OpenAPI entry', () => {
  it('is documented under Course Certificates with no key required, while other endpoints keep the bearer key', async () => {
    const spec = enrichPublicApiOpenApiSpec(await generateSpecs(app));
    const paths = spec.paths as Record<
      string,
      Record<string, { tags?: string[]; security?: unknown; summary?: string }>
    >;
    const verify = paths['/public-api/v1/certificates/verify/{verificationId}']?.get;
    const list = paths['/public-api/v1/courses/{courseId}/certificates']?.get;

    expect(verify?.tags).toEqual(['Course Certificates']);
    expect(verify?.summary).toBe('Verify a certificate');
    expect(verify?.security).toEqual([]);
    expect(list?.security).toEqual([{ [PUBLIC_API_BEARER_SCHEME]: [] }]);
  });
});
