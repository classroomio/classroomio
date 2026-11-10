import { describe, expect, it, vi } from 'vitest';
import type { TPlan } from '@cio/db/types';

import { Hono } from '@api/utils/hono';

vi.mock('@cio/core/config/env', () => ({
  env: { ZAPIER_OAUTH_CLIENT_ID: 'zapier-client', NODE_ENV: 'test' }
}));

import { getZapierRequestLimit, isZapierRequest, zapierRateLimitKey } from './zapier-rate-limit';

type TProbe = { isZapier: boolean; key: string; limit: number };

function buildApp(clientId: string | undefined, planName: TPlan | null) {
  return new Hono()
    .use('*', async (c, next) => {
      c.set('oauthClientId', clientId);
      c.set('oauthPlanName', planName);
      c.set('orgId', 'org-1');
      await next();
    })
    .all('/probe', (c) =>
      c.json({ isZapier: isZapierRequest(c), key: zapierRateLimitKey(c), limit: getZapierRequestLimit(c) })
    );
}

async function probe(method: string, clientId: string | undefined, planName: TPlan | null): Promise<TProbe> {
  const response = await buildApp(clientId, planName).request('/probe', { method });

  return response.json() as Promise<TProbe>;
}

describe('zapier rate limit', () => {
  it('applies the Early Adopter read and write limits per organization', async () => {
    await expect(probe('GET', 'zapier-client', 'EARLY_ADOPTER')).resolves.toEqual({
      isZapier: true,
      key: 'zapier:org-1:read',
      limit: 120
    });
    await expect(probe('POST', 'zapier-client', 'EARLY_ADOPTER')).resolves.toEqual({
      isZapier: true,
      key: 'zapier:org-1:write',
      limit: 40
    });
  });

  it('applies the Enterprise read and write limits', async () => {
    await expect(probe('GET', 'zapier-client', 'ENTERPRISE')).resolves.toMatchObject({ limit: 360 });
    await expect(probe('DELETE', 'zapier-client', 'ENTERPRISE')).resolves.toMatchObject({ limit: 120 });
  });

  it('leaves other connected apps and API keys on the shared limiter', async () => {
    await expect(probe('GET', 'other-client', 'ENTERPRISE')).resolves.toMatchObject({ isZapier: false });
    await expect(probe('GET', undefined, null)).resolves.toMatchObject({ isZapier: false, limit: 0 });
  });
});
