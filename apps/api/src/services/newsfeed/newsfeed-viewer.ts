import { AppError, ErrorCodes } from '@api/utils/errors';
import { ensureCourseGroupMemberId } from '@cio/core/services/course/course';
import { getGroupMemberIdByCourseAndProfile, isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getNewsfeedById, updateNewsfeed } from '@cio/db/queries/newsfeed';
import type { TNewsfeedReactionToggle } from '@cio/utils/validation/newsfeed';

type ReactionType = TNewsfeedReactionToggle['type'];
type ReactionRecord = Record<ReactionType, string[]>;

const REACTION_TYPES: ReactionType[] = ['clap', 'smile', 'thumbsup', 'thumbsdown'];

/**
 * The signed-in user's standing in a course newsfeed: the group member id that reaction lists
 * and comment authors are keyed by, and whether they may moderate posts and comments.
 */
export async function getNewsfeedViewer(courseId: string, profileId: string) {
  const groupMemberId = await getGroupMemberIdByCourseAndProfile(courseId, profileId);
  const canModerate = await isCourseTeamMemberOrOrgAdmin(courseId, profileId);

  return { groupMemberId, canModerate };
}

/**
 * Sets or clears the signed-in user's reaction on a post. A user holds at most one reaction;
 * choosing the reaction they already hold removes it.
 */
export async function toggleNewsfeedReaction(courseId: string, feedId: string, profileId: string, type: ReactionType) {
  const groupMemberId = await ensureCourseGroupMemberId(courseId, profileId);
  if (!groupMemberId) {
    throw new AppError('You must be a member of this course to react', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403);
  }

  const feed = await getNewsfeedById(feedId);
  if (!feed || feed.courseId !== courseId) {
    throw new AppError('Newsfeed item not found', ErrorCodes.NOT_FOUND, 404);
  }

  const current = feed.reaction;
  const held = REACTION_TYPES.find((reactionType) => current?.[reactionType]?.includes(groupMemberId)) ?? null;
  const next = Object.fromEntries(
    REACTION_TYPES.map((reactionType) => [
      reactionType,
      (current?.[reactionType] ?? []).filter((memberId) => memberId !== groupMemberId)
    ])
  ) as ReactionRecord;

  if (held !== type) {
    next[type] = [...next[type], groupMemberId];
  }

  const updated = await updateNewsfeed(feedId, { reaction: next });
  if (!updated) {
    throw new AppError('Newsfeed item not found', ErrorCodes.NOT_FOUND, 404);
  }

  return {
    id: updated.id,
    reaction: updated.reaction ?? next,
    viewerReaction: held === type ? null : type,
    groupMemberId
  };
}
