import { writable } from 'svelte/store';
import type { Pathway } from '$lib/utils/types';

export const pathways = writable<Pathway[]>([]);

export const view = writable('grid');

export const pathwayMetaData = writable<{
  isLoading: boolean;
  view: 'grid' | 'list';
}>({
  isLoading: true,
  view: 'grid'
});

export const createPathwayModal = writable({
  title: '',
  description: ''
});

export const pathwayModalInitialState = {
  open: false,
  id: '',
  title: '',
  isSaving: false,
  error: null
};

export const copyCourseModal = writable({ ...pathwayModalInitialState });
