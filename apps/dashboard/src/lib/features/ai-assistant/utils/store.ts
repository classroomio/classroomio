import { writable } from 'svelte/store';
import type { AgentModelId } from '@cio/utils/agent-models';

/** Controls whether the AI assistant right sidebar Sheet is open. */
export const isAiAssistantOpen = writable(false);

export function openAiAssistant() {
  isAiAssistantOpen.set(true);
}

export function closeAiAssistant() {
  isAiAssistantOpen.set(false);
}

export function toggleAiAssistant() {
  isAiAssistantOpen.update((open) => !open);
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
