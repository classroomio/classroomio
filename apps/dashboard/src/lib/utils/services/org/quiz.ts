import { createQuizModal, deleteModal } from '$lib/utils/store/org';

export function onEdit(quiz) {}

export function onShare(quiz) {}

export function onReport(quiz) {}

export function onRename(quiz) {
  createQuizModal.update((m) => ({
    ...m,
    id: quiz.id,
    title: quiz.title,
    openEdit: true
  }));
}

export function onMakeCopy(quiz) {}

export function onDelete(quiz) {
  deleteModal.update((m) => ({
    ...m,
    open: true,
    id: quiz.id
  }));
}
