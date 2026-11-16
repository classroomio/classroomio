/** One `@` mention inside a comment body. Offsets are UTF-16 indexes; `end` is exclusive. */
export interface TCourseCommentMention {
  profileId: string;
  start: number;
  end: number;
}

export type TCourseCommentSegment =
  | { kind: 'text'; text: string }
  | { kind: 'mention'; text: string; profileId: string }
  | { kind: 'link'; text: string; href: string };

export const COURSE_COMMENT_MENTION_TYPE = 'user';

const MENTION_MARKUP = /@\[([^\]\n]+)\]\(user:([0-9a-fA-F-]{36})\)/g;
const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/g;
const TRAILING_URL_PUNCTUATION = /[.,;:!?)\]]+$/;

function sortByStart(mentions: TCourseCommentMention[]): TCourseCommentMention[] {
  return [...mentions].sort((left, right) => left.start - right.start);
}

/**
 * True when every span is inside `body`, starts with `@`, and no two spans overlap.
 */
export function areMentionSpansValid(body: string, mentions: TCourseCommentMention[]): boolean {
  let previousEnd = 0;

  for (const mention of sortByStart(mentions)) {
    const isInBounds = mention.start >= previousEnd && mention.end <= body.length && mention.start < mention.end;
    if (!isInBounds || body[mention.start] !== '@') return false;

    previousEnd = mention.end;
  }

  return true;
}

/** Distinct profile ids mentioned, in first-appearance order. */
export function getMentionedProfileIds(mentions: TCourseCommentMention[]): string[] {
  return [...new Set(sortByStart(mentions).map((mention) => mention.profileId))];
}

/** Keeps a display name usable inside `@[...]` markup. */
export function toMentionLabel(name: string): string {
  return name.replace(/[[\]()\n]/g, '').trim();
}

/**
 * Converts composer markup (`@[Name](user:id)`) into the stored plain body plus mention spans.
 * Leading and trailing whitespace is trimmed and the spans are shifted to match.
 */
export function fromMentionMarkup(markup: string): { body: string; mentions: TCourseCommentMention[] } {
  let body = '';
  let cursor = 0;
  const mentions: TCourseCommentMention[] = [];

  for (const match of markup.matchAll(MENTION_MARKUP)) {
    const matchStart = match.index ?? 0;
    const [token, label, profileId] = match;
    body += markup.slice(cursor, matchStart);

    const mentionText = `@${label}`;
    mentions.push({ profileId: profileId.toLowerCase(), start: body.length, end: body.length + mentionText.length });
    body += mentionText;
    cursor = matchStart + token.length;
  }

  body += markup.slice(cursor);

  const leadingWhitespace = body.length - body.trimStart().length;
  const trimmedBody = body.trim();
  const shiftedMentions = mentions
    .map((mention) => ({ ...mention, start: mention.start - leadingWhitespace, end: mention.end - leadingWhitespace }))
    .filter((mention) => mention.start >= 0 && mention.end <= trimmedBody.length);

  return { body: trimmedBody, mentions: shiftedMentions };
}

/**
 * Inverse of `fromMentionMarkup`, used to edit a stored comment. `nameOf` supplies the current
 * display name; when it returns null the name stored in the body is kept.
 */
export function toMentionMarkup(
  body: string,
  mentions: TCourseCommentMention[],
  nameOf: (profileId: string) => string | null
): string {
  let markup = '';
  let cursor = 0;

  for (const mention of sortByStart(mentions)) {
    const storedName = body.slice(mention.start + 1, mention.end);
    const label = toMentionLabel(nameOf(mention.profileId) ?? storedName);
    markup += body.slice(cursor, mention.start);
    markup += `@[${label}](${COURSE_COMMENT_MENTION_TYPE}:${mention.profileId})`;
    cursor = mention.end;
  }

  return markup + body.slice(cursor);
}

function splitLinks(text: string): TCourseCommentSegment[] {
  const segments: TCourseCommentSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const matchStart = match.index ?? 0;
    const href = match[0].replace(TRAILING_URL_PUNCTUATION, '');
    if (!href) continue;

    if (matchStart > cursor) segments.push({ kind: 'text', text: text.slice(cursor, matchStart) });
    segments.push({ kind: 'link', text: href, href });
    cursor = matchStart + href.length;
  }

  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) });

  return segments;
}

/**
 * Splits a stored body into text, mention and link segments, so mentions render with live names
 * and nothing is ever rendered as HTML. Invalid spans are rendered as plain text.
 */
export function segmentCommentBody(body: string, mentions: TCourseCommentMention[]): TCourseCommentSegment[] {
  const validMentions = areMentionSpansValid(body, mentions) ? sortByStart(mentions) : [];
  const segments: TCourseCommentSegment[] = [];
  let cursor = 0;

  for (const mention of validMentions) {
    segments.push(...splitLinks(body.slice(cursor, mention.start)));
    segments.push({ kind: 'mention', text: body.slice(mention.start, mention.end), profileId: mention.profileId });
    cursor = mention.end;
  }

  segments.push(...splitLinks(body.slice(cursor)));

  return segments;
}

/** A comment body on one line, cut to `maxLength` with an ellipsis, for notifications and emails. */
export function toCourseCommentSnippet(body: string | null, maxLength = 140): string | null {
  if (!body) return null;

  const singleLine = body.replace(/\s+/g, ' ').trim();

  return singleLine.length > maxLength ? `${singleLine.slice(0, maxLength - 1)}…` : singleLine;
}
