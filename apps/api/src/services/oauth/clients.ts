import { env } from '@cio/core/config/env';
import { ZAPIER_HOOK_HOSTS } from '@cio/utils/constants/zapier';

export type TConnectedAppKind = 'zapier' | 'app';

export function getZapierOAuthClientId(): string | null {
  return env.ZAPIER_OAUTH_CLIENT_ID ?? null;
}

export function getConnectedAppKind(clientId: string): TConnectedAppKind {
  return env.ZAPIER_OAUTH_CLIENT_ID !== undefined && clientId === env.ZAPIER_OAUTH_CLIENT_ID ? 'zapier' : 'app';
}

/**
 * Hosts a connected app may point webhook subscriptions at; empty when the client may not subscribe.
 */
export function getSubscriptionHostsForClient(clientId: string): readonly string[] {
  return getConnectedAppKind(clientId) === 'zapier' ? ZAPIER_HOOK_HOSTS : [];
}

export function getSubscriptionNamePrefix(clientId: string): string {
  return getConnectedAppKind(clientId) === 'zapier' ? 'Zapier' : 'Connected app';
}
