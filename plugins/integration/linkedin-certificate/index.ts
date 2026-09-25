import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface LinkedInCertificateOptions {
  description?: string;
}

/**
 * LinkedIn Certificate Integration Plugin.
 * Allows students to add their issued certificates directly to their LinkedIn profile.
 */
export function linkedinCertificate(options: LinkedInCertificateOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'integration_linkedin_certificate',
    name: 'LinkedIn Certificate Integration',
    version: '1.0.0',
    category: 'integration',
    activation: {
      kind: 'org-capability',
      capabilityId: 'linkedin_certificate_sharing',
      nameKey: 'plugins.linkedin_certificate_sharing.name',
      descriptionKey: 'plugins.linkedin_certificate_sharing.description'
    },
    description:
      options.description ??
      'Allows students to attach their earned ClassroomIO certificates directly to their LinkedIn profile.',
    slots: {
      'certificate.actions': () => import('./components/linkedin-button.svelte')
    }
  });
}

export default linkedinCertificate;
