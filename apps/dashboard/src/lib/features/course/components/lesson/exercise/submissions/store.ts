import { writable } from 'svelte/store';
import type { ExerciseSubmissions } from '$lib/utils/types';

export const submissions = writable<ExerciseSubmissions[]>([]);
