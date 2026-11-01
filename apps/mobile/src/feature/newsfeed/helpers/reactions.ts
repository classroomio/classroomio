import { REACTIONS } from '@/feature/newsfeed/constants/reactions';
import type { NewsfeedPost, ReactionRecord, ReactionType } from '@/feature/newsfeed/types/newsfeed';

export function reactionRecordOf(reaction: NewsfeedPost['reaction'] | null | undefined): ReactionRecord {
  return {
    clap: reaction?.clap ?? [],
    smile: reaction?.smile ?? [],
    thumbsup: reaction?.thumbsup ?? [],
    thumbsdown: reaction?.thumbsdown ?? []
  };
}

export function viewerReactionOf(
  reaction: NewsfeedPost['reaction'] | null | undefined,
  groupMemberId: string | null | undefined
) {
  if (!groupMemberId) return null;

  const record = reactionRecordOf(reaction);

  return REACTIONS.find((option) => record[option.type].includes(groupMemberId))?.type ?? null;
}

/** The record the server will hold after the toggle, for showing the change before it confirms. */
export function previewReactionToggle(
  reaction: NewsfeedPost['reaction'] | null | undefined,
  groupMemberId: string,
  type: ReactionType
) {
  const record = reactionRecordOf(reaction);
  const held = viewerReactionOf(record, groupMemberId);
  const next: ReactionRecord = {
    clap: record.clap.filter((id) => id !== groupMemberId),
    smile: record.smile.filter((id) => id !== groupMemberId),
    thumbsup: record.thumbsup.filter((id) => id !== groupMemberId),
    thumbsdown: record.thumbsdown.filter((id) => id !== groupMemberId)
  };
  if (held !== type) next[type] = [...next[type], groupMemberId];

  return next;
}
