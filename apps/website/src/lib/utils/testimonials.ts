import type { Testimonial } from './types';

export const testimonials: Testimonial[] = [
  {
    id: 'jody-segers',
    quote: [
      {
        text: 'We needed a platform where we could setup training classes for our clients, some paid, some unpaid. The eagerness of Rotimi to work with us and to help customise ClassroomIO for our needs was a game changer. The platform itself is sleek and '
      },
      {
        text: 'we love it because it helps us get training material out to clients, while clients can also monitor progress of their staff',
        highlight: true
      },
      { text: '.' }
    ],
    name: 'Jody Segers',
    role: 'MD of QuickEasy Business Systems',
    avatar: '/testimonials/jody.webp'
  },
  {
    id: 'dr-ozzy',
    quote: [
      { text: 'ClassroomIO helps me focus on the learning experience', highlight: true },
      { text: ' rather than getting caught up in a complicated platform. ClassroomIO is fast ve user friendly. ' },
      { text: 'I’d definitely recommend ClassroomIO to a friend or colleague', highlight: true },
      {
        text: ' looking for a practical platform to deliver their courses. Overall, it’s been a positive experience, and I’m happy to share my support!'
      }
    ],
    name: 'Dr Ozzy',
    role: 'Academic Programs Coordinator',
    avatar: '/testimonials/drozzy.webp'
  },
  {
    id: 'pranav',
    quote: [
      { text: 'Checkout @classroomio. Flat pricing, open source and great customer support. ' },
      { text: 'I have yet to find a better platform for hosting courses', highlight: true }
    ],
    name: 'Pranav | prnv.eth | 🚀 EthSF',
    role: '@_pranav_singhal',
    avatar: '/testimonials/pranav.webp'
  },
  {
    id: 'jj',
    quote: [
      { text: 'Just discovered @classroomio — super cool open source platform', highlight: true },
      { text: ' for running tech boot camps by the talented @rotimi_best. 🇳🇬 🫶 github.com/rotimi-best/cl…' }
    ],
    name: 'JJ',
    role: 'Founder and General Partner of OSS Capital',
    avatar: '/testimonials/jj.jpg'
  }
];
