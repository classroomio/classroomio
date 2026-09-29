import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
import type { ImageLightboxLabels } from '../image-lightbox';

export function getQuestionLightboxLabels(labels: ExerciseQuestionLabels | undefined): ImageLightboxLabels {
  return {
    close: getExerciseQuestionLabel(labels, 'question.media.close'),
    zoomIn: getExerciseQuestionLabel(labels, 'question.media.zoom_in'),
    zoomOut: getExerciseQuestionLabel(labels, 'question.media.zoom_out'),
    previous: getExerciseQuestionLabel(labels, 'question.media.previous_image'),
    next: getExerciseQuestionLabel(labels, 'question.media.next_image')
  };
}
