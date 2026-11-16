import type {
  TCourseCommentRow,
  TCourseCommentTeamMember,
  TCourseCommentTeamRole,
  TCourseCommentThreadRow
} from '@cio/db/queries/course-comment';
import type {
  TCourseCommentAnchorState,
  TCourseCommentAnchorType,
  TCourseCommentThreadStatus
} from '@cio/utils/constants/course-comment';
import type { TCourseCommentMention } from '@cio/utils/functions/course-comment-mentions';
import { getBlockCommentFingerprint } from '@cio/utils/validation/block';

export type TCourseCommentPersonState = 'member' | 'former_member' | 'deleted';

export interface TCourseCommentPersonView {
  profileId: string | null;
  fullname: string | null;
  avatarUrl: string | null;
  role: TCourseCommentTeamRole | null;
  state: TCourseCommentPersonState;
}

export interface TCourseCommentMentionView extends TCourseCommentMention {
  fullname: string | null;
  isActive: boolean;
}

export interface TCourseCommentView {
  id: string;
  author: TCourseCommentPersonView;
  body: string;
  mentions: TCourseCommentMentionView[];
  editedAt: string | null;
  createdAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

export type TCourseCommentLocationView =
  | { kind: 'course' }
  | { kind: 'lesson'; lessonId: string; title: string | null }
  | { kind: 'exercise'; exerciseId: string; title: string | null };

export interface TCourseCommentAnchorView {
  locale: string | null;
  quote: string | null;
  prefix: string | null;
  suffix: string | null;
  start: number | null;
  seconds: number | null;
  slideNumber: number | null;
  x: number | null;
  y: number | null;
}

export interface TCourseCommentThreadView {
  id: string;
  courseId: string;
  status: TCourseCommentThreadStatus;
  anchorType: TCourseCommentAnchorType;
  anchor: TCourseCommentAnchorView;
  anchorState: TCourseCommentAnchorState;
  location: TCourseCommentLocationView;
  blockId: string | null;
  blockType: string | null;
  questionId: number | null;
  questionTitle: string | null;
  createdAt: string;
  lastActivityAt: string;
  resolvedAt: string | null;
  resolvedBy: TCourseCommentPersonView | null;
  unreadCount: number;
  comments: TCourseCommentView[];
}

export interface TCourseCommentViewer {
  profileId: string;
  isOrgAdmin: boolean;
}

const POSITIONED_BLOCK_ANCHORS = new Set<TCourseCommentAnchorType>(['time', 'slide', 'point']);
const BLOCK_ANCHORS = new Set<TCourseCommentAnchorType>(['block', 'text', 'time', 'slide', 'point']);

export function indexTeam(team: TCourseCommentTeamMember[]): Map<string, TCourseCommentTeamMember> {
  return new Map(team.map((member) => [member.profileId, member]));
}

/**
 * How a person who acted on a thread is shown: by id while their account exists, flagged as a
 * former member once they left the course team, and anonymous once their account is deleted.
 */
export function toPersonView(
  person: { profileId: string | null; fullname: string | null; avatarUrl: string | null },
  team: Map<string, TCourseCommentTeamMember>
): TCourseCommentPersonView {
  if (!person.profileId) return { profileId: null, fullname: null, avatarUrl: null, role: null, state: 'deleted' };

  const member = team.get(person.profileId);

  return {
    profileId: person.profileId,
    fullname: person.fullname,
    avatarUrl: person.avatarUrl,
    role: member?.role ?? null,
    state: member ? 'member' : 'former_member'
  };
}

/**
 * Whether the spot a thread points at still exists as it was when the comment was written.
 */
export function getCourseCommentAnchorState(row: TCourseCommentThreadRow): TCourseCommentAnchorState {
  const { thread } = row;

  if (thread.anchorType === 'question') return thread.questionId === null ? 'question_removed' : 'ok';
  if (!BLOCK_ANCHORS.has(thread.anchorType)) return 'ok';

  const blockIsGone = !thread.blockId || !row.blockType || !row.blockPlaced || row.blockDeletedAt !== null;
  if (blockIsGone) return 'block_removed';
  if (thread.anchorType === 'text') return thread.textDetached ? 'text_removed' : 'ok';

  const storedFingerprint = thread.anchor.fingerprint ?? null;
  if (POSITIONED_BLOCK_ANCHORS.has(thread.anchorType) && storedFingerprint) {
    const currentFingerprint = getBlockCommentFingerprint(row.blockType ?? '', row.blockData ?? {});
    if (currentFingerprint !== storedFingerprint) return 'media_changed';
  }

  return 'ok';
}

function toLocationView(row: TCourseCommentThreadRow): TCourseCommentLocationView {
  if (row.thread.lessonId) return { kind: 'lesson', lessonId: row.thread.lessonId, title: row.lessonTitle };
  if (row.thread.exerciseId) return { kind: 'exercise', exerciseId: row.thread.exerciseId, title: row.exerciseTitle };

  return { kind: 'course' };
}

function toAnchorView(row: TCourseCommentThreadRow): TCourseCommentAnchorView {
  const anchor = row.thread.anchor;

  return {
    locale: anchor.locale ?? null,
    quote: anchor.quote ?? null,
    prefix: anchor.prefix ?? null,
    suffix: anchor.suffix ?? null,
    start: anchor.start ?? null,
    seconds: anchor.seconds ?? null,
    slideNumber: anchor.slideNumber ?? null,
    x: anchor.x ?? null,
    y: anchor.y ?? null
  };
}

function toCommentView(
  comment: TCourseCommentRow,
  team: Map<string, TCourseCommentTeamMember>,
  viewer: TCourseCommentViewer
): TCourseCommentView {
  const isAuthor = comment.authorId !== null && comment.authorId === viewer.profileId;
  const mentions = comment.mentions.map((mention) => {
    const member = team.get(mention.profileId);

    return { ...mention, fullname: member?.fullname ?? null, isActive: Boolean(member) };
  });

  return {
    id: comment.id,
    author: toPersonView(
      { profileId: comment.authorId, fullname: comment.authorFullname, avatarUrl: comment.authorAvatarUrl },
      team
    ),
    body: comment.body,
    mentions,
    editedAt: comment.editedAt,
    createdAt: comment.createdAt,
    canEdit: isAuthor,
    canDelete: isAuthor || viewer.isOrgAdmin
  };
}

/**
 * Shapes thread rows and their comments for one viewer. Deleted-account audit names never leave
 * the server.
 */
export function toCourseCommentThreadViews(input: {
  rows: TCourseCommentThreadRow[];
  comments: TCourseCommentRow[];
  team: TCourseCommentTeamMember[];
  viewer: TCourseCommentViewer;
}): TCourseCommentThreadView[] {
  const team = indexTeam(input.team);
  const commentsByThread = new Map<string, TCourseCommentView[]>();

  for (const comment of input.comments) {
    const views = commentsByThread.get(comment.threadId) ?? [];
    views.push(toCommentView(comment, team, input.viewer));
    commentsByThread.set(comment.threadId, views);
  }

  return input.rows.map((row) => {
    const { thread } = row;
    const resolvedBy =
      thread.status === 'resolved'
        ? toPersonView(
            { profileId: thread.resolvedBy, fullname: row.resolverFullname, avatarUrl: row.resolverAvatarUrl },
            team
          )
        : null;

    return {
      id: thread.id,
      courseId: thread.courseId,
      status: thread.status,
      anchorType: thread.anchorType,
      anchor: toAnchorView(row),
      anchorState: getCourseCommentAnchorState(row),
      location: toLocationView(row),
      blockId: thread.blockId,
      blockType: row.blockType,
      questionId: thread.questionId,
      questionTitle: row.questionTitle,
      createdAt: thread.createdAt,
      lastActivityAt: thread.lastActivityAt,
      resolvedAt: thread.resolvedAt,
      resolvedBy,
      unreadCount: row.unreadCount,
      comments: commentsByThread.get(thread.id) ?? []
    };
  });
}
