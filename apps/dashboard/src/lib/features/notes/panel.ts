import type { Component } from 'svelte';

import type { SidePanelDefinition } from '$features/side-panel';
import { sidePanel } from '$features/side-panel';
import LessonNoteSidePanel from './components/lesson-note-side-panel.svelte';
import NoteAiPanel from './components/note-ai-panel.svelte';
import { LESSON_NOTE_PANEL_ID } from './utils/open-lesson-note';

export const NOTE_AI_PANEL_ID = 'note-ai-assistant';

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

export const noteAiPanelDefinition: SidePanelDefinition = {
  id: NOTE_AI_PANEL_ID,
  titleKey: 'side_panel.titles.note_ai',
  scope: 'notes',
  component: NoteAiPanel as Component<Record<string, unknown>>,
  defaultWidth: 380,
  minWidth: 320,
  maxWidth: 560,
  widthStorageKey: 'note-ai-panel-width'
};

export function openNoteAiPanel(props: { noteId: string; noteTitle?: string }) {
  sidePanel.open(NOTE_AI_PANEL_ID, props);
}

export function toggleNoteAiPanel(props: { noteId: string; noteTitle?: string }) {
  sidePanel.toggle(NOTE_AI_PANEL_ID, props);
}
