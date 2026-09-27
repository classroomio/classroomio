import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface LessonAcknowledgmentOptions {
  description?: string;
}

/**
 * Lesson Acknowledgment Plugin.
 * Enforces compliance / understanding confirmation at the end of lessons.
 */
export function lessonAcknowledgment(options: LessonAcknowledgmentOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'activity_lesson_acknowledgment',
    name: 'Lesson Acknowledgment',
    version: '1.0.0',
    category: 'activity',
    activation: {
      kind: 'org-capability',
      capabilityId: 'lesson_acknowledgment',
      nameKey: 'plugins.lesson_acknowledgment.name',
      descriptionKey: 'plugins.lesson_acknowledgment.description'
    },
    description:
      options.description ??
      'Adds a learner compliance acknowledgment checkbox and audit log at the bottom of lessons.',
    slots: {
      'lesson.after': () => import('./components/lesson-acknowledgment-box.svelte')
    }
  });
}

export default lessonAcknowledgment;
