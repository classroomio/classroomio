import { createQuizModal, deleteModal } from '$lib/utils/store/org';

export function onEdit(_quiz: unknown) {}

export function onShare(_quiz: unknown) {}

export function onReport(_quiz: unknown) {}

export function onRename(quiz) {
  createQuizModal.update((m) => ({
    ...m,
    id: quiz.id,
    title: quiz.title,
    openEdit: true
  }));
}

export function onMakeCopy(_quiz: unknown) {}

export function onDelete(quiz) {
  deleteModal.update((m) => ({
    ...m,
    open: true,
    id: quiz.id
  }));
}
