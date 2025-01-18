/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CourseTag } from '$lib/utils/types';
import { writable } from 'svelte/store';

// this is to control CRUD operations for tags
export const createTagModal = writable({
  open: false,
  editMode: false,
  deleteMode: false
});

// this is to control adding tags to courses
export const addTagModal = writable({
  open: false
});

// to store all the tags in the organization
export const tags = writable<CourseTag[]>([]);

// to store the selected tag for edit & delete operations
export const selectedTag = writable<CourseTag>({} as CourseTag);
