'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
require('./bootstrap');
require('./workers/media');
require('./workers/media-transcribe');
require('./workers/emails');
require('./workers/maintenance');
var logger_1 = require('./utils/logger');
logger_1.log.info('all-workers-running', {
  workers: ['media', 'media-transcribe', 'emails', 'maintenance']
});
