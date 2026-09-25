import type { PluginDefinition } from '@cio/sdk';

import { linkedinCertificate } from './integration/linkedin-certificate/index.js';
import { modernGoldCertificate } from './certificate/certificate-modern-gold/index.js';
import { certificateStudio } from './certificate/certificate-studio/index.js';

/** First-party plugins enabled in both dashboard and API runtimes. */
export const configuredPlugins: PluginDefinition[] = [
  linkedinCertificate(),
  modernGoldCertificate(),
  certificateStudio()
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

export { pluginJournal, type PluginJournal, type PluginJournalEntry } from './meta/index.js';
