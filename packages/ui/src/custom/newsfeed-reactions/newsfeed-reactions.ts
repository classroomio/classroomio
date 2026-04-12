export const NEWSFEED_REACTION_OPTIONS = [
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'smile', emoji: '😀', label: 'Smile' },
  { type: 'thumbsup', emoji: '👍', label: 'Thumbs up' },
  { type: 'thumbsdown', emoji: '👎', label: 'Thumbs down' }
] as const;

export type NewsfeedReactionType = (typeof NEWSFEED_REACTION_OPTIONS)[number]['type'];

export type NewsfeedReactionCounts = Partial<Record<NewsfeedReactionType, number>>;
export type NewsfeedReactionRecord = Record<NewsfeedReactionType, string[]>;

const EMPTY_REACTION_RECORD: NewsfeedReactionRecord = {
  clap: [],
  smile: [],
  thumbsup: [],
  thumbsdown: []
};

function cloneReactionRecord(reaction: Partial<NewsfeedReactionRecord> | undefined): NewsfeedReactionRecord {
  return {
    clap: [...(reaction?.clap ?? EMPTY_REACTION_RECORD.clap)],
    smile: [...(reaction?.smile ?? EMPTY_REACTION_RECORD.smile)],
    thumbsup: [...(reaction?.thumbsup ?? EMPTY_REACTION_RECORD.thumbsup)],
    thumbsdown: [...(reaction?.thumbsdown ?? EMPTY_REACTION_RECORD.thumbsdown)]
  };
}

export function getNewsfeedReactionCounts(
  reaction: Partial<NewsfeedReactionRecord> | undefined
): NewsfeedReactionCounts {
  return {
    clap: reaction?.clap?.length ?? 0,
    smile: reaction?.smile?.length ?? 0,
    thumbsup: reaction?.thumbsup?.length ?? 0,
    thumbsdown: reaction?.thumbsdown?.length ?? 0
  };
}

export function getSelectedNewsfeedReactionType(
  reaction: Partial<NewsfeedReactionRecord> | undefined,
  authorId: string
): NewsfeedReactionType | null {
  if (!authorId) {
    return null;
  }

  for (const option of NEWSFEED_REACTION_OPTIONS) {
    if (reaction?.[option.type]?.includes(authorId)) {
      return option.type;
    }
  }

  return null;
}

export function buildNextNewsfeedReaction(
  reaction: Partial<NewsfeedReactionRecord> | undefined,
  reactionType: NewsfeedReactionType,
  authorId: string
): NewsfeedReactionRecord {
  if (!authorId) {
    return cloneReactionRecord(reaction);
  }

  const nextReaction = cloneReactionRecord(reaction);
  const selectedReactionType = getSelectedNewsfeedReactionType(reaction, authorId);

  for (const option of NEWSFEED_REACTION_OPTIONS) {
    nextReaction[option.type] = nextReaction[option.type].filter((memberId) => memberId !== authorId);
  }

  if (selectedReactionType !== reactionType) {
    nextReaction[reactionType] = [...nextReaction[reactionType], authorId];
  }

  return nextReaction;
}
