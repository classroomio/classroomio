export interface CopyPageLabels {
  copy: string;
  copied: string;
  viewAsMarkdown: string;
  openInChatGPT: string;
  openInClaude: string;
  moreActions: string;
}

export function buildStudyPrompt(input: { lessonTitle: string; courseTitle: string; publicLessonUrl: string }): string {
  return [
    `I'm studying "${input.lessonTitle}" from the course "${input.courseTitle}" (${input.publicLessonUrl}).`,
    'Help me understand the concepts, give examples, or help debug based on it.'
  ].join('\n');
}

export function buildChatGptUrl(prompt: string): string {
  return `https://chatgpt.com/?prompt=${encodeURIComponent(prompt)}`;
}

/**
 * Claude's web composer historically accepted `q`. That param is unofficial
 * and has broken before; callers still open `/new` so the learner can paste
 * if the prompt is ignored.
 */
export function buildClaudeUrl(prompt: string): string {
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
}
