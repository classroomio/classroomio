import { writable } from "svelte/store";
import type { Writable } from 'svelte/store';
import type { Pathway, PathwayCourse } from "$lib/utils/types";

export const addCourseModal = writable({
  open: false,
  step: 0
});

export const courses = writable<PathwayCourse[]>([]);

export const pathway: Writable<Pathway> = writable({
  slug: '',
  title: '',
  avatar: "",
  description: '',
  prerequisite: '',
  is_published: false,
  lms_certificate: false,
  courses_certificate: '',
  courses: [],
  selectedCourses: []
});
