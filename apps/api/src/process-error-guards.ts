import * as Sentry from '@sentry/node';

import { isTransientRedisError, logTransientRedisEvent } from '@cio/core/utils/redis/redis';

import { isTransientDatabaseError } from './utils/transient-database-error';

function reportTransientDatabaseError(kind: 'uncaughtException' | 'unhandledRejection', error: unknown): void {
  console.warn(`Ignoring transient database error from ${kind} (connections are re-established on next query):`, error);
  Sentry.captureException(error);
}

function reportFatalProcessError(kind: 'uncaughtException' | 'unhandledRejection', error: unknown): void {
  console.error(kind === 'uncaughtException' ? 'Uncaught exception:' : 'Unhandled rejection:', error);
  Sentry.captureException(error);
  void Sentry.flush(2000).finally(() => process.exit(1));
}

/**
 * Custom process guards (see instrument.ts: Sentry's default OnUncaughtException /
 * OnUnhandledRejection integrations are filtered out when Sentry inits so these
 * own flush/exit). Transient Redis and Postgres connection errors must not take down the API.
 */
export function registerProcessErrorGuards(): void {
  process.on('uncaughtException', (error) => {
    if (isTransientRedisError(error)) {
      logTransientRedisEvent('Ignoring transient Redis error (client will reconnect):', error);
      return;
    }

    if (isTransientDatabaseError(error)) {
      reportTransientDatabaseError('uncaughtException', error);
      return;
    }

    reportFatalProcessError('uncaughtException', error);
  });

  process.on('unhandledRejection', (reason) => {
    if (isTransientRedisError(reason)) {
      logTransientRedisEvent('Ignoring transient Redis rejection (client will reconnect):', reason);
      return;
    }

    if (isTransientDatabaseError(reason)) {
      reportTransientDatabaseError('unhandledRejection', reason);
      return;
    }

    reportFatalProcessError('unhandledRejection', reason);
  });
}
