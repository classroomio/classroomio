import { writable } from 'svelte/store';
import type { Course } from '$lib/utils/types/course';

export const courses = writable<Course[]>([]);

export const course = writable<Course | null>(null);
