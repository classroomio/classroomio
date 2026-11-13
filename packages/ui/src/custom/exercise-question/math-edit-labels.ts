import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
import { DEFAULT_MATH_EDIT_LABELS, type MathEditLabels } from '../math-text';
import { MATH_STRUCTURES } from '../math-input/structures';
import type { MathStructureLabels } from '../math-input/types';

function getStructureLabels(labels: ExerciseQuestionLabels | undefined): MathStructureLabels {
  const entries = MATH_STRUCTURES.map(({ id }) => [
    id,
    getExerciseQuestionLabel(labels, `question.math.structure.${id}`, DEFAULT_MATH_EDIT_LABELS.structures[id])
  ]);

  return Object.fromEntries(entries) as MathStructureLabels;
}

export function getQuestionMathEditLabels(labels: ExerciseQuestionLabels | undefined): MathEditLabels {
  const structures = getStructureLabels(labels);

  return {
    insertMath: getExerciseQuestionLabel(labels, 'question.math.insert', DEFAULT_MATH_EDIT_LABELS.insertMath),
    typeTab: getExerciseQuestionLabel(labels, 'question.math.type_tab', DEFAULT_MATH_EDIT_LABELS.typeTab),
    latexTab: getExerciseQuestionLabel(labels, 'question.math.latex_tab', DEFAULT_MATH_EDIT_LABELS.latexTab),
    mathFieldLabel: getExerciseQuestionLabel(
      labels,
      'question.math.field_label',
      DEFAULT_MATH_EDIT_LABELS.mathFieldLabel
    ),
    paletteLabel: getExerciseQuestionLabel(
      labels,
      'question.math.palette_label',
      DEFAULT_MATH_EDIT_LABELS.paletteLabel
    ),
    structures,
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
