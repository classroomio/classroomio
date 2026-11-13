import { beforeAll, describe, expect, it } from 'vitest';
import { errors, type HttpResponse } from 'zapier-platform-core';

import packageJson from '../package.json' with { type: 'json' };
import { addRequestHeaders, handleApiErrors } from '../src/lib/http';

const APP_ORIGIN = 'https://app.example.test';
const API_ORIGIN = 'https://api.example.test';

const z = { errors } as any;

beforeAll(() => {
  process.env.CIO_APP_ORIGIN = APP_ORIGIN;
  process.env.CIO_API_ORIGIN = API_ORIGIN;
});

function createMockResponse(
  status: number,
  data: Record<string, unknown> = {},
  headers: Record<string, string> = {}
): HttpResponse {
  return {
    status,
    data,
    headers,
    getHeader: (name: string) => headers[name.toLowerCase()] ?? headers[name],
    skipThrowForStatus: false,
    throwForStatus: () => {},
    request: { url: 'https://api.example.test' },
    content: JSON.stringify(data)
  };
}

describe('HTTP middleware', () => {
  it('adds request headers including User-Agent and Authorization', () => {
    const request = { url: `${API_ORIGIN}/public-api/v1/courses`, headers: {} };
    const bundle = { authData: { access_token: 'secret-token' } } as any;

    const modified = addRequestHeaders(request, z, bundle);

    expect(modified.headers).toMatchObject({
      Accept: 'application/json',
      'User-Agent': `ClassroomIO-Zapier/${packageJson.version}`,
      Authorization: 'Bearer secret-token'
    });
  });

  it('omits Authorization header when token is missing', () => {
    const request = { url: `${API_ORIGIN}/public-api/v1/courses`, headers: {} };
    const bundle = { authData: {} } as any;

    const modified = addRequestHeaders(request, z, bundle);

    expect(modified.headers?.Authorization).toBeUndefined();
  });

  it('omits Authorization header on OAuth token requests even when access_token exists', () => {
    const request = { url: `${APP_ORIGIN}/api/auth/oauth2/token`, headers: {} };
    const bundle = { authData: { access_token: 'expired-token' } } as any;

    const modified = addRequestHeaders(request, z, bundle);

    expect(modified.headers?.Authorization).toBeUndefined();
  });

  it('omits Authorization header outside the public API on the API origin', () => {
    const request = { url: `${API_ORIGIN}/api/auth/oauth2/authorize`, headers: {} };
    const bundle = { authData: { access_token: 'secret-token' } } as any;

    const modified = addRequestHeaders(request, z, bundle);

    expect(modified.headers?.Authorization).toBeUndefined();
  });

  it('omits Authorization header when the public API path is served by another origin', () => {
    const request = { url: 'https://untrusted.example.test/public-api/v1/courses', headers: {} };
    const bundle = { authData: { access_token: 'secret-token' } } as any;

    const modified = addRequestHeaders(request, z, bundle);

    expect(modified.headers?.Authorization).toBeUndefined();
  });

  it('omits Authorization header when the public API prefix is only a substring of the path', () => {
    const request = { url: `${API_ORIGIN}/public-api/v1-evil/courses`, headers: {} };
    const bundle = { authData: { access_token: 'secret-token' } } as any;

    const modified = addRequestHeaders(request, z, bundle);

    expect(modified.headers?.Authorization).toBeUndefined();
  });

  it('passes 2xx responses through untouched', () => {
    const response = createMockResponse(200, { success: true });

    expect(handleApiErrors(response, z)).toBe(response);
  });

  it('throws RefreshAuthError on 401', () => {
    const response = createMockResponse(401, { error: 'Invalid token' });

    expect(() => handleApiErrors(response, z)).toThrow(errors.RefreshAuthError);
  });

  it('explains a read-only connection when an action needs a write scope', () => {
    const response = createMockResponse(403, { code: 'INSUFFICIENT_SCOPE', requiredScope: 'audience:write' });

    try {
      handleApiErrors(response, z);
      expect.unreachable('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('read-only');
      expect(error.message).toContain('"code":"ReadOnlyConnection"');
    }
  });

  it('keeps the API message when a missing scope is not a write scope', () => {
    const response = createMockResponse(403, {
      code: 'INSUFFICIENT_SCOPE',
      requiredScope: 'analytics:read',
      error: 'This connection was not granted the analytics:read permission'
    });

    expect(() => handleApiErrors(response, z)).toThrow('analytics:read');
  });

  it('throws PlanRequired Error when the plan gate blocks the public API', () => {
    const response = createMockResponse(403, {
      code: 'UPGRADE_REQUIRED',
      error: 'Public API keys require an Early Adopter or Enterprise plan'
    });

    try {
      handleApiErrors(response, z);
      expect.unreachable();
    } catch (error: any) {
      expect(error.message).toContain("This ClassroomIO organization's plan doesn't include Zapier");
      expect(error.message).toContain('"code":"PlanRequired"');
      expect(error.message).toContain('"status":403');
    }
  });

  it('shows the plan message when the webhooks plan gate refuses a subscription', () => {
    const response = createMockResponse(403, {
      code: 'UPGRADE_REQUIRED',
      error: 'Webhooks require an Early Adopter or Enterprise plan'
    });

    expect(() => handleApiErrors(response, z)).toThrow("This ClassroomIO organization's plan doesn't include Zapier");
  });

  it('passes a narrower upgrade prompt through instead of blaming the Zapier plan', () => {
    const response = createMockResponse(403, {
      code: 'UPGRADE_REQUIRED',
      error: 'This organization is not accepting new students right now'
    });

    try {
      handleApiErrors(response, z);
      expect.unreachable();
    } catch (error: any) {
      expect(error.message).toContain('This organization is not accepting new students right now');
      expect(error.message).not.toContain("plan doesn't include Zapier");
      expect(error.message).toContain('"code":"PlanRequired"');
    }
  });

  it('throws ThrottledError on 429 with retry-after header', () => {
    const response = createMockResponse(429, { error: 'Rate limit exceeded' }, { 'retry-after': '120' });

    expect(() => handleApiErrors(response, z)).toThrow(errors.ThrottledError);
  });

  it('throws field error on 400 when field is present in body', () => {
    const response = createMockResponse(400, { field: 'email', error: 'Invalid email address' });

    try {
      handleApiErrors(response, z);
      expect.unreachable();
    } catch (error: any) {
      expect(error.message).toContain('email: Invalid email address');
      expect(error.message).toContain('"code":"InvalidInput"');
      expect(error.message).toContain('"status":400');
    }
  });

  it('throws generic error for other statuses', () => {
    const response = createMockResponse(500, { message: 'Internal server error' });

    try {
      handleApiErrors(response, z);
      expect.unreachable();
    } catch (error: any) {
      expect(error.message).toContain('Internal server error');
      expect(error.message).toContain('"code":"Http500"');
      expect(error.message).toContain('"status":500');
    }
  });
});
