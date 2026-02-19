import { ContentType } from '@cio/utils/constants/content';
import { writable } from 'svelte/store';

export const contentCreateStore = writable({
  open: false,
  sectionId: '',
  initialType: ContentType.Section,
  skipTypeSelection: false
});

export const contentCreateStoreUtils = {
  openContentUnit: (sectionId: string) => {
    contentCreateStore.set({
      open: true,
      sectionId,
      initialType: ContentType.Lesson,
      skipTypeSelection: false
    });
  },
  openSection: () => {
    contentCreateStore.set({
      open: true,
      sectionId: '',
      initialType: ContentType.Section,
      skipTypeSelection: true
    });
  },
  openDefault: () => {
    contentCreateStore.set({
      open: true,
      sectionId: '',
      initialType: ContentType.Lesson,
      skipTypeSelection: false
    });
  },
  close: () => {
    contentCreateStore.set({
      open: false,
      sectionId: '',
      initialType: ContentType.Lesson,
      skipTypeSelection: false
    });
  }
};

export const contentEditingStore = writable<string | undefined>(undefined);
