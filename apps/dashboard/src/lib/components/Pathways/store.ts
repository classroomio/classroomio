import { writable } from 'svelte/store';
import type { Pathway, PathwayCourse, GroupStore } from '$lib/utils/types';
import { ROLE } from '$lib/utils/constants/roles';

export const RADIO_VALUE = {
  TRUE: 'true',
  FALSE: 'false'
};

export const addCourseModal = writable({
  open: false,
  step: 0
});

export const courses = writable<PathwayCourse[]>([]);

export const pathwaySettings = writable({
  title: '',
  logo: '',
  description: '',
  prerequisite: RADIO_VALUE.FALSE,
  is_published: false,
  lms_certificate: false,
  courses_certificate: RADIO_VALUE.FALSE,
  metadata: {}
});

export const group = writable<GroupStore>({
  id: '',
  tutors: [],
  students: [],
  people: []
});

export const defaultPathway: Pathway = {
  id: '',
  slug: '',
  logo: '',
  title: '',
  description: '',
  prerequisite: '',
  is_published: false,
  lms_certificate: false,
  courses_certificate: RADIO_VALUE.FALSE,
  cost: 0,
  currency: '',
  status: 'Published',
  created_at: new Date().toDateString(),
  updated_at: new Date().toDateString(),
  enrollment_date: '',
  landingpage: {
    header: {
      title: '',
      description: '',
      duration: '',
      cost: 0,
      buttonLabel: 'Enroll'
    },
    about: '',
    objectives: ``,
    reviews: [],
    instructor: {
      name: '',
      role: '',
      coursesNo: 0,
      description: '',
      imgUrl: ''
    },
    allowNewStudent: true,
    showDiscount: true,
    discount: 0
  },
  is_certificate_downloadable: false,
  certificate_theme: 'professional',
  pathway_course: []
};

export const pathway = writable<Pathway>({ ...defaultPathway });

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
    courses.set(data.pathway_course || []);
  }

  if (data.landingpage && !Object.values(data.landingpage)) {
    data.landingpage = {
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
