import { writable } from 'svelte/store';
import type { Course } from '$lib/utils/types/course';

export const courses = writable<Course[]>([]);

export const course = writable<Course | null>(null);

/**
on course page
- load sections, lesson titles etc
- content should only be loaded based on the lesson selected
*/
