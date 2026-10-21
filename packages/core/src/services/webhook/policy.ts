import { env } from '../../config/env';
import type { TWebhookUrlPolicy } from './url-guard';

/**
 * Private-network destinations are allowed only on self-hosted installs that opt in explicitly.
 */
export function getWebhookUrlPolicy(): TWebhookUrlPolicy {
  const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';

  return { allowPrivateNetworks: isSelfHosted && env.WEBHOOK_ALLOW_PRIVATE_NETWORKS === 'true' };
}
