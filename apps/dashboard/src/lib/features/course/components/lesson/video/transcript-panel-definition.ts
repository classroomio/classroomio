import type { Component } from 'svelte';

import type { SidePanelDefinition } from '$features/side-panel';
import TranscriptSidePanel from './transcript-side-panel.svelte';

export const TRANSCRIPT_PANEL_ID = 'transcript';

export const transcriptPanelDefinition: SidePanelDefinition = {
  id: TRANSCRIPT_PANEL_ID,
  titleKey: 'course.navItem.lessons.materials.tabs.video.transcript.title',
  scope: 'lesson',
  component: TranscriptSidePanel as Component<Record<string, unknown>>,
  defaultWidth: 380,
  minWidth: 320,
  maxWidth: 560,
  widthStorageKey: 'transcript-panel-width'
};
