import type { ReviewAnchorKind, ReviewCommentSegment } from '@cio/ui/custom/review-comments';
import { ROLE } from '@cio/utils/constants';
import { buildCourseCommentThreadPath } from '@cio/utils/functions/course-comment-links';
import { segmentCommentBody } from '@cio/utils/functions/course-comment-mentions';
import type { TBlockType } from '@cio/utils/validation/block';
import { blockTypeLabelKey } from '$features/block/utils/block-labels';
import { t } from '$lib/utils/functions/translations';
import type {
  CourseComment,
  CourseCommentAnchorState,
  CourseCommentDraftAnchor,
  CourseCommentPerson,
  CourseCommentThread,
  CourseCommentTeamMember
} from './types';

/** Course admins, tutors and org admins see comments; nobody does in the student experience. */
export function isCourseCommentViewer(input: {
  isStudentExperience: boolean;
  isOrgAdmin: boolean | null;
  courseRoleId: number | null;
}): boolean {
  if (input.isStudentExperience) return false;
  if (input.isOrgAdmin) return true;

  return input.courseRoleId === ROLE.ADMIN || input.courseRoleId === ROLE.TUTOR;
}

export function formatCommentTime(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainder = String(wholeSeconds % 60).padStart(2, '0');

  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${remainder}`;

  return `${minutes}:${remainder}`;
}

export function getAnchorChipKind(thread: CourseCommentThread): ReviewAnchorKind {
  return thread.anchorType;
}

function blockLabel(blockType: string | null): string {
  if (!blockType) return t.get('course_comments.anchor.block');

  return t.get(blockTypeLabelKey(blockType as TBlockType));
}

/** The short label on a thread's anchor chip, e.g. "Video · 1:24" or "Slide 3". */
export function getAnchorChipLabel(thread: CourseCommentThread): string {
  switch (thread.anchorType) {
    case 'course':
      return t.get('course_comments.anchor.course');
    case 'page':
      return thread.location.kind === 'exercise'
        ? t.get('course_comments.anchor.exercise')
        : t.get('course_comments.anchor.lesson');
    case 'question':
      return t.get('course_comments.anchor.question');
    case 'time':
      return `${blockLabel(thread.blockType)} · ${formatCommentTime(thread.anchor.seconds ?? 0)}`;
    case 'slide':
      return thread.anchor.slideNumber
        ? t.get('course_comments.anchor.slide', { number: thread.anchor.slideNumber })
        : blockLabel(thread.blockType);
    default:
      return blockLabel(thread.blockType);
  }
}

const ANCHOR_STATE_KEYS: Record<Exclude<CourseCommentAnchorState, 'ok'>, string> = {
  text_removed: 'course_comments.anchor_state.text_removed',
  media_changed: 'course_comments.anchor_state.media_changed',
  question_removed: 'course_comments.anchor_state.question_removed',
  block_removed: 'course_comments.anchor_state.block_removed'
};

export function getAnchorStateLabel(thread: CourseCommentThread): string | null {
  if (thread.anchorState === 'ok') return null;
  if (thread.anchorState === 'media_changed' && thread.anchorType === 'point') {
    return t.get('course_comments.anchor_state.image_changed');
  }

  return t.get(ANCHOR_STATE_KEYS[thread.anchorState]);
}

export function getPersonName(person: CourseCommentPerson): string {
  if (person.state === 'deleted' || !person.fullname) return t.get('course_comments.person.deleted');

  return person.fullname;
}

export function getPersonBadge(person: CourseCommentPerson): string | null {
  if (person.state === 'former_member') return t.get('course_comments.person.former_member');
  if (person.role === 'org_admin') return t.get('course_comments.person.role.org_admin');
  if (person.role === 'admin') return t.get('course_comments.person.role.admin');
  if (person.role === 'tutor') return t.get('course_comments.person.role.tutor');

  return null;
}

/** A comment body as render segments, with mentions showing the person's current name. */
export function toCommentSegments(comment: CourseComment): ReviewCommentSegment[] {
  return segmentCommentBody(comment.body, comment.mentions).map((segment) => {
    if (segment.kind !== 'mention') return segment;

    const mention = comment.mentions.find((candidate) => candidate.profileId === segment.profileId);
    const text = mention?.fullname ? `@${mention.fullname}` : segment.text;

    return { kind: 'mention', text, inactive: mention ? !mention.isActive : false };
  });
}

/** The dashboard path that opens a thread, with its `?thread=` query. */
export function getThreadPath(courseId: string, thread: CourseCommentThread): string {
  return buildCourseCommentThreadPath(courseId, {
    threadId: thread.id,
    lessonId: thread.location.kind === 'lesson' ? thread.location.lessonId : null,
    exerciseId: thread.location.kind === 'exercise' ? thread.location.exerciseId : null
  });
}

export function getThreadPageId(thread: CourseCommentThread): string | null {
  if (thread.location.kind === 'lesson') return thread.location.lessonId;
  if (thread.location.kind === 'exercise') return thread.location.exerciseId;

  return null;
}

/** Teammates the viewer can @mention, as composer mention items. */
export function toMentionItems(team: CourseCommentTeamMember[], viewerId: string | undefined) {
  return team
    .filter((member) => member.profileId !== viewerId)
    .map((member) => ({ id: member.profileId, label: member.fullname, type: 'user' }));
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60]
];

/** "3 hours ago" in the viewer's language; "now" under a minute. */
export function formatCommentDate(iso: string, localeCode: string, now: Date = new Date()): string {
  const elapsedSeconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' });

  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(elapsedSeconds) >= seconds) return formatter.format(-Math.round(elapsedSeconds / seconds), unit);
  }

  return formatter.format(0, 'second');
}

/** The chip label for a comment that is still being written. */
export function getDraftChipLabel(draft: CourseCommentDraftAnchor, blockType: string | null): string {
  switch (draft.type) {
    case 'course':
      return t.get('course_comments.anchor.course');
    case 'page':
      return draft.page.exerciseId ? t.get('course_comments.anchor.exercise') : t.get('course_comments.anchor.lesson');
    case 'question':
      return t.get('course_comments.anchor.question');
    case 'time':
      return `${blockLabel(blockType)} · ${formatCommentTime(draft.seconds)}`;
    case 'slide':
      return draft.slideNumber
        ? t.get('course_comments.anchor.slide', { number: draft.slideNumber })
        : blockLabel(blockType);
    default:
      return blockLabel(blockType);
  }
}
