import { writable } from 'svelte/store';
import type { Course, Pathway } from '$lib/utils/types';

export type LmsCourse = Course | Pathway;

export const lms_courses = writable<LmsCourse[]>([]);
