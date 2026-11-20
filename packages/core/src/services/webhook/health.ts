import { getOrganizationAdminEmails, getOrganizationById } from '@cio/db/queries/organization';
import { getWebhookEndpointById, type TWebhookHealthTransition } from '@cio/db/queries/webhook';
import { enqueueEmailSend } from '@cio/jobs';
import {
  WEBHOOK_AUTO_DISABLE_FAILURE_THRESHOLD,
  WEBHOOK_DEGRADED_FAILURE_THRESHOLD
} from '@cio/utils/constants/webhook';

import { getAppBaseUrl } from '../../config/dashboard-url';

function toDestinationHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * Emails the org's admins when an endpoint becomes "Failing" or is auto-disabled. Never throws:
 * a failed notification must not fail the delivery that triggered it.
 */
export async function notifyWebhookHealthChange(
  webhookId: string,
  transition: Exclude<TWebhookHealthTransition, null>,
  deliveryId: string
): Promise<void> {
  try {
    const endpoint = await getWebhookEndpointById(webhookId);

    if (!endpoint) return;

    const organization = await getOrganizationById(endpoint.organizationId);

    if (!organization) return;

    const admins = await getOrganizationAdminEmails(endpoint.organizationId);
    const webhooksUrl = `${getAppBaseUrl()}/org/${organization.siteName}/automation/webhooks`;
    const baseFields = {
      orgName: organization.name,
      webhookName: endpoint.name,
      destination: toDestinationHost(endpoint.payloadUrl),
      webhooksUrl
    };
    const template = transition === 'disabled' ? 'webhookDisabled' : 'webhookFailing';
    const fields =
      transition === 'disabled'
        ? { ...baseFields, failureCount: WEBHOOK_AUTO_DISABLE_FAILURE_THRESHOLD }
        : {
            ...baseFields,
            failureCount: WEBHOOK_DEGRADED_FAILURE_THRESHOLD,
            disableAfter: WEBHOOK_AUTO_DISABLE_FAILURE_THRESHOLD
          };

    for (const admin of admins) {
      await enqueueEmailSend(
        {
          kind: 'template',
          template,
          to: admin.email,
          fields,
          organizationId: endpoint.organizationId
        },
        { idempotencyKey: `${template}:${deliveryId}:${admin.email}` }
      );
    }
  } catch (error) {
    console.error('notifyWebhookHealthChange error:', { webhookId, transition, error });
  }
}
