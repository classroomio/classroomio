/**
 * BullMQ queue names. Always import from here so producers and workers stay
 * in sync, and so it's trivial to grep for everything that touches a queue.
 */
export const QUEUE_NAMES = {
  media: 'media',
  mediaTranscribe: 'media-transcribe',
  emails: 'emails',
  notifications: 'notifications',
  webhooks: 'webhooks',
  courseImports: 'course-imports',
  agentCourseGeneration: 'agent-course-generation',
  onboardingBootstrap: 'onboarding-bootstrap',
  maintenance: 'maintenance'
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * BullMQ job names within each queue. Workers route on `(queueName, jobName)`,
 * so keep the strings here too.
 */
export const JOB_NAMES = {
  media: {
    probeMetadata: 'probe-metadata',
    generateThumbnail: 'generate-thumbnail',
    extractAudio: 'extract-audio',
    compressVideo: 'compress-video'
  },
  mediaTranscribe: {
    transcribeAudio: 'transcribe-audio'
  },
  emails: {
    send: 'send'
  },
  notifications: {
    notifyCourseExercise: 'notify-course-exercise',
    sessionReminderScan: 'session-reminder-scan',
    notifyCourseSessionUpdate: 'notify-course-session-update'
  },
  webhooks: {
    deliver: 'deliver'
  },
  agentCourseGeneration: {
    run: 'run'
  },
  maintenance: {
    retentionCompact: 'retention-compact',
    deadLetterCleanup: 'dead-letter-cleanup',
    mediaJobReap: 'media-job-reap',
    analyticsDailyRollup: 'analytics-daily-rollup'
  }
} as const;
