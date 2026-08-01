/**
 * Shared types for the public course UI (sidebar, shell, lesson view, exercise view).
 * Keep these intentionally narrow — the API and the consuming routes normalize into
 * these shapes before rendering.
 *
 * For exercise questions we deliberately reuse `ExerciseQuestionModel` from
 * `@cio/question-types` so the public exercise view drives the same renderer
 * pipeline as the authenticated student view (`ExerciseQuestion.QuestionList`).
 * That way, every supported question type — RADIO, CHECKBOX, TRUE_FALSE,
 * SHORT_ANSWER, NUMERIC, FILL_BLANK, ORDERING, MATCHING, etc. — picks up the
 * standard `take` and `review` renderers without us re-implementing them.
 */

import type { ExerciseQuestionLabels, ExerciseQuestionModel } from '@cio/question-types';

/** Background motion behind the public course marketing callout. */
export type PublicCourseCalloutAnimation = 'dotted' | 'waves' | 'none';

export interface PublicCourseCalloutData {
  title: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  animation?: PublicCourseCalloutAnimation;
}

/** Org / creator info shown in the top header (logo, name) of public course pages. */
export interface PublicCourseOrgData {
  id: string;
  name: string;
  siteName: string | null;
  avatarUrl: string | null;
}

export interface PublicCourseSidebarItem {
  kind: 'lesson' | 'exercise';
  id: string;
  slug: string;
  title: string;
  isUnlocked: boolean;
  /** Nested outline depth (0 = root). Used by public note pages. */
  depth?: number;
}

export interface PublicCourseSidebarSection {
  id: string;
  title: string;
  items: PublicCourseSidebarItem[];
}

export type PublicCourseItemVariant = 'lesson' | 'exercise';

export interface PublicLessonViewData {
  kind: 'lesson';
  title: string;
  sectionTitle: string | null;
  body: string;
  video: {
    type: 'youtube' | 'generic' | 'upload' | 'google_drive';
    link: string;
    /**
     * When true, `link` is an HLS master playlist URL served by the
     * tenant-router Worker (prod) or API streaming route (local). The
     * shared MediaPlayer attaches hls.js based on this flag. The host app
     * must pass an `onBeforeHlsLoad` callback that mints a cookie via the
     * public org-site endpoint before playback starts.
     */
    hls?: boolean;
    metadata?: {
      svid?: string;
      thumbnailUrl?: string;
      title?: string;
    };
    transcript?: {
      vttUrl: string;
      vttUrlExpiresAt: string;
      language: string;
    } | null;
  } | null;
  isUnlocked: boolean;
}

export interface PublicExerciseViewData {
  kind: 'exercise';
  title: string;
  description: string | null;
  sectionTitle: string | null;
  isUnlocked: boolean;
  /**
   * Questions in the standard `ExerciseQuestionModel` shape. Each question's
   * `options[].isCorrect` and `settings` carry the answer keys used for
   * client-side grading in PUBLIC courses.
   */
  questions: ExerciseQuestionModel[];
}

export type { ExerciseQuestionLabels };

export type PublicItemViewData = PublicLessonViewData | PublicExerciseViewData;
