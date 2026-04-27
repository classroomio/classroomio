function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripLeadingLessonTitle(content: string, lessonTitle: string): string {
  const normalizedTitle = lessonTitle.trim();

  if (!normalizedTitle) {
    return content;
  }

  const escapedTitle = escapeRegExp(normalizedTitle);
  const patterns = [
    new RegExp(`^\\s*<h[1-6][^>]*>\\s*${escapedTitle}\\s*</h[1-6]>\\s*`, 'i'),
    new RegExp(
      `^\\s*<p[^>]*>\\s*(?:<strong[^>]*>|<b[^>]*>)?\\s*${escapedTitle}\\s*(?:</strong>|</b>)?\\s*</p>\\s*`,
      'i'
    )
  ];

  let nextContent = content;

  for (const pattern of patterns) {
    nextContent = nextContent.replace(pattern, '');
  }

  return nextContent;
}

function normalizeHeadingLevels(content: string): string {
  return content
    .replace(/<h1(\s|>)/gi, '<h3$1')
    .replace(/<\/h1>/gi, '</h3>')
    .replace(/<h2(\s|>)/gi, '<h3$1')
    .replace(/<\/h2>/gi, '</h3>');
}

export function normalizeAgentLessonContent(content: string, lessonTitle: string): string {
  let normalizedContent = content.trim();

  normalizedContent = stripLeadingLessonTitle(normalizedContent, lessonTitle);
  normalizedContent = normalizeHeadingLevels(normalizedContent);

  return normalizedContent.trim();
}
