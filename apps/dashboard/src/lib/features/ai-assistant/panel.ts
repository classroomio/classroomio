import type { Component } from 'svelte';

import {
  AI_COURSE_CHAT_DEFAULT_WIDTH,
  AI_COURSE_CHAT_FLOATING_DEFAULT_HEIGHT,
  AI_COURSE_CHAT_FLOATING_DEFAULT_WIDTH_REM,
  AI_COURSE_CHAT_FLOATING_MIN_HEIGHT,
  AI_COURSE_CHAT_FLOATING_MIN_WIDTH,
  AI_COURSE_CHAT_FLOATING_STORAGE_KEY,
  AI_COURSE_CHAT_MAX_WIDTH,
  AI_COURSE_CHAT_MIN_WIDTH,
  AI_COURSE_CHAT_STORAGE_KEY
} from './utils/constants';
import { AI_ASSISTANT_PANEL_ID } from './utils/store';
import type { SidePanelDefinition } from '$features/side-panel';
import AiCourseChat from './ai-course-chat.svelte';

export const aiAssistantPanelDefinition: SidePanelDefinition = {
  id: AI_ASSISTANT_PANEL_ID,
  titleKey: 'side_panel.titles.ai_assistant',
  scope: 'course',
  component: AiCourseChat as Component<Record<string, unknown>>,
  defaultWidth: AI_COURSE_CHAT_DEFAULT_WIDTH,
  minWidth: AI_COURSE_CHAT_MIN_WIDTH,
  maxWidth: AI_COURSE_CHAT_MAX_WIDTH,
  widthStorageKey: AI_COURSE_CHAT_STORAGE_KEY,
  floatable: true,
  floatingStorageKey: AI_COURSE_CHAT_FLOATING_STORAGE_KEY,
  defaultFloatingWidthRem: AI_COURSE_CHAT_FLOATING_DEFAULT_WIDTH_REM,
  defaultFloatingHeight: AI_COURSE_CHAT_FLOATING_DEFAULT_HEIGHT,
  minFloatingWidth: AI_COURSE_CHAT_FLOATING_MIN_WIDTH,
  minFloatingHeight: AI_COURSE_CHAT_FLOATING_MIN_HEIGHT
};
