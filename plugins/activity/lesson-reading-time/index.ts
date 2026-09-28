import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface LessonReadingTimeOptions {
  description?: string;
}

/**
 * Lesson Reading Time & Focus Timer Plugin.
 * Calculates reading duration estimates and provides an unobtrusive focus stopwatch for students.
 */
export function lessonReadingTime(options: LessonReadingTimeOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'activity_lesson_reading_time',
    name: 'Lesson Reading Time',
    version: '1.0.0',
    category: 'activity',
    activation: {
      kind: 'org-capability',
      capabilityId: 'lesson_reading_time',
      nameKey: 'plugins.lesson_reading_time.name',
      descriptionKey: 'plugins.lesson_reading_time.description'
    },
    description:
      options.description ??
      'Displays estimated reading time and provides a focus stopwatch for students during lessons.',
    slots: {
      'lesson.after': () => import('./components/reading-time-widget.svelte')
    }
  });
}

export default lessonReadingTime;
