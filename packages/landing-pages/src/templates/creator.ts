import type { LandingPageDocumentV1, LandingPageTemplateDefinition } from '../types';

export const CREATOR_DOCUMENT: LandingPageDocumentV1 = {
  schema: 'classroomio.landing-page',
  version: 1,
  templateId: 'creator',
  seo: {
    title: 'Masterclasses & Workshops | Learn Direct From Experts',
    description: 'Bite-sized, high-impact masterclasses taught by top creative and technical practitioners.'
  },
  theme: {
    primaryColor: '#ea580c',
    secondaryColor: '#f59e0b',
    backgroundColor: '#ffffff',
    fontFamily: 'outfit'
  },
  navigation: {
    showLogo: true,
    showAuthAction: true,
    customLinks: [
      { id: 'nav-courses', label: 'Masterclasses', href: '#courses' },
      { id: 'nav-about', label: 'About', href: '#about' },
      { id: 'nav-reviews', label: 'Reviews', href: '#reviews' }
    ]
  },
  hero: {
    badge: '✨ Practical & Real-World',
    headline: 'Level Up Your Craft With Step-By-Step Masterclasses',
    subheadline:
      'Zero fluff. Learn proven frameworks, workflows, and insights from years of real-world client and product experience.',
    primaryAction: {
      label: 'Browse Masterclasses',
      href: '#courses'
    },
    secondaryAction: {
      label: 'Read Student Reviews',
      href: '#reviews'
    },
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80'
  },
  sections: [
    {
      id: 'features-section',
      type: 'features',
      enabled: true,
      title: 'What Makes This Different',
      subtitle: 'Created specifically for self-driven learners who want immediate, applicable results.',
      items: [
        {
          id: 'feat-1',
          icon: 'sparkles',
          title: 'Direct Industry Insights',
          description:
            'No academic hypotheticals. Every lesson is based on real client briefs, product launches, and field-tested tactics.'
        },
        {
          id: 'feat-2',
          icon: 'clock',
          title: 'Self-Paced & Bite-Sized',
          description:
            'Designed for busy creators and professionals. Progress through digestible 10-15 minute video modules at your own pace.'
        },
        {
          id: 'feat-3',
          icon: 'message-circle',
          title: 'Direct Q&A Community',
          description: 'Get your specific questions answered and share work in progress with fellow learners.'
        }
      ]
    },
    {
      id: 'courses-section',
      type: 'courses',
      enabled: true,
      title: 'Available Masterclasses',
      subtitle: 'Dive deep into specific disciplines and elevate your craft today.',
      viewAllLabel: 'See All Courses',
      viewAllHref: '/courses',
      maxItems: 6
    },
    {
      id: 'testimonials-section',
      type: 'testimonials',
      enabled: true,
      title: 'What Students Are Saying',
      subtitle: 'Real feedback from practitioners who applied these lessons.',
      items: [
        {
          id: 'test-1',
          name: 'Sarah Jenkins',
          role: 'Independent Brand Designer',
          quote:
            'This course completely shifted how I pitch clients and deliver projects. Paid for itself on my very next gig.',
          rating: 5
        },
        {
          id: 'test-2',
          name: 'Marcus Chen',
          role: 'Senior Product Lead',
          quote:
            'The clarity and depth in each module is unmatched. Practical, inspiring, and exceptionally well produced.',
          rating: 5
        }
      ]
    },
    {
      id: 'faq-section',
      type: 'faq',
      enabled: true,
      title: 'Common Questions',
      subtitle: 'Got questions? Here are the answers to help you get started.',
      items: [
        {
          id: 'faq-1',
          question: 'Do I get lifetime access to the courses?',
          answer:
            'Yes! Once enrolled, you have unlimited lifetime access to all lessons, templates, and future course updates.'
        },
        {
          id: 'faq-2',
          question: 'Are project files and resources included?',
          answer: 'Every course includes downloadable project files, checklists, templates, and reference materials.'
        }
      ]
    },
    {
      id: 'cta-section',
      type: 'cta',
      enabled: true,
      title: 'Start learning something new today',
      description: 'Join thousands of students building their skills with our courses.',
      action: {
        label: 'Get Enrolled',
        href: '#courses'
      }
    }
  ],
  footer: {
    copyrightText: '© All rights reserved. Created with ClassroomIO.',
    links: [
      { id: 'footer-terms', label: 'Terms of Use', href: '/terms' },
      { id: 'footer-privacy', label: 'Privacy Policy', href: '/privacy' }
    ]
  }
};

export const CREATOR_TEMPLATE: LandingPageTemplateDefinition = {
  id: 'creator',
  name: 'Creator',
  description:
    'Warm, personality-driven studio layout ideal for educators, thought leaders, and independent instructors',
  document: CREATOR_DOCUMENT
};
