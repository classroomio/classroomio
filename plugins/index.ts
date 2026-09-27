import type { PluginDefinition } from '@cio/sdk';

import { linkedinCertificate } from './integration/linkedin-certificate/index.js';
import { modernGoldCertificate } from './certificate/certificate-modern-gold/index.js';
import { certificateStudio } from './certificate/certificate-studio/index.js';
import { announcementBanner } from './engagement/announcement-banner/index.js';
import { lessonReadingTime } from './learner/lesson-reading-time/index.js';
import { completionCelebration } from './engagement/completion-celebration/index.js';
import { learnerUpNext } from './learner/learner-up-next/index.js';
import { lessonAcknowledgment } from './compliance/lesson-acknowledgment/index.js';

/** First-party plugins enabled in both dashboard and API runtimes. */
export const configuredPlugins: PluginDefinition[] = [
  linkedinCertificate(),
  modernGoldCertificate(),
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

export {
  modernGoldCertificate,
  type ModernGoldCertificateOptions
} from './certificate/certificate-modern-gold/index.js';

export { linkedinCertificate, type LinkedInCertificateOptions } from './integration/linkedin-certificate/index.js';

export { certificateStudio, type CertificateStudioOptions } from './certificate/certificate-studio/index.js';

export { announcementBanner, type AnnouncementBannerOptions } from './engagement/announcement-banner/index.js';

export { lessonReadingTime, type LessonReadingTimeOptions } from './learner/lesson-reading-time/index.js';

export { completionCelebration, type CompletionCelebrationOptions } from './engagement/completion-celebration/index.js';

export { learnerUpNext, type LearnerUpNextOptions } from './learner/learner-up-next/index.js';

export { lessonAcknowledgment, type LessonAcknowledgmentOptions } from './compliance/lesson-acknowledgment/index.js';

export { pluginJournal, type PluginJournal, type PluginJournalEntry } from './meta/index.js';
