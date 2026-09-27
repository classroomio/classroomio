import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface CompletionCelebrationOptions {
  description?: string;
}

/**
 * Course Completion Celebration Plugin.
 * Fires a lightweight canvas confetti celebration when students view their unlocked certificate.
 */
export function completionCelebration(options: CompletionCelebrationOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'activity_completion_celebration',
    name: 'Completion Celebration',
    version: '1.0.0',
    category: 'activity',
    activation: {
      kind: 'org-capability',
      capabilityId: 'completion_celebration',
      nameKey: 'plugins.completion_celebration.name',
      descriptionKey: 'plugins.completion_celebration.description'
    },
    description:
      options.description ??
      'Fires an celebratory confetti burst and shareable milestone badge upon course completion.',
    slots: {
      'certificate.actions': () => import('./components/celebration-widget.svelte')
    }
  });
}

export default completionCelebration;
