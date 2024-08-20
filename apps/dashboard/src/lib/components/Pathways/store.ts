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
  title: '',
  description:
    '',
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
      title: 'Online Business Masterclass: Sell Your Own Digital Products',
      description:
        'Create, Launch & Market Your Own Online Business w/ Digital Products such as Online Courses, Coaching, eBooks, Webinars+',
      duration: 'Estimated 8 weeks',
      cost: 300,
      buttonLabel: 'Enrol'
    },
    about:
      "Become a Professional UX Specialist course offers a comprehensive pathway to mastery in user experience design. In today's digital landscape, exceptional user experiences are paramount for success. This course equips you with the skills and knowledge needed to create intuitive, engaging, and impactful designs that resonate with users. Gain a competitive edge, unlock career opportunities, and make a meaningful impact in shaping the future of digital interactions.",
    objectives:
      ' <li>Develop a comprehensive understanding of user experience (UX) design principles, methodologies, and best practices.</li><li>Acquire hands-on experience in conducting user research, including methods for gathering, analyzing, and interpreting user insights.</li><li>Cultivate proficiency in creating wireframes, prototypes, and interactive designs using industry-standard tools and techniques.</li><li>Master the art of usability testing and iterative design processes to refine and optimize user interfaces for enhanced usability and user satisfaction.</li><li>Prepare for a successful career as a UX specialist by building a strong portfolio of diverse projects showcasing practical application of UX design principles and methodologies.</li></ul>',
    reviews: [
      {
        id: 1,
        hide: false,
        name: 'Nana Ama Agyekumwaa',
        avatar_url: 'https://i.pravatar.cc/150?img=63',
        rating: 1,
        created_at: new Date().toISOString(),
        description: 'Great and interesting, tutors breaks things down easily and illustrates ...'
      },
      {
        id: 2,
        hide: false,
        name: 'Nana Ama Agyekumwaa',
        avatar_url: 'https://i.pravatar.cc/150?img=64',
        rating: 1,
        created_at: new Date().toISOString(),
        description: 'Great and interesting, tutors breaks things down easily and illustrates ...'
      },
      {
        id: 3,
        hide: false,
        name: 'Nana Ama Agyekumwaa',
        avatar_url: 'https://i.pravatar.cc/150?img=65',
        rating: 1,
        created_at: new Date().toISOString(),
        description: 'Great and interesting, tutors breaks things down easily and illustrates ...'
      },
      {
        id: 4,
        hide: false,
        name: 'Nana Ama Agyekumwaa',
        avatar_url: 'https://i.pravatar.cc/150?img=66',
        rating: 1,
        created_at: new Date().toISOString(),
        description: 'Great and interesting, tutors breaks things down easily and illustrates ...'
      }
    ],
    instructor: {
      name: 'Marvellous  Woods',
      role: 'Product Designer',
      coursesNo: 50,
      description:
        "Derrick Amenuve is  UX/Product Designer  who solves human needs by creating usable and aesthetically pleasing interfaces to enhance human experiences and achieve business success. With focus on research and data driven approaches to create end to end designs that is true to the product's goals and the visual experience.",
      imgUrl: 'https://avatars.githubusercontent.com/u/74567285?v=4'
    },
    allowNewStudent: true,
    showDiscount: true,
    discount: 50
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