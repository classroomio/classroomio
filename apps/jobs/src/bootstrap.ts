import 'dotenv/config';

import { env } from './config/env';
import { warnIfFfmpegMissing } from './utils/ffmpeg';
import { log } from './utils/logger';

void warnIfFfmpegMissing();

if (!env.REDIS_URL) {
  throw new Error('REDIS_URL is required to start a worker process.');
}

log.info('worker-bootstrap', {
  nodeEnv: env.NODE_ENV,
  pid: process.pid,
  hasOpenAi: Boolean(env.OPENAI_API_KEY)
});

process.on('uncaughtException', (error) => {
  log.error('uncaught-exception', { message: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason) => {
  log.error('unhandled-rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
});
