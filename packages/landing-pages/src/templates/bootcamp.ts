import type { LandingPageDocumentV1, LandingPageTemplateDefinition } from '../types';

export const BOOTCAMP_DOCUMENT: LandingPageDocumentV1 = {
  schema: 'classroomio.landing-page',
  version: 1,
  templateId: 'bootcamp',
  seo: {
    title: 'Code Bootcamp | Accelerate Your Tech Career',
    description: 'Intensive, project-driven engineering programs built for career acceleration.'
  },
  theme: {
    primaryColor: '#4f46e5',
    secondaryColor: '#06b6d4',
    backgroundColor: '#0f172a',
    fontFamily: 'plus-jakarta-sans'
  },
  navigation: {
    showLogo: true,
    showAuthAction: true,
    customLinks: [
      { id: 'nav-courses', label: 'Programs', href: '#courses' },
      { id: 'nav-curriculum', label: 'Curriculum', href: '#curriculum' },
      { id: 'nav-faq', label: 'FAQ', href: '#faq' }
    ]
  },
  hero: {
    badge: '🚀 Next Cohort Starting Soon',
    headline: 'Master Modern Engineering From Industry Leaders',
    subheadline:
      'A fast-paced, hands-on curriculum engineered to take you from core fundamentals to production architecture.',
    primaryAction: {
      label: 'Explore Programs',
      href: '#courses'
    },
    secondaryAction: {
      label: 'View Curriculum',
      href: '#curriculum'
    },
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
  },
  sections: [
    {
      id: 'stats-section',
      type: 'stats',
      enabled: true,
      items: [
        { id: 'stat-1', label: 'Employment Rate', value: '94%' },
        { id: 'stat-2', label: 'Graduates Placed', value: '1,200+' },
        { id: 'stat-3', label: 'Hiring Partners', value: '45+' },
        { id: 'stat-4', label: 'Average Salary Boost', value: '+42%' }
      ]
    },
    {
      id: 'features-section',
      type: 'features',
      enabled: true,
      title: 'Why Learn With Us',
      subtitle: 'Engineered specifically for practical workplace mastery, not just theory.',
      items: [
        {
          id: 'feat-1',
          icon: 'code',
          title: 'Project-First Learning',
          description:
            'Build real-world fullstack applications with automated testing, CI/CD, and production deployment.'
        },
        {
          id: 'feat-2',
          icon: 'users',
          title: '1:1 Expert Mentorship',
          description:
            'Weekly code reviews and pair programming sessions with senior engineers currently working in top tech.'
        },
        {
          id: 'feat-3',
          icon: 'briefcase',
          title: 'Career & Portfolio Prep',
          description:
            'Dedicated support for technical resume building, live mock interviews, and portfolio presentation.'
        }
      ]
    },
    {
      id: 'courses-section',
      type: 'courses',
      enabled: true,
      title: 'Featured Programs',
      subtitle: 'Choose the cohort that matches your goals and schedule.',
      viewAllLabel: 'Browse All Courses',
      viewAllHref: '/courses',
      maxItems: 6
    },
    {
      id: 'testimonials-section',
      type: 'testimonials',
      enabled: true,
      title: 'Graduate Success Stories',
      subtitle: 'Hear from engineers who transformed their careers through our cohorts.',
      items: [
        {
          id: 'test-1',
          name: 'Alex Rivera',
          role: 'Full Stack Engineer at Stripe',
          quote:
            'The hands-on curriculum and direct code reviews helped me land my dream role within 6 weeks of graduation.',
          rating: 5
        },
        {
          id: 'test-2',
          name: 'Maya Patel',
          role: 'Software Engineer at Deliveroo',
          quote:
            'Transitioning into tech seemed daunting until I joined. The standard of engineering practiced here is top tier.',
          rating: 5
        }
      ]
    },
    {
      id: 'faq-section',
      type: 'faq',
      enabled: true,
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about joining and completing the programs.',
      items: [
        {
          id: 'faq-1',
          question: 'How much time commitment is expected each week?',
          answer:
            'We recommend dedicating 15 to 20 hours per week for lectures, hands-on labs, and collaborative team sprints.'
        },
        {
          id: 'faq-2',
          question: 'Do I get a verified certificate upon completion?',
          answer:
            'Yes! Every graduate earns an official, cryptographically verifiable certificate to share on LinkedIn and with employers.'
        },
        {
          id: 'faq-3',
          question: 'What happens if I miss a live session?',
          answer:
            'All sessions are recorded in high definition and available immediately inside your student dashboard along with course notes.'
        }
      ]
    },
    {
      id: 'cta-section',
      type: 'cta',
      enabled: true,
      title: 'Ready to elevate your engineering craft?',
      description: 'Join hundreds of ambitious developers in our upcoming cohorts.',
      action: {
        label: 'Get Started Today',
        href: '#courses'
      }
    }
  ],
  footer: {
    copyrightText: '© All rights reserved. Powered by ClassroomIO.',
    links: [
      { id: 'footer-terms', label: 'Terms', href: '/terms' },
      { id: 'footer-privacy', label: 'Privacy', href: '/privacy' }
    ]
  }
};

export const BOOTCAMP_TEMPLATE: LandingPageTemplateDefinition = {
  id: 'bootcamp',
  name: 'Bootcamp',
  description: 'Structured, outcome-driven tech academy layout with bold accents and strong social proof',
  document: BOOTCAMP_DOCUMENT
};
