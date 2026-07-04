const USER_MENTION_REGEX = /@\[([^\]]+)\]\(user:([0-9a-f-]{36})\)/gi;

export type ParsedUserMention = {
  profileId: string;
  label: string;
};

export function parseUserMentions(body: string): ParsedUserMention[] {
  const mentions: ParsedUserMention[] = [];
  const seenProfileIds = new Set<string>();
  const regex = new RegExp(USER_MENTION_REGEX.source, 'gi');
  let match = regex.exec(body);

  while (match) {
    const profileId = match[2]!;

    if (!seenProfileIds.has(profileId)) {
      seenProfileIds.add(profileId);
      mentions.push({
        profileId,
        label: match[1]!.trim()
      });
    }

    match = regex.exec(body);
  }

  return mentions;
}

export function formatMentionsForEmail(body: string): string {
  return body.replace(new RegExp(USER_MENTION_REGEX.source, 'gi'), '@$1');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderNoteCommentMentions(body: string): string {
  const escaped = escapeHtml(body);

  return escaped.replace(new RegExp(USER_MENTION_REGEX.source, 'gi'), '<span class="note-comment-mention">@$1</span>');
}
