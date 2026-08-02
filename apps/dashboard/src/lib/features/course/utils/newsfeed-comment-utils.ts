// Replies used to persist their "Replying to @someone" chrome as a leading
// <blockquote> inside the comment body. New replies carry `replyToCommentId`
// instead, so these helpers exist only to read rows written the old way.
const LEADING_REPLY_QUOTE = /^\s*<blockquote[^>]*>[\s\S]*?<\/blockquote>/i;

const SNIPPET_MAX_LENGTH = 60;

export function stripLegacyReplyQuote(content: string) {
  return content.replace(LEADING_REPLY_QUOTE, '').trim();
}

export function getReplySnippet(content: string) {
  const body = stripLegacyReplyQuote(content);
  if (body.length <= SNIPPET_MAX_LENGTH) return body;

  return `${body.slice(0, SNIPPET_MAX_LENGTH)}...`;
}
