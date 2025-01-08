import { writable } from 'svelte/store';

export const pathwayLandingPageStore = writable({
  header: {
    title: 'Online Business Masterclass: Sell Your Own Digital Products',
    description:
      'Create, Launch & Market Your Own Online Business w/ Digital Products such as Online Courses, Coaching, eBooks, Webinars+',
    duration: 'Estimated 8 weeks',
    cost: 300,
    currency: '$',
    buttonLabel: 'Enroll Now'
  },
  about: {
    content:
      "You don't need any experience creating an online business or digital product. \nYou don't need an online presence, website, or following - but it will help kickstart your online business if you do."
  },
  objectives: {
    content:
      ' <li>Develop a comprehensive understanding of user experience (UX) design principles, methodologies, and best practices.</li><li>Acquire hands-on experience in conducting user research, including methods for gathering, analyzing, and interpreting user insights.</li><li>Cultivate proficiency in creating wireframes, prototypes, and interactive designs using industry-standard tools and techniques.</li><li>Master the art of usability testing and iterative design processes to refine and optimize user interfaces for enhanced usability and user satisfaction.</li><li>Prepare for a successful career as a UX specialist by building a strong portfolio of diverse projects showcasing practical application of UX design principles and methodologies.</li></ul>'
  },
  reviews: [
    {
      id: 1,
      show: true,
      name: 'Nana Ama Agyekumwaa',
      avatar_url: '/logo-192.png',
      rating: 1,
      created_at: new Date(),
      description: 'Great and interesting, tutors breaks things down easily and illustrates ...'
    }
  ]
});

export const reviewsModalStore = writable({
  open: false
});

export let handleOpenWidget = writable({
  open: false
});
