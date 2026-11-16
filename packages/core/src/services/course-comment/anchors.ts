import { getBlockLocale, getLessonBlockRow } from '@cio/db/queries/block';
import {
  getExerciseQuestionForComment,
  listCourseCommentTextAnchorsForBlock,
  moveCourseCommentThreadsToBlock,
  updateCourseCommentTextAnchors,
  type TCourseCommentTextAnchorUpdate
} from '@cio/db/queries/course-comment';
import { getExerciseById } from '@cio/db/queries/exercise';
import { getLessonRowById } from '@cio/db/queries/lesson';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import type { TLocale, TNewCourseCommentThread } from '@cio/db/types';
import { findTextAnchor, normalizeAnchorString } from '@cio/utils/functions/course-comment-anchor-text';
import { htmlToAnchorText } from '@cio/utils/functions/course-comment-html-text';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import {
  getBlockCommentAnchorKind,
  getBlockCommentFingerprint,
  type TBlockCommentAnchorKind
} from '@cio/utils/validation/block';
import type { TCourseCommentAnchorInput } from '@cio/utils/validation/course-comment';

import { publishCourseCommentEvents } from './events';

export type TResolvedCourseCommentAnchor = Pick<
  TNewCourseCommentThread,
  'anchorType' | 'lessonId' | 'exerciseId' | 'blockId' | 'questionId' | 'anchor'
>;

type TBlockAnchorInput = Extract<TCourseCommentAnchorInput, { blockId: string }>;

const BLOCK_KIND_BY_ANCHOR: Record<TBlockAnchorInput['type'], TBlockCommentAnchorKind | null> = {
  block: null,
  text: 'text',
  time: 'time',
  slide: 'slide',
  point: 'point'
};

function invalidAnchor(message: string): AppError {
  return new AppError(message, ErrorCodes.COURSE_COMMENT_ANCHOR_INVALID, 400, 'anchor');
}

async function assertLessonInCourse(courseId: string, lessonId: string, dbClient: DbOrTxClient): Promise<void> {
  const lesson = await getLessonRowById(lessonId, dbClient);
  if (lesson?.courseId !== courseId) throw invalidAnchor('Lesson is not part of this course');
}

async function assertExerciseInCourse(courseId: string, exerciseId: string, dbClient: DbOrTxClient): Promise<void> {
  const exercise = await getExerciseById(exerciseId, dbClient);
  if (exercise?.courseId !== courseId) throw invalidAnchor('Exercise is not part of this course');
}

async function resolveBlockAnchor(
  courseId: string,
  anchor: TBlockAnchorInput,
  dbClient: DbOrTxClient
): Promise<TResolvedCourseCommentAnchor> {
  await assertLessonInCourse(courseId, anchor.lessonId, dbClient);

  const row = await getLessonBlockRow(anchor.lessonId, anchor.blockId, dbClient);
  if (!row || row.block.deletedAt) throw invalidAnchor('Block is not part of this lesson');

  const expectedKind = BLOCK_KIND_BY_ANCHOR[anchor.type];
  if (expectedKind && getBlockCommentAnchorKind(row.block.type) !== expectedKind) {
    throw invalidAnchor(`A ${row.block.type} block does not take ${anchor.type} comments`);
  }

  const fingerprint = getBlockCommentFingerprint(row.block.type, row.block.data);
  const columns = { anchorType: anchor.type, lessonId: anchor.lessonId, blockId: anchor.blockId };

  switch (anchor.type) {
    case 'block':
      return { ...columns, anchor: {} };
    case 'time':
      return { ...columns, anchor: { seconds: anchor.seconds, fingerprint } };
    case 'slide':
      return { ...columns, anchor: { slideNumber: anchor.slideNumber, fingerprint } };
    case 'point':
      return { ...columns, anchor: { x: anchor.x, y: anchor.y, fingerprint } };
    case 'text': {
      const locale = await getBlockLocale(anchor.blockId, anchor.locale as TLocale, dbClient);
      const text = htmlToAnchorText(locale?.content ?? '');
      const match = findTextAnchor(text, anchor);
      if (!match) throw invalidAnchor('The highlighted text was not found in this block');

      return {
        ...columns,
        anchor: {
          locale: anchor.locale,
          quote: normalizeAnchorString(anchor.quote),
          prefix: normalizeAnchorString(anchor.prefix),
          suffix: normalizeAnchorString(anchor.suffix),
          start: match.start
        }
      };
    }
  }
}

