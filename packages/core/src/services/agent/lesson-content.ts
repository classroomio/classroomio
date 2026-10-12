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

const BARE_CALLOUT_PATTERN =
  /<div data-callout="(info|tip|important|warning|highlight)">((?:(?!<\/?div[\s>])[\s\S])*)<\/div>/gi;

/** Expands `<div data-callout="tip">…</div>` into the full callout markup the editor and lesson view render. */
function expandBareCallouts(content: string): string {
  return content.replace(
    BARE_CALLOUT_PATTERN,
    (_match, style: string, body: string) =>
      `<div data-callout="${style.toLowerCase()}" class="cio-callout"><div class="cio-callout-mark" aria-hidden="true" contenteditable="false"></div><div class="cio-callout-body">${body}</div></div>`
  );
}

export function normalizeAgentLessonContent(content: string, lessonTitle: string): string {
  let normalizedContent = content.trim();

  normalizedContent = stripLeadingLessonTitle(normalizedContent, lessonTitle);
  normalizedContent = normalizeHeadingLevels(normalizedContent);
  normalizedContent = expandBareCallouts(normalizedContent);

  return normalizedContent.trim();
}
