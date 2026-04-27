import { marked } from 'marked';

// Configure marked for safe, minimal output
marked.setOptions({
  breaks: true,
  gfm: true
});

/**
 * Convert markdown text to sanitized HTML for rendering in the chat.
 * Agent responses come as markdown — this makes them render properly.
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';

  return marked.parse(text, { async: false }) as string;
}
