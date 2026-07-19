import type { Component } from 'svelte';

import type { SidePanelDefinition } from '$features/side-panel';
import { sidePanel } from '$features/side-panel';
import LessonNoteSidePanel from './components/lesson-note-side-panel.svelte';
import NoteAiPanel from './components/doc-ai-panel.svelte';
import NoteCommentsSidePanel from './components/doc-comments-side-panel.svelte';
import { LESSON_NOTE_PANEL_ID } from './utils/open-lesson-note';

export const DOC_AI_PANEL_ID = 'note-ai-assistant';
export const DOC_COMMENTS_PANEL_ID = 'doc-comments';

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
  id: DOC_AI_PANEL_ID,
  titleKey: 'side_panel.titles.note_ai',
  scope: 'docs',
  component: NoteAiPanel as Component<Record<string, unknown>>,
  defaultWidth: 380,
  minWidth: 320,
  maxWidth: 560,
  widthStorageKey: 'doc-ai-panel-width'
};

export type NoteAiPanelProps = {
  docId: string;
  docTitle?: string;
  getNoteContent?: () => string;
  getSelectedText?: () => string;
  onReviewComplete?: (content: string) => void;
  onPanelClose?: () => void;
};

export function openNoteAiPanel(props: NoteAiPanelProps) {
  sidePanel.open(DOC_AI_PANEL_ID, props);
}

export function openNoteAiFromAskAi(props: NoteAiPanelProps) {
  openNoteAiPanel(props);
}

export const noteCommentsPanelDefinition: SidePanelDefinition = {
  id: DOC_COMMENTS_PANEL_ID,
  titleKey: 'side_panel.titles.note_comments',
  scope: 'docs',
  component: NoteCommentsSidePanel as Component<Record<string, unknown>>,
  defaultWidth: 380,
  minWidth: 320,
  maxWidth: 520,
  widthStorageKey: 'doc-comments-panel-width'
};

export function openNoteCommentsPanel() {
  sidePanel.open(DOC_COMMENTS_PANEL_ID);
}

export function toggleNoteCommentsPanel() {
  sidePanel.toggle(DOC_COMMENTS_PANEL_ID);
}
