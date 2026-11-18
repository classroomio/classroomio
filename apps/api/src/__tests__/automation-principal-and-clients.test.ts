import { describe, expect, it, vi } from 'vitest';

import type { TOrganizationApiKey } from '@cio/db/types';
import { ZAPIER_HOOK_HOSTS } from '@cio/utils/constants/zapier';
import { ErrorCodes } from '@cio/utils/constants/error-codes';

const { captureServerEventMock } = vi.hoisted(() => ({
  captureServerEventMock: vi.fn()
}));

vi.mock('@cio/core/services/posthog', () => ({
  captureServerEvent: captureServerEventMock,
  captureCourseEvent: vi.fn(),
  identifyOrganizationGroup: vi.fn(),
  isServerEventsEnabled: vi.fn().mockReturnValue(true),
  recordServerEvents: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({
  env: {
    ZAPIER_OAUTH_CLIENT_ID: 'zapier-client-id'
  }
}));

import {
  getConnectedAppKind,
  getSubscriptionHostsForClient,
  getSubscriptionNamePrefix
} from '../services/oauth/clients';
import { requireOAuthGrant, toAutomationPrincipal } from '../utils/automation-principal';
import { captureZapierTriggerSubscribed } from '../services/product-events';

describe('OAuth clients helpers', () => {
  it('identifies the Zapier client kind by client ID', () => {
    expect(getConnectedAppKind('zapier-client-id')).toBe('zapier');
    expect(getConnectedAppKind('other-client-id')).toBe('app');
  });

  it('restricts subscription hosts to Zapier hook hosts for Zapier, and empty for others', () => {
    expect(getSubscriptionHostsForClient('zapier-client-id')).toEqual(ZAPIER_HOOK_HOSTS);
    expect(getSubscriptionHostsForClient('other-client-id')).toEqual([]);
  });

  it('provides the correct subscription name prefix', () => {
    expect(getSubscriptionNamePrefix('zapier-client-id')).toBe('Zapier');
    expect(getSubscriptionNamePrefix('other-client-id')).toBe('Connected app');
  });
});

describe('automation principal', () => {
  const mockKey: TOrganizationApiKey = {
    id: 'key-123',
    organizationId: 'org-123',
    createdByProfileId: 'user-123',
    type: 'api',
    label: 'Test Key',
    secretPrefix: 'cio_',
    secretHash: 'hash',
    scopes: ['public_api:read'],
    oauthConsentId: 'consent-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null
  };

  it('throws 401 when automationKey is undefined', () => {
    expect(() => toAutomationPrincipal(undefined, undefined)).toThrowError(
      expect.objectContaining({ statusCode: 401, code: ErrorCodes.UNAUTHORIZED })
    );
  });

  it('constructs an automation principal when automationKey is provided', () => {
    const principal = toAutomationPrincipal(mockKey, 'client-xyz');
    expect(principal).toEqual({
      automationKey: mockKey,
      oauthClientId: 'client-xyz'
    });
  });

  it('narrows to an OAuth grant principal when oauthConsentId and oauthClientId are present', () => {
    const principal = toAutomationPrincipal(mockKey, 'client-xyz');
    const grant = requireOAuthGrant(principal);
    expect(grant).toEqual({
      oauthConsentId: 'consent-123',
      clientId: 'client-xyz',
      keyId: 'key-123'
    });
  });

  it('throws 403 OAUTH_CONNECTION_REQUIRED when oauthConsentId is missing', () => {
    const directApiKey = { ...mockKey, oauthConsentId: null };
    const principal = toAutomationPrincipal(directApiKey, 'client-xyz');
    expect(() => requireOAuthGrant(principal)).toThrowError(
      expect.objectContaining({ statusCode: 403, code: ErrorCodes.OAUTH_CONNECTION_REQUIRED })
    );
  });

  it('throws 403 OAUTH_CONNECTION_REQUIRED when oauthClientId is missing', () => {
    const principal = toAutomationPrincipal(mockKey, undefined);
    expect(() => requireOAuthGrant(principal)).toThrowError(
      expect.objectContaining({ statusCode: 403, code: ErrorCodes.OAUTH_CONNECTION_REQUIRED })
    );
  });
});

describe('captureZapierTriggerSubscribed product event', () => {
  it('captures the product event with expected payload', () => {
    captureZapierTriggerSubscribed({
      organizationId: 'org-456',
      profileId: 'prof-789',
      eventType: 'course.completed'
    });

    expect(captureServerEventMock).toHaveBeenCalledWith({
      event: 'zapier_trigger_subscribed',
      distinctId: 'prof-789',
      orgId: 'org-456',
      properties: {
        org_id: 'org-456',
        event_type: 'course.completed'
      }
    });
  });
});
