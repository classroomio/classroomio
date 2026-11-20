import { writable } from 'svelte/store';

/**
 * Counts requests to open the Ask AI prompt. The add row that is on screen opens its prompt
 * whenever the count changes, so the gap menu and the keyboard shortcut can reach it.
 */
export const aiPromptRequests = writable(0);

export function requestAiPrompt() {
  aiPromptRequests.update((count) => count + 1);
}

/**
 * True for Cmd+I (Mac) or Ctrl+I, unless the user is typing, where the same keys toggle italics.
 */
export function isAiPromptShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.altKey || event.shiftKey) return false;
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'i') return false;

  const target = event.target;
  if (!(target instanceof HTMLElement)) return true;

  return !target.isContentEditable && !target.closest('input, textarea, select, [contenteditable]');
}

export function getAiShortcut(isMac: boolean) {
  return { modifier: isMac ? '⌘' : 'Ctrl', key: 'I' };
}
