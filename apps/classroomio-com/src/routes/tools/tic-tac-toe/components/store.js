import { writable } from 'svelte/store';

export const scores = writable({
  X: 0,
  O: 0,
  draw: 0
});

export const changeToComputer = writable({
  change: false
});
