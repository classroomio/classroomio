import { env } from '../../config/env';

/** Push is off unless an Expo access token or an explicit opt-in is configured, so self-hosted installs fall back to in-app and email. */
export function isPushConfigured(): boolean {
  if (env.PUSH_NOTIFICATIONS_ENABLED === 'false') return false;

  return Boolean(env.EXPO_ACCESS_TOKEN) || env.PUSH_NOTIFICATIONS_ENABLED === 'true';
}

export function expoAccessToken(): string | undefined {
  return env.EXPO_ACCESS_TOKEN || undefined;
}
