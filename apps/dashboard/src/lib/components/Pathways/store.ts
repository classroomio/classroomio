import { writable } from 'svelte/store';
import type { Pathway, PathwayCourse } from '$lib/utils/types';

export const addCourseModal = writable({
  open: false,
  step: 0
});

export const courses = writable<PathwayCourse[]>([]);

export const pathway = writable<Pathway>({
  id: 'pathway-one',
  slug: 'pathway-one',
  title: 'Pathway One',
  description:         'Create, Launch & Market Your Own Online Business w/ Digital Products such as Online Courses, Coaching, eBooks, Webinars+',
  prerequisite: '',
  is_published: false,
  lms_certificate: false,
  courses_certificate: '',
  cost: 3000,
  currency: 'NGN',
  status: 'Published',
  created_at: '20, March, 2024',
  updated_at: '20, March, 2024',
  metadata: {
    header: {
      title: 'Online Business Masterclass: Sell Your Own Digital Products',
      description:
        'Create, Launch & Market Your Own Online Business w/ Digital Products such as Online Courses, Coaching, eBooks, Webinars+',
      duration: 'Estimated 8 weeks',
      cost: 300,
      buttonLabel: 'Enrol'
    },
    about: 
        "Become a Professional UX Specialist course offers a comprehensive pathway to mastery in user experience design. In today's digital landscape, exceptional user experiences are paramount for success. This course equips you with the skills and knowledge needed to create intuitive, engaging, and impactful designs that resonate with users. Gain a competitive edge, unlock career opportunities, and make a meaningful impact in shaping the future of digital interactions."
    ,
    objectives:
        ' <li>Develop a comprehensive understanding of user experience (UX) design principles, methodologies, and best practices.</li><li>Acquire hands-on experience in conducting user research, including methods for gathering, analyzing, and interpreting user insights.</li><li>Cultivate proficiency in creating wireframes, prototypes, and interactive designs using industry-standard tools and techniques.</li><li>Master the art of usability testing and iterative design processes to refine and optimize user interfaces for enhanced usability and user satisfaction.</li><li>Prepare for a successful career as a UX specialist by building a strong portfolio of diverse projects showcasing practical application of UX design principles and methodologies.</li></ul>'
    ,
    reviews: [
      {
        id: 1,
        show: true,
        name: 'Nana Ama Agyekumwaa',
        avatar_url: 'https://i.pravatar.cc/150?img=63',
        rating: 1,
        created_at: new Date(),
        description: 'Great and interesting, tutors breaks things down easily and illustrates ...'
      },
      {
        id: 2,
        show: true,
        name: 'Nana Ama Agyekumwaa',
        avatar_url: 'https://i.pravatar.cc/150?img=64',
        rating: 1,
        created_at: new Date(),
        description: 'Great and interesting, tutors breaks things down easily and illustrates ...'
      },
      {
        id: 3,
        show: true,
        name: 'Nana Ama Agyekumwaa',
        avatar_url: 'https://i.pravatar.cc/150?img=65',
        rating: 1,
        created_at: new Date(),
        description: 'Great and interesting, tutors breaks things down easily and illustrates ...'
      },
      {
        id: 4,
        show: true,
        name: 'Nana Ama Agyekumwaa',
        avatar_url: 'https://i.pravatar.cc/150?img=66',
        rating: 1,
        created_at: new Date(),
        description: 'Great and interesting, tutors breaks things down easily and illustrates ...'
      },
    ],
    instructor: {
      name: 'Marvellous  Woods',
      role: 'Product Designer',
      coursesNo: 50,
      description: "Derrick Amenuve is  UX/Product Designer  who solves human needs by creating usable and aesthetically pleasing interfaces to enhance human experiences and achieve business success. With focus on research and data driven approaches to create end to end designs that is true to the product's goals and the visual experience.",
      imgUrl: 'https://avatars.githubusercontent.com/u/74567285?v=4',
    },
    allowNewStudent: true,
    showDiscount: true,
    discount: 50
  },
  is_certificate_downloadable: false,
  certificate_theme: 'professional',
  courses: [
    {
      id: '4653bss37a-b0c4-4cf1-9dab-1ec4614a8643',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Basic Fundamental of graphic design',
      description: 'Begin with rudiment of  graphic design including typography, layouts, colours.....',
      total_lessons: 5,
      total_students: 30,
      estimated_hours: 3,
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
      order: ''
    },
    {
      id: '73f9ascas2bda-f306-4c7b-88d3-d3a4ed37fb06',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Establishing hierachy',
      description:
        'Begin with rudiment of  graphic design including typography, layouts, colours.....',
      total_lessons: 5,
      total_students: 10,
      estimated_hours: 3,
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
      order: ''
    },
    {
      id: '41afdjmh56e-938c-45be-8f71-e59465dacce1',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Empathy',
      description:
        'Begin with rudiment of  graphic design including typography, layouts, colours.....',
      total_lessons: 5,
      total_students: 3,
      estimated_hours: 3,
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
      order: ''
    },
    {
      id: 'ef15evr6ee-018d-48ab-a195-8030366aae06',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Learn Typography',
      description:
        'Begin with rudiment of  graphic design including typography, layouts, colours.....',
      total_lessons: 5,
      total_students: 2,
      estimated_hours: 3,
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
      order: ''
    },
    {
      id: 'ef15egcg6ee-018d-48ab-a195-8030366aae06',
      banner_image: '/images/org-landingpage-our-story.jpeg',
      title: 'Learn colours',
      description:
        'Begin with rudiment of  graphic design including typography, layouts, colours.....',
      total_lessons: 5,
      total_students: 30,
      estimated_hours: 3,
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
      order: ''
    }
  ],
  selectedCourses: []
});
