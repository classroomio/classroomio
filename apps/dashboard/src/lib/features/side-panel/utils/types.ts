import type { Component } from 'svelte';

export type SidePanelScope = 'course' | 'lesson';

export interface SidePanelDefinition {
  id: string;
  /** i18n key for the panel header title. */
  titleKey: string;
  /**
   * Lesson-scoped panels close automatically when the route's lessonId changes.
   * Course-scoped panels stay open while the user navigates lessons in the same course.
   */
  scope: SidePanelScope;
  /** Body component rendered inside the rail. Receives the props passed to `open(id, props)`. */
  component: Component<Record<string, unknown>>;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  /** localStorage key for the panel's last user-resized width. */
  widthStorageKey: string;
}
