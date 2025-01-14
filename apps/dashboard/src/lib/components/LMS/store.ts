import type { LMSCourse } from '$lib/utils/types';
import { writable } from 'svelte/store';

export const lmsCourses = writable<LMSCourse[]>([]);
