import * as Sentry from '@sentry/sveltekit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

const isEnabled = () =>
  Boolean(env.PUBLIC_SENTRY_DSN?.trim()) && !dev && env.PUBLIC_IS_SELFHOSTED !== 'true';

export type SentryUser = {
  id: string;
  email?: string | null;
  username?: string | null;
  fullname?: string | null;
};

export const setSentryUser = (user: SentryUser): void => {
  if (!isEnabled()) return;

  Sentry.setUser({
    id: user.id,
    ...(user.email && { email: user.email }),
    ...(user.username && { username: user.username }),
    ...(user.fullname && { fullname: user.fullname })
  });
};

export const clearSentryUser = (): void => {
  if (!isEnabled()) return;

  Sentry.setUser(null);
};
