import './bootstrap';

import './workers/media';
import './workers/media-transcribe';
import './workers/emails';
import './workers/maintenance';
import './workers/agent-course-generation';

import { log } from './utils/logger';

log.info('all-workers-running', {
  workers: ['media', 'media-transcribe', 'emails', 'maintenance', 'agent-course-generation']
});
