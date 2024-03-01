import type { Feed } from '$lib/utils/types/feed';
import { writable } from 'svelte/store';

export const isNewFeedModal = writable({
  open: false
});

export const Feeds = writable({
  newsFeed: [] as Feed[],
  isLoading: false
});
