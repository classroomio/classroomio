import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
  process.env.PUBLIC_IS_SELFHOSTED = 'true';
  process.env.WEBHOOK_ALLOW_PRIVATE_NETWORKS = 'true';
});

import { attemptWebhookDelivery } from '@cio/core/services/webhook/deliver';
import { encryptWebhookSecret } from '@cio/core/services/webhook/secret';
import { verifyWebhookSignature } from '@cio/core/services/webhook/signature';
import type { TWebhookEndpoint, TWebhookEvent } from '@cio/db/types';
import {
  WEBHOOK_MAX_ATTEMPTS,
  WEBHOOK_REQUEST_TIMEOUT_MS,
  WEBHOOK_RESPONSE_BODY_LIMIT,
  WEBHOOK_RETRY_DELAYS_MS
} from '@cio/utils/constants/webhook';

type CapturedRequest = { headers: http.IncomingHttpHeaders; body: string };

let server: http.Server;
let baseUrl: string;
let captured: CapturedRequest[] = [];
let respond: (response: http.ServerResponse) => void = (response) => response.end('ok');

const secret = 'whsec_integration_secret';

function buildEndpoint(path: string): TWebhookEndpoint {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    name: 'Test',
    payloadUrl: `${baseUrl}${path}`,
    secretCiphertext: encryptWebhookSecret(secret),
    secretLast4: secret.slice(-4),
    verifySsl: true,
    eventMode: 'all',
    isActive: true,
    consecutiveFailures: 0,
    autoDisabledAt: null,
    lastDeliveryStatus: null,
    lastDeliveryAt: null,
    createdByProfileId: null,
    updatedByProfileId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

const event: TWebhookEvent = {
  id: 'evt_abc',
  organizationId: '22222222-2222-4222-8222-222222222222',
  eventType: 'course.completed',
  payload: { id: 'evt_abc', type: 'course.completed', data: { courseId: 'c1' } },
  createdAt: new Date().toISOString()
};

beforeAll(async () => {
  server = http.createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      captured.push({ headers: request.headers, body: Buffer.concat(chunks).toString('utf8') });
      respond(response);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('attemptWebhookDelivery', () => {
  it('delivers a signed payload and reports success on 2xx', async () => {
    captured = [];
    respond = (response) => response.end('received');

    const result = await attemptWebhookDelivery(buildEndpoint('/ok'), { id: 'whd_1', attempt: 0 }, event);
    const request = captured[0]!;
    const timestamp = Number(request.headers['x-cio-timestamp']);

    expect(result.success).toBe(true);
    expect(result.attempt).toBe(1);
    expect(result.responseStatus).toBe(200);
    expect(result.nextAttemptAt).toBeNull();
    expect(request.headers['x-cio-event']).toBe('course.completed');
    expect(request.headers['x-cio-event-id']).toBe('evt_abc');
    expect(request.headers['x-cio-delivery']).toBe('whd_1');
    expect(request.body).toBe(JSON.stringify(event.payload));
    expect(
      verifyWebhookSignature(secret, timestamp, request.body, String(request.headers['x-cio-signature-256']))
    ).toBe(true);
  });

  it('stops reading an oversized response body and still reports the status', async () => {
    respond = (response) => {
      response.write(Buffer.alloc(WEBHOOK_RESPONSE_BODY_LIMIT * 8, 'a'));
      response.end();
    };

    const result = await attemptWebhookDelivery(buildEndpoint('/big'), { id: 'whd_big', attempt: 0 }, event);

    expect(result.responseStatus).toBe(200);
    expect(result.responseBody!.length).toBeLessThanOrEqual(WEBHOOK_RESPONSE_BODY_LIMIT + 32);
  });

  it('enforces a total deadline against a receiver that trickles bytes', async () => {
    respond = (response) => {
      response.writeHead(200);
      const interval = setInterval(() => response.write('x'), 2_000);
      response.on('close', () => clearInterval(interval));
    };

    const startedAt = Date.now();
    const result = await attemptWebhookDelivery(buildEndpoint('/slow'), { id: 'whd_slow', attempt: 0 }, event);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('timed out');
    expect(Date.now() - startedAt).toBeLessThan(WEBHOOK_REQUEST_TIMEOUT_MS + 3_000);
  }, 20_000);

  it('keeps the same event id on every attempt', async () => {
    captured = [];
    respond = (response) => response.end('ok');

    await attemptWebhookDelivery(buildEndpoint('/a'), { id: 'whd_2', attempt: 0 }, event);
    await attemptWebhookDelivery(buildEndpoint('/a'), { id: 'whd_2', attempt: 1 }, event);

    expect(captured.map((request) => request.headers['x-cio-event-id'])).toEqual(['evt_abc', 'evt_abc']);
  });

  it('schedules the first retry after 10 seconds on a 500', async () => {
    respond = (response) => {
      response.statusCode = 500;
      response.end('boom');
    };

    const before = Date.now();
    const result = await attemptWebhookDelivery(buildEndpoint('/fail'), { id: 'whd_3', attempt: 0 }, event);

    expect(result.success).toBe(false);
    expect(result.responseStatus).toBe(500);
    expect(result.errorMessage).toBe('Endpoint responded with HTTP 500');
    expect(result.nextAttemptAt!.getTime() - before).toBeGreaterThanOrEqual(WEBHOOK_RETRY_DELAYS_MS[0] - 50);
    expect(result.nextAttemptAt!.getTime() - before).toBeLessThan(WEBHOOK_RETRY_DELAYS_MS[0] + 2_000);
  });

  it('gives up after the final attempt', async () => {
    respond = (response) => {
      response.statusCode = 503;
      response.end('unavailable');
    };

    const result = await attemptWebhookDelivery(
      buildEndpoint('/fail'),
      { id: 'whd_4', attempt: WEBHOOK_MAX_ATTEMPTS - 1 },
      event
    );

    expect(result.success).toBe(false);
    expect(result.attempt).toBe(WEBHOOK_MAX_ATTEMPTS);
    expect(result.nextAttemptAt).toBeNull();
  });

  it('does not retry when retries are disabled (test sends)', async () => {
    respond = (response) => {
      response.statusCode = 500;
      response.end('boom');
    };

    const result = await attemptWebhookDelivery(buildEndpoint('/fail'), { id: 'whd_5', attempt: 0 }, event, {
      allowRetry: false
    });

    expect(result.success).toBe(false);
    expect(result.nextAttemptAt).toBeNull();
  });

  it('does not follow redirects and treats them as failures', async () => {
    captured = [];
    respond = (response) => {
      response.statusCode = 302;
      response.setHeader('Location', `${baseUrl}/elsewhere`);
      response.end();
    };

    const result = await attemptWebhookDelivery(buildEndpoint('/redirect'), { id: 'whd_6', attempt: 0 }, event);

    expect(result.success).toBe(false);
    expect(result.responseStatus).toBe(302);
    expect(captured).toHaveLength(1);
  });

  it('redacts sensitive values in the stored response body', async () => {
    respond = (response) => response.end('{"error":"denied","api_key":"super-secret-key"}');

    const result = await attemptWebhookDelivery(buildEndpoint('/body'), { id: 'whd_7', attempt: 0 }, event);

    expect(result.responseBody).toContain('[redacted]');
    expect(result.responseBody).not.toContain('super-secret-key');
  });

  it('reports a connection failure without throwing', async () => {
    const endpoint = { ...buildEndpoint('/x'), payloadUrl: 'http://127.0.0.1:1/unreachable' };

    const result = await attemptWebhookDelivery(endpoint, { id: 'whd_8', attempt: 0 }, event);

    expect(result.success).toBe(false);
    expect(result.responseStatus).toBeNull();
    expect(result.errorMessage).toBeTruthy();
    expect(result.nextAttemptAt).not.toBeNull();
  });
});
