import { writable } from 'svelte/store';

export interface CurrentCommunityQuestion {
  title: string | null;
}

export const currentCommunityQuestion = writable<CurrentCommunityQuestion>({
  title: null
});

