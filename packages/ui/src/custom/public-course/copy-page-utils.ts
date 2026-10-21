export interface CopyPageLabels {
  copy: string;
  copied: string;
  viewAsMarkdown: string;
  openInChatGPT: string;
  openInClaude: string;
  moreActions: string;
}

export type StudyChatTarget = 'chatgpt' | 'claude';

export interface StudyChatInput {
  lessonTitle: string;
  courseTitle: string;
  publicLessonUrl: string;
  publicLessonMarkdownUrl: string;
}

export function buildStudyChatUrl(target: StudyChatTarget, input: StudyChatInput): string {
  const prompt = [
    `I'm studying "${input.lessonTitle}" from the course "${input.courseTitle}" (${input.publicLessonUrl}).`,
    `The lesson content is available as Markdown at ${input.publicLessonMarkdownUrl}.`,
    'Help me understand the concepts, give examples, or help debug based on it.'
  ].join('\n');
  const encodedPrompt = encodeURIComponent(prompt);

  switch (target) {
    case 'chatgpt':
      return `https://chatgpt.com/?prompt=${encodedPrompt}`;
    case 'claude':
      // Claude's /new composer only unofficially reads `q`; open `/new` so learners can paste if it is ignored.
      return `https://claude.ai/new?q=${encodedPrompt}`;
  }
}

/** Fetches the lesson Markdown document, or `null` when the request fails. */
export async function fetchLessonMarkdown(markdownUrl: string): Promise<string | null> {
  try {
    const response = await fetch(markdownUrl);

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}
