import { writable } from 'svelte/store';

export type CourseCompletionModalState = {
  open: boolean;
  courseId: string;
};

export const courseCompletionModal = writable<CourseCompletionModalState | null>(null);

export function openCourseCompletionModal(courseId: string) {
  courseCompletionModal.set({ open: true, courseId });
}

export function closeCourseCompletionModal() {
  courseCompletionModal.set(null);
}
