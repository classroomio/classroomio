import { listOpenCourseCommentSummaryRows, type TCourseCommentSummaryRow } from '@cio/db/queries/course-comment';
import { COURSE_COMMENT_BLOCK_ANCHOR_TYPES, type TCourseCommentAnchorType } from '@cio/utils/constants/course-comment';

import { assertTeamCommentsEnabled } from './access';

export interface TCourseCommentCount {
  open: number;
  unread: boolean;
}

export interface TCourseCommentSummary {
  openTotal: number;
  unreadThreads: number;
  general: TCourseCommentCount;
  /** Keyed by lesson or exercise id. Includes threads whose block or question was removed. */
  pages: Record<string, TCourseCommentCount>;
  /** Keyed by `${lessonId}:${blockId}`, because one block can be placed in several lessons. */
  blocks: Record<string, number>;
  /** Keyed by question id. */
  questions: Record<string, number>;
}

const BLOCK_ANCHOR_TYPES = new Set<TCourseCommentAnchorType>(COURSE_COMMENT_BLOCK_ANCHOR_TYPES);

function addToCount(counts: Record<string, TCourseCommentCount>, key: string, unread: boolean): void {
  const count = counts[key] ?? { open: 0, unread: false };
  counts[key] = { open: count.open + 1, unread: count.unread || unread };
}

export function buildCourseCommentSummary(rows: TCourseCommentSummaryRow[]): TCourseCommentSummary {
  const summary: TCourseCommentSummary = {
    openTotal: rows.length,
    unreadThreads: 0,
    general: { open: 0, unread: false },
    pages: {},
    blocks: {},
    questions: {}
  };

  for (const row of rows) {
    if (row.unread) summary.unreadThreads += 1;

    const pageId = row.lessonId ?? row.exerciseId;
    if (!pageId) {
      summary.general = { open: summary.general.open + 1, unread: summary.general.unread || row.unread };
      continue;
    }

    addToCount(summary.pages, pageId, row.unread);

    if (row.lessonId && row.blockId && row.blockPlaced && BLOCK_ANCHOR_TYPES.has(row.anchorType)) {
      const blockKey = `${row.lessonId}:${row.blockId}`;
      summary.blocks[blockKey] = (summary.blocks[blockKey] ?? 0) + 1;
    }

    if (row.anchorType === 'question' && row.questionId !== null) {
      const questionKey = String(row.questionId);
      summary.questions[questionKey] = (summary.questions[questionKey] ?? 0) + 1;
    }
  }

  return summary;
}

/**
 * Open-thread counts for every page, block and question of a course, plus the viewer's unread state.
 */
export async function getCourseCommentSummary(courseId: string, viewerId: string): Promise<TCourseCommentSummary> {
  await assertTeamCommentsEnabled(courseId);
  const rows = await listOpenCourseCommentSummaryRows(courseId, viewerId);

  return buildCourseCommentSummary(rows);
}
