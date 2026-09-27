import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface LearnerUpNextOptions {
  description?: string;
}

/**
 * Learner Up Next Plugin.
 * Displays a smart resume banner on the course curriculum page pointing to the next incomplete lesson.
 */
export function learnerUpNext(options: LearnerUpNextOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'activity_learner_up_next',
    name: 'Learner Up Next',
    version: '1.0.0',
    category: 'activity',
    activation: {
      kind: 'org-capability',
      capabilityId: 'learner_up_next',
      nameKey: 'plugins.learner_up_next.name',
      descriptionKey: 'plugins.learner_up_next.description'
    },
    description: options.description ?? 'Displays a 1-click resume card with progress tracking on the course page.',
    slots: {
      'course.sidebar': () => import('./components/up-next-card.svelte')
    }
  });
}

export default learnerUpNext;
