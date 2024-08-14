import { writable } from 'svelte/store';
import type { Pathway, PathwayCourse, GroupStore } from '$lib/utils/types';

export const addCourseModal = writable({
  open: false,
  step: 0
});

export const courses = writable<PathwayCourse[]>([]);

export const group = writable<GroupStore>({
  id: "",
  tutors: [],
  students: [],
  people: []
});

export const defaultPathway: Pathway = {
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
  is_certificate_downloadable: false,
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
      is_published: false,
      created_at: '',

      updated_at: ''
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
      is_published: false,
      created_at: '',

      updated_at: ''
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
      is_published: false,
      created_at: '',

      updated_at: ''
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
      is_published: true,
      created_at: '',

      updated_at: ''
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
      is_published: true,
      created_at: '',

      updated_at: ''
    }
  ],
  selectedCourses: []
}

export const pathway = writable<Pathway>({ ... defaultPathway });

export async function setPathway(data: Pathway, setCourse = true) {
  if (!data || !(Object.values(data) && Object.values(data).length)) return;
  // const tutorsById = {};

  if (data.group) {
    const groupData = Object.assign(data.group, {
      tutors: [],
      students: [],
      people: []
    }) as GroupStore;

    if (Array.isArray(groupData.members)) {
      for (const member of groupData.members) {
        if (member.role_id === ROLE.STUDENT) {
          groupData.students.push(member);
        } else if (member.profile) {
          groupData.tutors.push({
            ...member.profile,
            memberId: member.id
          });
        }
      }

      groupData.people = groupData.members;
    }

    delete groupData.members;

    group.set(groupData);
  }

  if (setCourse) {
    const orderedCourses = (data.courses || []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    // .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    // .map((lesson) => ({
    //   ...lesson,
    //   profile: lesson.profile && tutorsById[lesson.profile.id],
    // }));
    courses.set(orderedCourses);
  }

  delete data.courses;

  if (data.metadata && !Object.values(data.metadata)) {
    data.metadata = {
      requirements: '',
      description: '',
      goals: '',
      videoUrl: '',
      showDiscount: false,
      discount: 0,
      reward: {
        show: false,
        description: ''
      },
      instructor: {
        name: '',
        role: '',
        coursesNo: 0,
        description: '',
        imgUrl: ''
      },
      allowNewStudent: false
    };
  }

  if (!data.certificate_theme) {
    data.certificate_theme = 'professional';
  }
  pathway.set(data);
}
