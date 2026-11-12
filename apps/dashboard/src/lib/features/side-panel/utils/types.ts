import type { Component } from 'svelte';

export type SidePanelScope = 'course' | 'lesson';

export type SidePanelMode = 'docked' | 'floating';

export interface SidePanelFloatingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
  /** Opt-in floating window support. Only floatable panels can use floating mode. */
  floatable?: boolean;
  /** localStorage key for the floating window state. Required when floatable is true. */
  floatingStorageKey?: string;
  /** Default floating width in rem, resolved against the document root font size. */
  defaultFloatingWidthRem?: number;
  defaultFloatingWidth?: number;
  defaultFloatingHeight?: number;
  minFloatingWidth?: number;
  minFloatingHeight?: number;
}
