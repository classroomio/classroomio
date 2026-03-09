import type { ExerciseSubmissions } from './types';
import { writable } from 'svelte/store';

export const submissions = writable<ExerciseSubmissions[]>([]);
