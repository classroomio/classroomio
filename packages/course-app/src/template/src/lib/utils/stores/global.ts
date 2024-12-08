import { writable } from 'svelte/store';

export let isDark = writable(false);

export let globalData = writable({});
