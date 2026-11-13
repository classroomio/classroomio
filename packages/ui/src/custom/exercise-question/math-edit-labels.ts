import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
import { DEFAULT_MATH_EDIT_LABELS, type MathEditLabels } from '../math-text';

export function getQuestionMathEditLabels(labels: ExerciseQuestionLabels | undefined): MathEditLabels {
  return {
    insertMath: getExerciseQuestionLabel(labels, 'question.math.insert', DEFAULT_MATH_EDIT_LABELS.insertMath),
    latexLabel: getExerciseQuestionLabel(labels, 'question.math.latex_label', DEFAULT_MATH_EDIT_LABELS.latexLabel),
    previewLabel: getExerciseQuestionLabel(
      labels,
      'question.math.preview_label',
      DEFAULT_MATH_EDIT_LABELS.previewLabel
    ),
    previewEmpty: getExerciseQuestionLabel(
      labels,
      'question.math.preview_empty',
      DEFAULT_MATH_EDIT_LABELS.previewEmpty
    ),
    done: getExerciseQuestionLabel(labels, 'question.math.done', DEFAULT_MATH_EDIT_LABELS.done),
    cancel: getExerciseQuestionLabel(labels, 'question.math.cancel', DEFAULT_MATH_EDIT_LABELS.cancel)
  };
}
