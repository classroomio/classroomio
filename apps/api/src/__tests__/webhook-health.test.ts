import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
});

const mocks = vi.hoisted(() => ({
  getWebhookEndpointById: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationAdminEmails: vi.fn(),
  enqueueEmailSend: vi.fn()
}));

vi.mock('@cio/db/queries/webhook', () => ({ getWebhookEndpointById: mocks.getWebhookEndpointById }));
vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationById: mocks.getOrganizationById,
  getOrganizationAdminEmails: mocks.getOrganizationAdminEmails
}));
vi.mock('@cio/jobs', () => ({ enqueueEmailSend: mocks.enqueueEmailSend }));

import { notifyWebhookHealthChange } from '@cio/core/services/webhook/health';

const endpoint = {
  id: 'webhook-1',
  organizationId: 'org-1',
  name: 'CRM sync',
  payloadUrl: 'https://hooks.example.com/secret-token/path'
};

describe('notifyWebhookHealthChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getWebhookEndpointById.mockResolvedValue(endpoint);
    mocks.getOrganizationById.mockResolvedValue({ id: 'org-1', name: 'Acme', siteName: 'acme' });
    mocks.getOrganizationAdminEmails.mockResolvedValue([
      { email: 'a@acme.test', fullname: 'A' },
      { email: 'b@acme.test', fullname: 'B' }
    ]);
    mocks.enqueueEmailSend.mockResolvedValue('job-1');
  });

  it('sends the failing email to every admin without exposing the destination path', async () => {
    await notifyWebhookHealthChange('webhook-1', 'degraded', 'delivery-1');

    expect(mocks.enqueueEmailSend).toHaveBeenCalledTimes(2);
    const [payload, options] = mocks.enqueueEmailSend.mock.calls[0];
    expect(payload.template).toBe('webhookFailing');
    expect(payload.to).toBe('a@acme.test');
    expect(payload.fields.destination).toBe('hooks.example.com');
    expect(payload.fields.failureCount).toBe(20);
    expect(payload.fields.disableAfter).toBe(100);
    expect(payload.fields.webhooksUrl).toContain('/org/acme/automation/webhooks');
    expect(options.idempotencyKey).toBe('webhookFailing:delivery-1:a@acme.test');
  });

  it('sends the disabled email when the endpoint is auto-disabled', async () => {
    await notifyWebhookHealthChange('webhook-1', 'disabled', 'delivery-2');

    const [payload] = mocks.enqueueEmailSend.mock.calls[0];
    expect(payload.template).toBe('webhookDisabled');
    expect(payload.fields.failureCount).toBe(100);
  });

  it('never throws when the notification cannot be sent', async () => {
    mocks.enqueueEmailSend.mockRejectedValue(new Error('redis down'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(notifyWebhookHealthChange('webhook-1', 'degraded', 'delivery-3')).resolves.toBeUndefined();

    consoleError.mockRestore();
  });

  it('does nothing when the endpoint no longer exists', async () => {
    mocks.getWebhookEndpointById.mockResolvedValue(null);

    await notifyWebhookHealthChange('webhook-1', 'degraded', 'delivery-4');

    expect(mocks.enqueueEmailSend).not.toHaveBeenCalled();
  });
});
