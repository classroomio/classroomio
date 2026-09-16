import type { PluginDefinition } from '@cio/sdk';

import { linkedinCertificate } from './integration/linkedin-certificate/index.js';
import { modernGoldCertificate } from './certificate/certificate-modern-gold/index.js';

/**
 * Returns the first-party plugins enabled by the repository configuration.
 * Dashboard and API runtimes both consume this list so they cannot drift.
 * The factory form gives every caller a fresh array and fresh SDK-branded definitions.
 */
export function createConfiguredPlugins(): PluginDefinition[] {
  return [linkedinCertificate(), modernGoldCertificate()];
}

/**
 * ClassroomIO Plugins
 * Central barrel exporting all available first-party and in-tree plugins.
 */

export {
  modernGoldCertificate,
  type ModernGoldCertificateOptions
} from './certificate/certificate-modern-gold/index.js';

export { linkedinCertificate, type LinkedInCertificateOptions } from './integration/linkedin-certificate/index.js';
