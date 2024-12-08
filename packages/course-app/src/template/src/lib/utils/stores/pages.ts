import { writable } from 'svelte/store';
import type { Page } from '$lib/utils/types/page';

const defaultPage: Page = {
  id: '',
  title: '',
  slug: '',
  status: 'draft',
  sections: []
};

export const homePage = writable<Page>(defaultPage);
export const sharedPage = writable<Page>(defaultPage);
