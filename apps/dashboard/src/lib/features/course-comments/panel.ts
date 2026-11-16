import type { Component } from 'svelte';
import type { SidePanelDefinition } from '$features/side-panel';
import CommentsPanel from './components/comments-panel.svelte';
import { COURSE_COMMENTS_PANEL_ID } from './utils/constants';

export const courseCommentsPanelDefinition: SidePanelDefinition = {
  id: COURSE_COMMENTS_PANEL_ID,
  titleKey: 'course_comments.panel.title',
  scope: 'course',
  component: CommentsPanel as Component<Record<string, unknown>>,
  defaultWidth: 380,
  minWidth: 320,
  maxWidth: 640,
  widthStorageKey: 'course-comments-panel-width'
};
