import { writable, type Writable } from 'svelte/store';
import type { IPoll } from './types';

export const polls: Writable<IPoll[]> = writable([]);
