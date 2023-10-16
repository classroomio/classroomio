import { writable, type Writable } from 'svelte/store';
import type { PollType } from './types';

export const polls: Writable<PollType[]> = writable([]);
