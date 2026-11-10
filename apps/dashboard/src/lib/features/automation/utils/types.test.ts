import { describe, expectTypeOf, it } from 'vitest';
import type { ConnectedApp, GetZapierOverviewRequest, ZapierConnection, ZapierOverview, ZapierTrigger } from './types';
import type { OAuthClientTrust, OAuthOrganization, OAuthScopeGroupKey } from '$features/oauth/utils/types';

describe('dashboard automation and oauth types', () => {
  it('types ConnectedApp with kind', () => {
    expectTypeOf<ConnectedApp>().toHaveProperty('kind');
    expectTypeOf<ConnectedApp['kind']>().toEqualTypeOf<'zapier' | 'app'>();
  });

  it('types ZapierOverview and nested triggers', () => {
    expectTypeOf<ZapierOverview>().toHaveProperty('connections');
    expectTypeOf<ZapierOverview>().toHaveProperty('limits');
    expectTypeOf<ZapierConnection>().toHaveProperty('triggers');
    expectTypeOf<ZapierTrigger>().toHaveProperty('eventType');
  });

  it('types OAuthClientTrust with clientId, trusted, and kind', () => {
    expectTypeOf<OAuthClientTrust>().toHaveProperty('clientId');
    expectTypeOf<OAuthClientTrust>().toHaveProperty('trusted');
    expectTypeOf<OAuthClientTrust>().toHaveProperty('kind');
  });

  it('types OAuthOrganization with eligible and reason', () => {
    expectTypeOf<OAuthOrganization>().toHaveProperty('eligible');
    expectTypeOf<OAuthOrganization>().toHaveProperty('reason');
  });

  it('includes webhooks in OAuthScopeGroupKey', () => {
    expectTypeOf<'webhooks'>().toMatchTypeOf<OAuthScopeGroupKey>();
  });
});
