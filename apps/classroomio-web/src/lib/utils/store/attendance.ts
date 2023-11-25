import { writable } from 'svelte/store';

export const attendance = writable<{
  [key: string]: {
    [key: string]: {
      is_present: boolean;
      id: number;
    };
  };
}>({});
