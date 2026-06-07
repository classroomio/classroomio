import { writable } from 'svelte/store';
import type { AgentModelId } from '@cio/utils/agent-models';
import type { CourseTemplateId } from '@cio/ai-assistant';
import { sidePanel } from '$features/side-panel';

/**
 * AI assistant is one of several side-panel apps. These helpers proxy to the
 * generic side-panel store so existing call sites keep working.
 */
export const AI_ASSISTANT_PANEL_ID = 'ai-assistant';

export function openAiAssistant() {
  sidePanel.open(AI_ASSISTANT_PANEL_ID);
}

export function closeAiAssistant() {
  sidePanel.close();
}

export function toggleAiAssistant() {
  sidePanel.toggle(AI_ASSISTANT_PANEL_ID);
}

export const initialChatTemplateId = writable<CourseTemplateId | null>(null);

export function setInitialChatTemplateId(id: CourseTemplateId) {
  initialChatTemplateId.set(id);
}

export function clearInitialChatTemplateId() {
  initialChatTemplateId.set(null);
}

/** Carries a prompt from the home page course creator into the AI chat on first open. */
export const initialChatPrompt = writable<string | null>(null);
export const initialChatModel = writable<AgentModelId | null>(null);

export function setInitialChatPrompt(prompt: string) {
  initialChatPrompt.set(prompt);
}

export function setInitialChatModel(model: AgentModelId) {
  initialChatModel.set(model);
}

export function clearInitialChatPrompt() {
  initialChatPrompt.set(null);
}

export function clearInitialChatModel() {
  initialChatModel.set(null);
}

/** Opens the AI assistant panel and sends `prompt` as the next user message. */
export function sendPromptToAssistant(prompt: string) {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return;
  }

  setInitialChatPrompt(trimmed);
  openAiAssistant();
}

/**
 * Pending composer action picked up by the chat component:
 * - `append` adds the text to whatever is already in the input (panel was open).
 * - `new` starts a fresh conversation and replaces the input (panel was closed).
 */
export type ChatDraft = { text: string; mode: 'append' | 'new' };

export const chatDraft = writable<ChatDraft | null>(null);

export function clearChatDraft() {
  chatDraft.set(null);
}

export function setChatDraft(draft: ChatDraft) {
  chatDraft.set(draft);
}

function mdQuote(body: string) {
  return body
    .trim()
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

/**
 * Quote `text` into the assistant. If the panel is already open the quote is
 * appended to the current draft; otherwise a new conversation is opened.
 */
export function quoteInChat(text: string) {
  const quoted = mdQuote(text);

  if (!quoted.trim()) {
    return;
  }

  const isOpen = sidePanel.activePanelId === AI_ASSISTANT_PANEL_ID;

  chatDraft.set({ text: quoted, mode: isOpen ? 'append' : 'new' });

  if (!isOpen) {
    openAiAssistant();
  }
}
