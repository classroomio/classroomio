import { writable } from 'svelte/store';
import type { Course, Pathway } from '$lib/utils/types';

export type LMSCourse = Course | Pathway;

export const lmsCourses = writable<LMSCourse[]>([]);
