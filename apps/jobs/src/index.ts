import './bootstrap';

import './workers/media';
import './workers/media-transcribe';
import './workers/media-hls';
import './workers/youtube-captions';
import './workers/emails';
import './workers/notifications';
import './workers/webhooks';
import './workers/maintenance';
import './workers/agent-course-generation';
import './workers/personal-learning';

import { log } from './utils/logger';

log.info('all-workers-running', {
  workers: [
    'media',
    'media-transcribe',
    'media-hls',
    'youtube-captions',
    'emails',
    'notifications',
    'webhooks',
    'maintenance',
    'agent-course-generation',
    'personal-learning'
  ]
});
