import { writable } from 'svelte/store';
import type { CertificationEvaluationData } from '$features/course/utils/types';

export type ModalStep = 'checking' | 'eligible' | 'not-eligible';

export type CourseCompletionModalState = {
  open: boolean;
  courseId: string;
  step: ModalStep;
  evaluation: CertificationEvaluationData | null;
  /** Exercise to retake when not-eligible */
  exerciseId?: string;
};

export const courseCompletionModal = writable<CourseCompletionModalState | null>(null);

export function openCourseCompletionModal(courseId: string) {
  courseCompletionModal.set({ open: true, courseId, step: 'checking', evaluation: null });
}

export function updateCourseCompletionModal(
  courseId: string,
  step: ModalStep,
  evaluation: CertificationEvaluationData,
  exerciseId?: string
) {
  courseCompletionModal.set({ open: true, courseId, step, evaluation, exerciseId });
}

export function closeCourseCompletionModal() {
  courseCompletionModal.set(null);
}
