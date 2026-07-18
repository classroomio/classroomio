import type { Component } from 'svelte';

import type { SidePanelDefinition } from '$features/side-panel';
import { sidePanel } from '$features/side-panel';
import LessonNoteSidePanel from './components/lesson-note-side-panel.svelte';
import NoteAiPanel from './components/note-ai-panel.svelte';
import NoteCommentsSidePanel from './components/note-comments-side-panel.svelte';
import { LESSON_NOTE_PANEL_ID } from './utils/open-lesson-note';

export const NOTE_AI_PANEL_ID = 'note-ai-assistant';
export const NOTE_COMMENTS_PANEL_ID = 'note-comments';

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

export function openNoteAiPanel(props: {
  noteId: string;
  noteTitle?: string;
  getNoteContent?: () => string;
  getSelectedText?: () => string;
  onReviewComplete?: (content: string) => void;
}) {
  sidePanel.open(NOTE_AI_PANEL_ID, props);
}

export const noteCommentsPanelDefinition: SidePanelDefinition = {
  id: NOTE_COMMENTS_PANEL_ID,
  titleKey: 'side_panel.titles.note_comments',
  scope: 'notes',
  component: NoteCommentsSidePanel as Component<Record<string, unknown>>,
  defaultWidth: 380,
  minWidth: 320,
  maxWidth: 520,
  widthStorageKey: 'note-comments-panel-width'
};

export function openNoteCommentsPanel() {
  sidePanel.open(NOTE_COMMENTS_PANEL_ID);
}

export function toggleNoteCommentsPanel() {
  sidePanel.toggle(NOTE_COMMENTS_PANEL_ID);
}
