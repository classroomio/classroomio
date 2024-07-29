import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { Pathway, PathwayCourse } from '$lib/utils/types';

export const addCourseModal = writable({
  open: false,
});

export const courses = writable<PathwayCourse[]>([]);

export const pathway: Writable<Pathway> = writable({
  id: 'pathway-one',
  title: 'pathwayOne',
  avatar: '',
  description: '',
  prerequisite: '',
  is_published: false,
  lms_certificate: false,
  courses_certificate: '',
  courses: [
    {
      id: "4653bss37a-b0c4-4cf1-9dab-1ec4614a8643",
      banner_image: "/images/org-landingpage-our-story.jpeg",
      title: "Basic Fundamental of graphic design",
      description: "Begin with rudiment of  graphic design including typography, layouts, colours.....",
      total_lessons: 5,
      total_students: 30,
      is_unlocked: true,
      is_completed: [
        {
          id: 1,
          course_id: '4653b37a-b0c4-4cf1-9dab-1ec4614a8643',
          profile_id: '',
          is_complete: true,
          created_at: '',
          updated_at: ''
        }
      ],
      is_published: false
    },
    {
      id: "73f9ascas2bda-f306-4c7b-88d3-d3a4ed37fb06",
      banner_image: "/images/org-landingpage-our-story.jpeg",
      title: "Establishing hierachy",
      description: "Begin with rudiment of  graphic design including typography, layouts, colours.....",
      total_lessons: 5,
      total_students: 10,
      is_unlocked: false,
      is_completed: [
        {
          id: 1,
          course_id: '73f92bda-f306-4c7b-88d3-d3a4ed37fb06',
          profile_id: '',
          is_complete: true,
          created_at: '',
          updated_at: ''
        }
      ],
      is_published: false
    },
    {
      id: "41afdjmh56e-938c-45be-8f71-e59465dacce1",
      banner_image: "/images/org-landingpage-our-story.jpeg",
      title: "Empathy",
      description: "Begin with rudiment of  graphic design including typography, layouts, colours.....",
      total_lessons: 5,
      total_students: 3,
      is_unlocked: false,
      is_completed: [
        {
          id: 1,
          course_id: '41afd56e-938c-45be-8f71-e59465dacce1',
          profile_id: '',
          is_complete: true,
          created_at: '',
          updated_at: ''
        }
      ],
      is_published: false
    },
    {
      id: "ef15evr6ee-018d-48ab-a195-8030366aae06",
      banner_image: "/images/org-landingpage-our-story.jpeg",
      title: "Learn Typography",
      description: "Begin with rudiment of  graphic design including typography, layouts, colours.....",
      total_lessons: 5,
      total_students: 2,
      is_unlocked: false,
      is_completed: [
        {
          id: 1,
          course_id: 'ef15e6ee-018d-48ab-a195-8030366aae06',
          profile_id: '',
          is_complete: true,
          created_at: '',
          updated_at: ''
        }
      ],
      is_published: true
    },
    {
      id: "ef15egcg6ee-018d-48ab-a195-8030366aae06",
      banner_image: "/images/org-landingpage-our-story.jpeg",
      title: "Learn colours",
      description: "Begin with rudiment of  graphic design including typography, layouts, colours.....",
      total_lessons: 5,
      total_students: 30,
      is_unlocked: false,
      is_completed: [
        {
          id: 1,
          course_id: 'ef15e6ee-018d-48ab-a195-8030366aae06',
          profile_id: '',
          is_complete: true,
          created_at: '',
          updated_at: ''
        }
      ],
      is_published: true
    },
  ],
  selectedCourses: []
});
