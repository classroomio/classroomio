import * as Sentry from '@sentry/node';

import { isTransientRedisError } from '@cio/core/utils/redis/redis';

function reportFatalProcessError(kind: 'uncaughtException' | 'unhandledRejection', error: unknown): void {
  console.error(kind === 'uncaughtException' ? 'Uncaught exception:' : 'Unhandled rejection:', error);
  Sentry.captureException(error);
  void Sentry.flush(2000).finally(() => process.exit(1));
}

/**
 * Custom process guards (see instrument.ts: Sentry's default OnUncaughtException /
 * OnUnhandledRejection integrations are filtered out when Sentry inits so these
 * own flush/exit). Transient Redis maintenance errors must not take down the API.
 */
export function registerProcessErrorGuards(): void {
  process.on('uncaughtException', (error) => {
    if (isTransientRedisError(error)) {
      console.warn('Ignoring transient Redis error (client will reconnect):', error);
      return;
    }

    reportFatalProcessError('uncaughtException', error);
  });

  process.on('unhandledRejection', (reason) => {
    if (isTransientRedisError(reason)) {
      console.warn('Ignoring transient Redis rejection (client will reconnect):', reason);
      return;
    }

    reportFatalProcessError('unhandledRejection', reason);
  });
}
