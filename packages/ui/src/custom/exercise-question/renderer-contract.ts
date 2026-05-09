import {
  QUESTION_TYPE_KEY,
  getRendererForMode,
  type ExerciseRendererDefinition,
  type ExerciseRendererMode,
  type ExerciseRendererRegistry,
  type ExerciseQuestionRendererProps,
  type ExerciseQuestionTypeKey
} from '@cio/question-types';
import type { Component } from 'svelte';

import { default as CheckboxEdit } from './renderers/checkbox/edit.svelte';
import { default as FileUploadEdit } from './renderers/file-upload/edit.svelte';
import { default as FillBlankEdit } from './renderers/fill-blank/edit.svelte';
import { default as HotspotEdit } from './renderers/hotspot/edit.svelte';
import { default as MatchingEdit } from './renderers/matching/edit.svelte';
import { default as NumericEdit } from './renderers/numeric/edit.svelte';
import { default as OrderingEdit } from './renderers/ordering/edit.svelte';
import { default as RadioEdit } from './renderers/radio/edit.svelte';
import { default as LinkEdit } from './renderers/link/edit.svelte';
import { default as WordBankEdit } from './renderers/word-bank/edit.svelte';
import { default as ShortAnswerEdit } from './renderers/short-answer/edit.svelte';
import { default as StarEdit } from './renderers/star/edit.svelte';
import { default as TextareaEdit } from './renderers/textarea/edit.svelte';
import { default as TrueFalseEdit } from './renderers/true-false/edit.svelte';
import { default as VideoRecordingEdit } from './renderers/video-recording/edit.svelte';

import { default as CheckboxTake } from './renderers/checkbox/take.svelte';
import { default as FileUploadTake } from './renderers/file-upload/take.svelte';
import { default as FillBlankTake } from './renderers/fill-blank/take.svelte';
import { default as HotspotTake } from './renderers/hotspot/take.svelte';
import { default as MatchingTake } from './renderers/matching/take.svelte';
import { default as NumericTake } from './renderers/numeric/take.svelte';
import { default as OrderingTake } from './renderers/ordering/take.svelte';
import { default as RadioTake } from './renderers/radio/take.svelte';
import { default as LinkTake } from './renderers/link/take.svelte';
import { default as WordBankTake } from './renderers/word-bank/take.svelte';
import { default as ShortAnswerTake } from './renderers/short-answer/take.svelte';
import { default as StarTake } from './renderers/star/take.svelte';
import { default as TextareaTake } from './renderers/textarea/take.svelte';
import { default as TrueFalseTake } from './renderers/true-false/take.svelte';
import { default as VideoRecordingTake } from './renderers/video-recording/take.svelte';

import { default as CheckboxPreview } from './renderers/checkbox/preview.svelte';
import { default as FileUploadPreview } from './renderers/file-upload/preview.svelte';
import { default as FillBlankPreview } from './renderers/fill-blank/preview.svelte';
import { default as HotspotPreview } from './renderers/hotspot/preview.svelte';
import { default as MatchingPreview } from './renderers/matching/preview.svelte';
import { default as NumericPreview } from './renderers/numeric/preview.svelte';
import { default as OrderingPreview } from './renderers/ordering/preview.svelte';
import { default as RadioPreview } from './renderers/radio/preview.svelte';
import { default as LinkPreview } from './renderers/link/preview.svelte';
import { default as WordBankPreview } from './renderers/word-bank/preview.svelte';
import { default as ShortAnswerPreview } from './renderers/short-answer/preview.svelte';
import { default as StarPreview } from './renderers/star/preview.svelte';
import { default as TextareaPreview } from './renderers/textarea/preview.svelte';
import { default as TrueFalsePreview } from './renderers/true-false/preview.svelte';
import { default as VideoRecordingPreview } from './renderers/video-recording/preview.svelte';

import { default as CheckboxSubmission } from './renderers/checkbox/submission.svelte';
import { default as FileUploadSubmission } from './renderers/file-upload/submission.svelte';
import { default as FillBlankSubmission } from './renderers/fill-blank/submission.svelte';
import { default as HotspotSubmission } from './renderers/hotspot/submission.svelte';
import { default as MatchingSubmission } from './renderers/matching/submission.svelte';
import { default as NumericSubmission } from './renderers/numeric/submission.svelte';
import { default as OrderingSubmission } from './renderers/ordering/submission.svelte';
import { default as RadioSubmission } from './renderers/radio/submission.svelte';
import { default as LinkSubmission } from './renderers/link/submission.svelte';
import { default as WordBankSubmission } from './renderers/word-bank/submission.svelte';
import { default as ShortAnswerSubmission } from './renderers/short-answer/submission.svelte';
import { default as StarSubmission } from './renderers/star/submission.svelte';
import { default as TextareaSubmission } from './renderers/textarea/submission.svelte';
import { default as TrueFalseSubmission } from './renderers/true-false/submission.svelte';
import { default as VideoRecordingSubmission } from './renderers/video-recording/submission.svelte';

