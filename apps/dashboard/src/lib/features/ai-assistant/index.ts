export { default as AiCourseChat } from './ai-course-chat.svelte';
export { default as ContentAskAiBar } from './content-ask-ai-bar.svelte';
export { default as PlanView } from './plan-view.svelte';
export { default as ProgressCard } from './progress-card.svelte';
export {
  AI_ASSISTANT_PANEL_ID,
  chatDraft,
  clearChatDraft,
  openAiAssistant,
  closeAiAssistant,
  quoteInChat,
  sendPromptToAssistant,
  setChatDraft,
  toggleAiAssistant
} from './utils/store';
export { aiAssistantPanelDefinition } from './panel';
