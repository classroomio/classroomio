import { ContentType } from '@cio/utils/constants/content';
import { writable } from 'svelte/store';

export const contentCreateStore = writable({
  open: false,
  sectionId: '',
  initialType: ContentType.Section
});

export const contentEditingStore = writable<string | undefined>(undefined);