import { default as RadioReview } from './renderers/radio/review.svelte';
import { default as CheckboxReview } from './renderers/checkbox/review.svelte';
import { default as NumericReview } from './renderers/numeric/review.svelte';
import { default as ShortAnswerReview } from './renderers/short-answer/review.svelte';
import { default as FillBlankReview } from './renderers/fill-blank/review.svelte';
import { default as WordBankReview } from './renderers/word-bank/review.svelte';
import { default as OrderingReview } from './renderers/ordering/review.svelte';
import { default as TrueFalseReview } from './renderers/true-false/review.svelte';

type SharedRendererComponent = Component<ExerciseQuestionRendererProps>;

export const EXERCISE_QUESTION_RENDERER_CONTRACT: ExerciseRendererRegistry<SharedRendererComponent> = {
  [QUESTION_TYPE_KEY.RADIO]: {
    edit: RadioEdit,
    take: RadioTake,
    preview: RadioPreview,
    submission: RadioSubmission,
    review: RadioReview
  },
  [QUESTION_TYPE_KEY.CHECKBOX]: {
    edit: CheckboxEdit,
    take: CheckboxTake,
    preview: CheckboxPreview,
    submission: CheckboxSubmission,
    review: CheckboxReview
  },
  [QUESTION_TYPE_KEY.TEXTAREA]: {
    edit: TextareaEdit,
    take: TextareaTake,
    preview: TextareaPreview,
    submission: TextareaSubmission
  },
  [QUESTION_TYPE_KEY.TRUE_FALSE]: {
    edit: TrueFalseEdit,
    take: TrueFalseTake,
    preview: TrueFalsePreview,
    submission: TrueFalseSubmission,
    review: TrueFalseReview
  },
  [QUESTION_TYPE_KEY.SHORT_ANSWER]: {
    edit: ShortAnswerEdit,
    take: ShortAnswerTake,
    preview: ShortAnswerPreview,
    submission: ShortAnswerSubmission,
    review: ShortAnswerReview
  },
  [QUESTION_TYPE_KEY.NUMERIC]: {
    edit: NumericEdit,
    take: NumericTake,
    preview: NumericPreview,
    submission: NumericSubmission,
    review: NumericReview
  },
  [QUESTION_TYPE_KEY.FILL_BLANK]: {
    edit: FillBlankEdit,
    take: FillBlankTake,
    preview: FillBlankPreview,
    submission: FillBlankSubmission,
    review: FillBlankReview
  },
  [QUESTION_TYPE_KEY.FILE_UPLOAD]: {
    edit: FileUploadEdit,
    take: FileUploadTake,
    preview: FileUploadPreview,
    submission: FileUploadSubmission
  },
  [QUESTION_TYPE_KEY.MATCHING]: {
    edit: MatchingEdit,
    take: MatchingTake,
    preview: MatchingPreview,
    submission: MatchingSubmission
  },
  [QUESTION_TYPE_KEY.ORDERING]: {
    edit: OrderingEdit,
    take: OrderingTake,
    preview: OrderingPreview,
    submission: OrderingSubmission,
    review: OrderingReview
  },
  [QUESTION_TYPE_KEY.HOTSPOT]: {
    edit: HotspotEdit,
    take: HotspotTake,
    preview: HotspotPreview,
    submission: HotspotSubmission
  },
  [QUESTION_TYPE_KEY.LINK]: {
    edit: LinkEdit,
    take: LinkTake,
    preview: LinkPreview,
    submission: LinkSubmission
  },
  [QUESTION_TYPE_KEY.WORD_BANK]: {
    edit: WordBankEdit,
    take: WordBankTake,
    preview: WordBankPreview,
    submission: WordBankSubmission,
    review: WordBankReview
  },
  [QUESTION_TYPE_KEY.STAR]: {
    edit: StarEdit,
    take: StarTake,
    preview: StarPreview,
    submission: StarSubmission
  },
  [QUESTION_TYPE_KEY.VIDEO_RECORDING]: {
    edit: VideoRecordingEdit,
    take: VideoRecordingTake,
    preview: VideoRecordingPreview,
    submission: VideoRecordingSubmission,
    review: VideoRecordingSubmission
  }
};

const FALLBACK_RENDERER: ExerciseRendererDefinition<SharedRendererComponent> = {
  edit: ShortAnswerEdit,
  take: ShortAnswerTake,
  preview: ShortAnswerPreview,
  submission: ShortAnswerSubmission
};

export function getExerciseQuestionRenderer(
  questionTypeKey: ExerciseQuestionTypeKey,
  mode: ExerciseRendererMode
): SharedRendererComponent {
  return getRendererForMode(EXERCISE_QUESTION_RENDERER_CONTRACT, questionTypeKey, mode, FALLBACK_RENDERER);
}
