'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
require('dotenv/config');
var env_1 = require('./config/env');
var ffmpeg_1 = require('./utils/ffmpeg');
var logger_1 = require('./utils/logger');
void (0, ffmpeg_1.warnIfFfmpegMissing)();
if (!env_1.env.REDIS_URL) {
  throw new Error('REDIS_URL is required to start a worker process.');
}
logger_1.log.info('worker-bootstrap', {
  nodeEnv: env_1.env.NODE_ENV,
  pid: process.pid,
  hasOpenAi: Boolean(env_1.env.OPENAI_API_KEY)
});
process.on('uncaughtException', function (error) {
  logger_1.log.error('uncaught-exception', { message: error.message, stack: error.stack });
});
process.on('unhandledRejection', function (reason) {
  logger_1.log.error('unhandled-rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
});
