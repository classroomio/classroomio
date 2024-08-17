import { writable } from 'svelte/store';
import type { Pathway, PathwayCourse, GroupStore } from '$lib/utils/types';

export const addCourseModal = writable({
  open: false,
  step: 0
});

export const courses = writable<PathwayCourse[]>([]);

export const pathway = writable<Pathway>({
  id: 'pathway-one',
  title: 'pathwayOne',
  description: '',
  prerequisite: '',
  is_published: false,
  lms_certificate: false,
  courses_certificate: '',
  cost: 3000,
  status: 'Published',
  created_at: '20, March, 2024',
  updated_at: '20, March, 2024',
  metadata: {},
  is_certificate_downloadable: true,
  certificate_theme: 'professional',
  courses: [
    {
      id: '4653bss37a-b0c4-4cf1-9dab-1ec4614a8643',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Basic Fundamental of graphic design',
      description:
        'Begin with rudiment of  graphic design including typography, layouts, colours.....',
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
      id: '73f9ascas2bda-f306-4c7b-88d3-d3a4ed37fb06',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Establishing hierachy',
      description:
        'Begin with rudiment of  graphic design including typography, layouts, colours.....',
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
      id: '41afdjmh56e-938c-45be-8f71-e59465dacce1',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Empathy',
      description:
        'Begin with rudiment of  graphic design including typography, layouts, colours.....',
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
      id: 'ef15evr6ee-018d-48ab-a195-8030366aae06',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Learn Typography',
      description:
        'Begin with rudiment of  graphic design including typography, layouts, colours.....',
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
      id: 'ef15egcg6ee-018d-48ab-a195-8030366aae06',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Learn colours',
      description:
        'Begin with rudiment of  graphic design including typography, layouts, colours.....',
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
    }
  ],
  selectedCourses: []
});

export const group = writable<GroupStore>({
  id: '',
  tutors: [],
  students: [],
  people: [
    {
      assigned_student_id: 1,
      created_at: '',
      email: 'testemail@gmail.com',
      group_id: '3bdeddc4-aea9-4f7f-a099-9d094f031a39',
      id: '3a4fbb86-0d44-4f8d-a903-54b4a7396f48',
      memberId: '3a4fbb86-0d44-4f8d-a903-54b4a7396f48',
      profile: {
        avatar_url:
          'https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/avatar.png',
        can_add_course: true,
        created_at: '2024-05-28T12:23:00.585402+00:00',
        email: 'testemail@gmail.com',
        fullname: 'Frank Ocean',
        goal: '',
        id: '5e3c306f-d1b0-4ccb-8d48-3ae140dc1f60',
        role: '1',
        source: 'search-engine',
        updated_at: '2024-05-28T12:23:00.585402+00:00',
        username: 'admin1716898979376'
      },
      profile_id: '3d207582-eaf8-4cff-9314-f265f548c0e7',
      role_id: 3,
      fullname: 'Frank Ocean'
    }
  ]
});
