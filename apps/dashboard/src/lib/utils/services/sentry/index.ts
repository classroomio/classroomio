import { dev } from '$app/environment';
// import * as Sentry from '@sentry/browser';
// import { CaptureConsole } from '@sentry/integrations';

export const initSentry = (): void => {
  if (dev) return;

  // Sentry.init({
  //   dsn: 'https://c966f7e8cb1d4306be20b26bb4f0cc96@o476906.ingest.sentry.io/5999999',
  //   integrations: [
  //     new CaptureConsole({
  //       levels: ['error']
  //     }),
  //     new Sentry.Replay()
  //   ],
  //   environment: 'production',
  //   replaysSessionSampleRate: 0.5,
  //   replaysOnErrorSampleRate: 1.0
  // });
};

export const setSentryUser = (user: Record<string, any>): void => {
  if (dev) return;

  // Sentry.setUser(user);
};
