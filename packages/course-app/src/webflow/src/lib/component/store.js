import { writable } from 'svelte/store';

export let isDark = writable(false);

export let globalData = writable({});

export let courses = writable([]);
export let courseMetaData = writable({
  isLoading: false
});
