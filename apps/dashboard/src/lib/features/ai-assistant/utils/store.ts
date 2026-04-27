import { writable } from 'svelte/store';

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
