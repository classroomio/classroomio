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
import { default as ShortAnswerEdit } from './renderers/short-answer/edit.svelte';
import { default as TextareaEdit } from './renderers/textarea/edit.svelte';
import { default as TrueFalseEdit } from './renderers/true-false/edit.svelte';

import { default as CheckboxTake } from './renderers/checkbox/take.svelte';
import { default as FileUploadTake } from './renderers/file-upload/take.svelte';
import { default as FillBlankTake } from './renderers/fill-blank/take.svelte';
import { default as HotspotTake } from './renderers/hotspot/take.svelte';
import { default as MatchingTake } from './renderers/matching/take.svelte';
import { default as NumericTake } from './renderers/numeric/take.svelte';
import { default as OrderingTake } from './renderers/ordering/take.svelte';
import { default as RadioTake } from './renderers/radio/take.svelte';
import { default as LinkTake } from './renderers/link/take.svelte';
import { default as ShortAnswerTake } from './renderers/short-answer/take.svelte';
import { default as TextareaTake } from './renderers/textarea/take.svelte';
import { default as TrueFalseTake } from './renderers/true-false/take.svelte';

import { default as CheckboxPreview } from './renderers/checkbox/preview.svelte';
import { default as FileUploadPreview } from './renderers/file-upload/preview.svelte';
import { default as FillBlankPreview } from './renderers/fill-blank/preview.svelte';
import { default as HotspotPreview } from './renderers/hotspot/preview.svelte';
import { default as MatchingPreview } from './renderers/matching/preview.svelte';
import { default as NumericPreview } from './renderers/numeric/preview.svelte';
import { default as OrderingPreview } from './renderers/ordering/preview.svelte';
import { default as RadioPreview } from './renderers/radio/preview.svelte';
import { default as LinkPreview } from './renderers/link/preview.svelte';
import { default as ShortAnswerPreview } from './renderers/short-answer/preview.svelte';
import { default as TextareaPreview } from './renderers/textarea/preview.svelte';
import { default as TrueFalsePreview } from './renderers/true-false/preview.svelte';

type SharedRendererComponent = Component<ExerciseQuestionRendererProps>;

export const EXERCISE_QUESTION_RENDERER_CONTRACT: ExerciseRendererRegistry<SharedRendererComponent> = {
  [QUESTION_TYPE_KEY.RADIO]: {
    edit: RadioEdit,
    take: RadioTake,
    preview: RadioPreview
  },
  [QUESTION_TYPE_KEY.CHECKBOX]: {
    edit: CheckboxEdit,
    take: CheckboxTake,
    preview: CheckboxPreview
  },
  [QUESTION_TYPE_KEY.TEXTAREA]: {
    edit: TextareaEdit,
    take: TextareaTake,
    preview: TextareaPreview
  },
  [QUESTION_TYPE_KEY.TRUE_FALSE]: {
    edit: TrueFalseEdit,
    take: TrueFalseTake,
    preview: TrueFalsePreview
  },
  [QUESTION_TYPE_KEY.SHORT_ANSWER]: {
    edit: ShortAnswerEdit,
    take: ShortAnswerTake,
    preview: ShortAnswerPreview
  },
  [QUESTION_TYPE_KEY.NUMERIC]: {
    edit: NumericEdit,
    take: NumericTake,
    preview: NumericPreview
  },
  [QUESTION_TYPE_KEY.FILL_BLANK]: {
    edit: FillBlankEdit,
    take: FillBlankTake,
    preview: FillBlankPreview
  },
  [QUESTION_TYPE_KEY.FILE_UPLOAD]: {
    edit: FileUploadEdit,
    take: FileUploadTake,
    preview: FileUploadPreview
  },
  [QUESTION_TYPE_KEY.MATCHING]: {
    edit: MatchingEdit,
    take: MatchingTake,
    preview: MatchingPreview
  },
  [QUESTION_TYPE_KEY.ORDERING]: {
    edit: OrderingEdit,
    take: OrderingTake,
    preview: OrderingPreview
  },
  [QUESTION_TYPE_KEY.HOTSPOT]: {
    edit: HotspotEdit,
    take: HotspotTake,
    preview: HotspotPreview
  },
  [QUESTION_TYPE_KEY.LINK]: {
    edit: LinkEdit,
    take: LinkTake,
    preview: LinkPreview
  }
};

const FALLBACK_RENDERER: ExerciseRendererDefinition<SharedRendererComponent> = {
  edit: ShortAnswerEdit,
  take: ShortAnswerTake,
  preview: ShortAnswerPreview
};

export function getExerciseQuestionRenderer(
  questionTypeKey: ExerciseQuestionTypeKey,
  mode: ExerciseRendererMode
): SharedRendererComponent {
  return getRendererForMode(EXERCISE_QUESTION_RENDERER_CONTRACT, questionTypeKey, mode, FALLBACK_RENDERER);
}
