import type { PluginDefinition } from '@cio/sdk';

import { linkedinCertificate } from './integration/linkedin-certificate/index.js';
import { certificateStudio } from './certificate/certificate-studio/index.js';
import { announcementBanner } from './activity/announcement-banner/index.js';
import { lessonReadingTime } from './activity/lesson-reading-time/index.js';
import { completionCelebration } from './activity/completion-celebration/index.js';
import { learnerUpNext } from './activity/learner-up-next/index.js';
import { lessonAcknowledgment } from './activity/lesson-acknowledgment/index.js';

/** First-party plugins enabled in both dashboard and API runtimes. */
export const configuredPlugins: PluginDefinition[] = [
  linkedinCertificate(),
  certificateStudio(),
  announcementBanner(),
  lessonReadingTime(),
  completionCelebration(),
  learnerUpNext(),
  lessonAcknowledgment()
];

/**
 * ClassroomIO Plugins
 * Central barrel exporting all available first-party and in-tree plugins.
 */

export { linkedinCertificate, type LinkedInCertificateOptions } from './integration/linkedin-certificate/index.js';

export { certificateStudio, type CertificateStudioOptions } from './certificate/certificate-studio/index.js';

export { announcementBanner, type AnnouncementBannerOptions } from './activity/announcement-banner/index.js';

export { lessonReadingTime, type LessonReadingTimeOptions } from './activity/lesson-reading-time/index.js';

export { completionCelebration, type CompletionCelebrationOptions } from './activity/completion-celebration/index.js';

export { learnerUpNext, type LearnerUpNextOptions } from './activity/learner-up-next/index.js';

export { lessonAcknowledgment, type LessonAcknowledgmentOptions } from './activity/lesson-acknowledgment/index.js';

export { pluginJournal, type PluginJournal, type PluginJournalEntry } from './meta/index.js';
