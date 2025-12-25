import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

interface Scores {
  X: number;
  O: number;
  draw: number;
}

interface ChangeToComputer {
  change: boolean;
}

export const scores: Writable<Scores> = writable({
  X: 0,
  O: 0,
  draw: 0
});

export const changeToComputer: Writable<ChangeToComputer> = writable({
  change: false
});
