type MentionType = 'lesson' | 'exercise' | 'section' | 'landingpage';

/**
 * Mention format: @[Title](type:id)
 * Where type is "lesson", "exercise", or "section" and id is the content item ID.
 * Landing page: @[Title](landingpage) or @[Title](landingpage:COURSE_ID) — resolves to this course's landing page editor.
 */
const RAW_MENTION_REGEX = /@\[([^\]]+)\]\((lesson|exercise|section):([a-zA-Z0-9_-]+)\)/gi;
const RAW_LANDINGPAGE_MENTION_REGEX = /@\[([^\]]+)\]\(landingpage(?::[a-zA-Z0-9_-]+)?\)/gi;
const HTML_LINK_MENTION_REGEX = /@?<a\b[^>]*href=(["'])(lesson|exercise|section):([a-zA-Z0-9_-]+)\1[^>]*>(.*?)<\/a>/gi;
const HTML_LINK_LANDINGPAGE_MENTION_REGEX = /@?<a\b[^>]*href=(["'])landingpage(?::[a-zA-Z0-9_-]+)?\1[^>]*>(.*?)<\/a>/gi;

function normalizeMentionType(type: string): MentionType | null {
  const normalizedType = type.toLowerCase();

  if (
    normalizedType === 'lesson' ||
    normalizedType === 'exercise' ||
    normalizedType === 'section' ||
    normalizedType === 'landingpage'
  ) {
    return normalizedType;
  }

  return null;
}

function getLandingPageEditorRoute(courseId: string): string {
  return `/courses/${courseId}/landingpage`;
}

function getMentionRoute(courseId: string, type: MentionType, id: string) {
  if (type === 'landingpage') return getLandingPageEditorRoute(courseId);
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
 * Replace AI lesson, exercise, section, and landing-page mentions with in-app links.
 * Handles both raw mention syntax and markdown-generated anchor tags.
 */
export function renderMentions(html: string, courseId: string): string {
  const landingHtmlRoutes = html.replace(
    HTML_LINK_LANDINGPAGE_MENTION_REGEX,
    (match, _quote: string, label: string) => {
      const route = getLandingPageEditorRoute(courseId);
      return buildMentionLink(route, label, 'landingpage');
    }
  );

  const linksWithRoutes = landingHtmlRoutes.replace(
    HTML_LINK_MENTION_REGEX,
    (match, _quote: string, type: string, id: string, label: string) => {
      const mentionType = normalizeMentionType(type);

      if (!mentionType) return match;

      const route = getMentionRoute(courseId, mentionType, id);
      return buildMentionLink(route, label, `${mentionType}: ${id}`);
    }
  );

  const withLandingRaw = linksWithRoutes.replace(RAW_LANDINGPAGE_MENTION_REGEX, (match, title: string) => {
    const route = getLandingPageEditorRoute(courseId);
    return buildMentionLink(route, escapeHtml(title), `landingpage: ${title}`);
  });

  return withLandingRaw.replace(RAW_MENTION_REGEX, (match, title: string, type: string, id: string) => {
    const mentionType = normalizeMentionType(type);

    if (!mentionType) return match;

    const route = getMentionRoute(courseId, mentionType, id);
    return buildMentionLink(route, escapeHtml(title), `${mentionType}: ${title}`);
  });
}
