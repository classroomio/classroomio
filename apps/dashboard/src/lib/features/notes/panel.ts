import type { Component } from 'svelte';

import type { SidePanelDefinition } from '$features/side-panel';
import LessonNoteSidePanel from './components/lesson-note-side-panel.svelte';
import { LESSON_NOTE_PANEL_ID } from './utils/open-lesson-note';

export const lessonNotePanelDefinition: SidePanelDefinition = {
  id: LESSON_NOTE_PANEL_ID,
  titleKey: 'side_panel.titles.lesson_note',
  scope: 'lesson',
  component: LessonNoteSidePanel as Component<Record<string, unknown>>,
  defaultWidth: 380,
  minWidth: 320,
  maxWidth: 520,
  widthStorageKey: 'lesson-note-panel-width'
};
