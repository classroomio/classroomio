import type { ExerciseSubmissions } from '$features/course/utils/types';
import { writable } from 'svelte/store';

export const submissions = writable<ExerciseSubmissions[]>([]);
