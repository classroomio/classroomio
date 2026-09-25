import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface CertificateStudioOptions {
  description?: string;
}

/**
 * Certificate Studio Plugin.
 * Modular visual builder and canvas designer for organization certificate presets.
 */
export function certificateStudio(options: CertificateStudioOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'certificate_studio',
    name: 'Certificate Studio',
    version: '1.0.0',
    category: 'certificate',
    activation: {
      kind: 'org-capability',
      capabilityId: 'certificate_studio',
      nameKey: 'plugins.certificate_studio.name',
      descriptionKey: 'plugins.certificate_studio.description'
    },
    description: options.description ?? 'Interactive visual certificate designer and template hub for organizations.',
    pluginNav: {
      titleKey: 'certificate_studio.sidebar_title',
      path: 'certificate-studio',
      icon: 'award',
      manageLabelKey: 'plugins.manage_templates',
      group: 'tools',
      adminOnly: true
    },
    routes: {
      '/': () => import('./components/certificate-templates-page.svelte'),
      '/editor': () => import('./components/certificate-studio-editor-page.svelte')
    }
  });
}

export default certificateStudio;
