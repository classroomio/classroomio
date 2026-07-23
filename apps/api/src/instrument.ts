/**
 * Must be imported as the FIRST thing in `apps/api/src/index.ts`. The Sentry
 * Node SDK relies on auto-instrumentation that hooks into Node's `require`
 * resolution and module loaders; any code that runs before this file initializes
 * Sentry will not be traced.
 */
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN?.trim();
const isProd = process.env.NODE_ENV === 'production';
const isSelfHosted = process.env.PUBLIC_IS_SELFHOSTED === 'true';

if (dsn && isProd && !isSelfHosted) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT?.trim() || 'production',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
    sendDefaultPii: false,
    // process-error-guards.ts registers handlers with transient Redis filtering.
    integrations(integrations) {
      return integrations.filter(
        (integration) =>
          integration.name !== 'OnUncaughtException' && integration.name !== 'OnUnhandledRejection'
      );
    }
  });
}
