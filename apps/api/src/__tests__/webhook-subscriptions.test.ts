import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
  process.env.PUBLIC_IS_SELFHOSTED = 'false';
});

import type { TOrganizationApiKey } from '@cio/db/types';
import { encryptWebhookSecret } from '@cio/core/services/webhook/secret';

const queries = vi.hoisted(() => ({
  upsertManagedWebhookSubscription: vi.fn(),
  deleteManagedWebhookSubscription: vi.fn()
}));

const cache = vi.hoisted(() => ({
  refreshOrgHasWebhookEndpoints: vi.fn()
}));

vi.mock('@cio/db/queries/webhook', () => queries);
vi.mock('@cio/core/services/webhook/endpoint-cache', () => cache);
vi.mock('@cio/core/services/webhook/url-guard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/core/services/webhook/url-guard')>()),
  resolveWebhookTarget: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('@api/services/webhook/webhook', () => ({ assertWebhooksAllowed: vi.fn() }));
vi.mock('@api/services/product-events', () => ({ captureZapierTriggerSubscribed: vi.fn() }));
vi.mock('@api/services/v1/shared', () => ({
  assertAutomationActor: vi.fn(),
  assertOrgAdmin: vi.fn(),
  assertCourseBelongsToOrganization: vi.fn(),
  assertCohortBelongsToOrganization: vi.fn()
}));
vi.mock('@cio/core/config/env', () => ({
  env: {
    ZAPIER_OAUTH_CLIENT_ID: 'zapier-client',
    PRIVATE_SERVER_KEY: 'unit-test-server-key'
  }
}));

const { createWebhookSubscriptionService, deleteWebhookSubscriptionService } = await import(
  '@api/services/v1/webhooks/subscriptions'
);

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const ACTOR_ID = '00000000-0000-4000-8000-000000000002';
const CONSENT_ID = '00000000-0000-4000-8000-000000000003';
const TARGET_URL = 'https://hooks.zapier.com/hooks/standard/1/abc/';

function oauthPrincipal(clientId = 'zapier-client') {
  return {
    automationKey: { id: 'key-1', oauthConsentId: CONSENT_ID, scopes: [] } as unknown as TOrganizationApiKey,
    oauthClientId: clientId
  };
}

function storedSubscription(eventType = 'course.member.added', secret = 'whsec_sample_secret_key_123456789012') {
  return {
    id: '00000000-0000-4000-8000-000000000004',
    eventTypes: [eventType],
    payloadUrl: TARGET_URL,
    filterCourseId: null,
    filterCohortId: null,
    secretCiphertext: encryptWebhookSecret(secret),
    createdAt: '2026-10-30T00:00:00.000Z'
  };
}

describe('createWebhookSubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects automation keys', async () => {
    const principal = {
      automationKey: { id: 'key-1', oauthConsentId: null } as unknown as TOrganizationApiKey,
      oauthClientId: null
    };

    await expect(
      createWebhookSubscriptionService(ORG_ID, ACTOR_ID, principal, {
        targetUrl: TARGET_URL,
        eventType: 'course.completed'
      })
    ).rejects.toMatchObject({ code: 'OAUTH_CONNECTION_REQUIRED', statusCode: 403 });
  });

  it('rejects hosts that are not registered for the client', async () => {
    await expect(
      createWebhookSubscriptionService(ORG_ID, ACTOR_ID, oauthPrincipal(), {
        targetUrl: 'https://example.com/hook',
        eventType: 'course.completed'
      })
    ).rejects.toMatchObject({ code: 'WEBHOOK_URL_INVALID', field: 'targetUrl' });
  });

  it('rejects clients that may not subscribe at all', async () => {
    await expect(
      createWebhookSubscriptionService(ORG_ID, ACTOR_ID, oauthPrincipal('other-client'), {
        targetUrl: TARGET_URL,
        eventType: 'course.completed'
      })
    ).rejects.toMatchObject({ code: 'WEBHOOK_URL_INVALID' });
  });

  it('refuses to reuse a target URL for a different event', async () => {
    queries.upsertManagedWebhookSubscription.mockResolvedValue({
      subscription: storedSubscription('course.member.added'),
      created: false
    });

    await expect(
      createWebhookSubscriptionService(ORG_ID, ACTOR_ID, oauthPrincipal(), {
        targetUrl: TARGET_URL,
        eventType: 'course.completed'
      })
    ).rejects.toMatchObject({ code: 'WEBHOOK_SUBSCRIPTION_CONFLICT', statusCode: 409 });
  });

  it('creates subscription, decrypts secret, and refreshes the cache on success', async () => {
    const rawSecret = 'whsec_raw_secret_value_123456789012';
    queries.upsertManagedWebhookSubscription.mockResolvedValue({
      subscription: storedSubscription('course.completed', rawSecret),
      created: true
    });

    const result = await createWebhookSubscriptionService(ORG_ID, ACTOR_ID, oauthPrincipal(), {
      targetUrl: TARGET_URL,
      eventType: 'course.completed'
    });

    expect(result.created).toBe(true);
    expect(result.subscription.secret).toBe(rawSecret);
    expect(result.subscription.targetUrl).toBe(TARGET_URL);
    expect(cache.refreshOrgHasWebhookEndpoints).toHaveBeenCalledWith(ORG_ID);
  });
});

describe('deleteWebhookSubscriptionService', () => {
  it('returns 404 for a subscription the grant does not own', async () => {
    queries.deleteManagedWebhookSubscription.mockResolvedValue(false);

    await expect(
      deleteWebhookSubscriptionService(ORG_ID, oauthPrincipal(), { subscriptionId: storedSubscription().id })
    ).rejects.toMatchObject({ code: 'WEBHOOK_SUBSCRIPTION_NOT_FOUND', statusCode: 404 });
    expect(queries.deleteManagedWebhookSubscription).toHaveBeenCalledWith(CONSENT_ID, storedSubscription().id);
  });

  it('deletes subscription and refreshes the cache on success', async () => {
    queries.deleteManagedWebhookSubscription.mockResolvedValue(true);

    const result = await deleteWebhookSubscriptionService(ORG_ID, oauthPrincipal(), {
      subscriptionId: storedSubscription().id
    });

    expect(result).toEqual({ id: storedSubscription().id });
    expect(cache.refreshOrgHasWebhookEndpoints).toHaveBeenCalledWith(ORG_ID);
  });
});
