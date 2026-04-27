type MentionType = 'lesson' | 'exercise' | 'section';

/**
 * Mention format: @[Title](type:id)
 * Where type is "lesson", "exercise", or "section" and id is the content item ID.
 */
const RAW_MENTION_REGEX = /@\[([^\]]+)\]\((lesson|exercise|section):([a-zA-Z0-9_-]+)\)/gi;
const HTML_LINK_MENTION_REGEX = /@?<a\b[^>]*href=(["'])(lesson|exercise|section):([a-zA-Z0-9_-]+)\1[^>]*>(.*?)<\/a>/gi;

function normalizeMentionType(type: string): MentionType | null {
  const normalizedType = type.toLowerCase();

  if (normalizedType === 'lesson' || normalizedType === 'exercise' || normalizedType === 'section') {
    return normalizedType;
  }

  return null;
}

function getMentionRoute(courseId: string, type: MentionType, id: string) {
  if (type === 'exercise') return `/courses/${courseId}/exercises/${id}`;
  if (type === 'section') return `/courses/${courseId}/lessons#section-${id}`;

  return `/courses/${courseId}/lessons/${id}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildMentionLink(route: string, label: string, title: string) {
  return `<a href="${route}" data-mention-route="${route}" class="mention-link" title="${escapeHtml(title)}">${label}</a>`;
}

/**
 * Replace AI lesson/exercise mentions with real in-app links.
 * Handles both raw mention syntax and markdown-generated anchor tags.
 */
export function renderMentions(html: string, courseId: string): string {
  const linksWithRoutes = html.replace(
    HTML_LINK_MENTION_REGEX,
    (match, _quote: string, type: string, id: string, label: string) => {
      const mentionType = normalizeMentionType(type);

      if (!mentionType) return match;

      const route = getMentionRoute(courseId, mentionType, id);
      return buildMentionLink(route, label, `${mentionType}: ${id}`);
    }
  );

  return linksWithRoutes.replace(RAW_MENTION_REGEX, (match, title: string, type: string, id: string) => {
    const mentionType = normalizeMentionType(type);

    if (!mentionType) return match;

    const route = getMentionRoute(courseId, mentionType, id);
    return buildMentionLink(route, escapeHtml(title), `${mentionType}: ${title}`);
  });
}