/**
 * Proves every id in an anchor belongs to the course, then returns the columns to store. This is the
 * tenant boundary for anchors: throws 400 COURSE_COMMENT_ANCHOR_INVALID for anything outside it.
 */
export async function resolveCourseCommentAnchor(
  courseId: string,
  anchor: TCourseCommentAnchorInput,
  dbClient: DbOrTxClient = db
): Promise<TResolvedCourseCommentAnchor> {
  switch (anchor.type) {
    case 'course':
      return { anchorType: 'course', anchor: {} };
    case 'page': {
      if (anchor.page.lessonId) {
        await assertLessonInCourse(courseId, anchor.page.lessonId, dbClient);

        return { anchorType: 'page', lessonId: anchor.page.lessonId, anchor: {} };
      }

      const exerciseId = anchor.page.exerciseId ?? '';
      await assertExerciseInCourse(courseId, exerciseId, dbClient);

      return { anchorType: 'page', exerciseId, anchor: {} };
    }
    case 'question': {
      await assertExerciseInCourse(courseId, anchor.exerciseId, dbClient);
      const question = await getExerciseQuestionForComment(anchor.exerciseId, anchor.questionId, dbClient);
      if (!question) throw invalidAnchor('Question is not part of this exercise');

      return { anchorType: 'question', exerciseId: anchor.exerciseId, questionId: anchor.questionId, anchor: {} };
    }
    default:
      return resolveBlockAnchor(courseId, anchor, dbClient);
  }
}

export interface TReconciledTextAnchors {
  courseIds: string[];
  threadIds: string[];
}

/**
 * Re-finds every text-anchored quote on one note block locale after its content changed, and flags
 * quotes that can no longer be found. Run it inside the write's transaction; announce the result
 * with `announceReconciledTextAnchors` after commit.
 */
export async function reconcileBlockTextAnchors(
  input: { blockId: string; locale: TLocale; html: string | null },
  dbClient: DbOrTxClient = db
): Promise<TReconciledTextAnchors> {
  const anchors = await listCourseCommentTextAnchorsForBlock(input.blockId, input.locale, dbClient);
  if (anchors.length === 0) return { courseIds: [], threadIds: [] };

  const text = htmlToAnchorText(input.html ?? '');
  const updates: TCourseCommentTextAnchorUpdate[] = [];
  const courseIds = new Set<string>();

  for (const row of anchors) {
    const match = findTextAnchor(text, {
      quote: row.anchor.quote ?? '',
      prefix: row.anchor.prefix ?? '',
      suffix: row.anchor.suffix ?? '',
      start: row.anchor.start ?? 0
    });
    const textDetached = match === null;
    const start = match?.start ?? null;
    const isUnchanged = textDetached === row.textDetached && (start === null || start === row.anchor.start);
    if (isUnchanged) continue;

    updates.push({ id: row.id, start, textDetached });
    courseIds.add(row.courseId);
  }

  await updateCourseCommentTextAnchors(updates, dbClient);

  return { courseIds: [...courseIds], threadIds: updates.map((update) => update.id) };
}

/**
 * Collects anchor changes made inside a transaction so open comment panels hear about them only
 * after it commits.
 */
export class CourseCommentAnchorChanges {
  private readonly changes: TReconciledTextAnchors[] = [];

  async reconcileText(input: { blockId: string; locale: TLocale; html: string | null }, dbClient: DbOrTxClient) {
    this.changes.push(await reconcileBlockTextAnchors(input, dbClient));
  }

  async moveToBlockCopy(input: { lessonId: string; fromBlockId: string; toBlockId: string }, dbClient: DbOrTxClient) {
    const moved = await moveCourseCommentThreadsToBlock(input, dbClient);
    this.changes.push({
      courseIds: moved.map((thread) => thread.courseId),
      threadIds: moved.map((thread) => thread.id)
    });
  }

  async announce(): Promise<void> {
    await announceReconciledTextAnchors(this.changes.splice(0));
  }
}

/** Lets open comment panels refetch threads whose highlight moved or was removed. */
export async function announceReconciledTextAnchors(results: TReconciledTextAnchors[]): Promise<void> {
  const threadIds = results.flatMap((result) => result.threadIds);
  if (threadIds.length === 0) return;

  const courseIds = results.flatMap((result) => result.courseIds);
  await publishCourseCommentEvents(courseIds, { type: 'anchors.changed', threadIds });
}
