import type { CourseTag } from '$lib/utils/types';
import { writable } from 'svelte/store';

export const createTagModal = writable({
  open: false,
  editMode: false,
  deleteMode: false
});

export const addTagModal = writable({
  open: false
});

export const tags = writable<CourseTag[]>([]);

export const selectedTag = writable<CourseTag>({} as CourseTag);
