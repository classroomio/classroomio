import type { LandingPageDocumentV1, LandingPageTemplateDefinition } from '../types';

export const MODERN_DOCUMENT: LandingPageDocumentV1 = {
  schema: 'classroomio.landing-page',
  version: 1,
  templateId: 'modern',
  seo: {
    title: 'Modern Academy | Continuous Professional Learning',
    description: 'Premier online academy offering interactive modules, live exercises, and verified credentials.'
  },
  theme: {
    primaryColor: '#2563eb',
    secondaryColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    fontFamily: 'inter'
  },
  navigation: {
    showLogo: true,
    showAuthAction: true,
    customLinks: [
      { id: 'nav-courses', label: 'Explore Courses', href: '#courses' },
      { id: 'nav-features', label: 'Why Us', href: '#features' },
      { id: 'nav-faq', label: 'FAQ', href: '#faq' }
    ]
  },
  hero: {
    badge: '⚡ Interactive Learning',
    headline: 'Unlock Your Potential With World-Class Training',
    subheadline:
      'Explore expert-curated paths designed to build real mastery through interactive labs, challenges, and verified certification.',
    primaryAction: {
      label: 'Explore Catalog',
      href: '#courses'
    },
    secondaryAction: {
      label: 'Learn More',
      href: '#features'
    },
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
  },
  sections: [
    {
      id: 'features-section',
      type: 'features',
      enabled: true,
      title: 'Built For Modern Learners',
      subtitle: 'A clean, modern platform designed for smooth knowledge transfer and real skill development.',
      items: [
        {
          id: 'feat-1',
          icon: 'layers',
          title: 'Structured Learning Paths',
          description: 'Step-by-step curriculum guided by milestones and tangible checkpoints.'
        },
        {
          id: 'feat-2',
          icon: 'check-circle',
          title: 'Hands-On Exercises',
          description: 'Reinforce theoretical lessons with instant feedback on code and quizzes.'
        },
        {
          id: 'feat-3',
          icon: 'award',
          title: 'Verified Certificates',
          description: 'Receive digital credentials backed by public verification URLs upon finishing.'
        }
      ]
    },
    {
      id: 'courses-section',
      type: 'courses',
      enabled: true,
      title: 'Featured Courses',
      subtitle: 'Start with our most popular courses and accelerate your journey.',
      viewAllLabel: 'View All Courses',
      viewAllHref: '/courses',
      maxItems: 6
    },
    {
      id: 'testimonials-section',
      type: 'testimonials',
      enabled: true,
      title: 'Loved By Over 10,000+ Learners',
      subtitle: 'See how our platform helped students around the world achieve their goals.',
      items: [
        {
          id: 'test-1',
          name: 'Elena Rostova',
          role: 'Data Scientist',
          quote:
            'The structure of the courses and the clarity of explanations are phenomenal. I was able to transition into a new role seamlessly.',
          rating: 5
        },
        {
          id: 'test-2',
          name: 'David Kim',
          role: 'Product Designer',
          quote:
            'Concise, high-value, and immediately applicable. The best investment I made in my professional development this year.',
          rating: 5
        }
      ]
    },
    {
      id: 'faq-section',
      type: 'faq',
      enabled: true,
      title: 'Frequently Asked Questions',
      subtitle: 'Quick answers to common questions about our platform.',
      items: [
        {
          id: 'faq-1',
          question: 'Can I access the course material on mobile?',
          answer: 'Yes, our entire academy is responsive and works smoothly across desktops, tablets, and smartphones.'
        },
        {
          id: 'faq-2',
          question: 'Are there team or corporate discounts available?',
          answer: 'We provide group enrollment packages for teams and organizations. Contact our team to learn more.'
        }
      ]
    },
    {
      id: 'cta-section',
      type: 'cta',
      enabled: true,
      title: 'Ready to elevate your knowledge?',
      description: 'Sign up today and get instant access to our courses and exercises.',
      action: {
        label: 'Get Started Now',
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

export const MODERN_TEMPLATE: LandingPageTemplateDefinition = {
  id: 'modern',
  name: 'Modern Academy',
  description: 'Contemporary, clean layout with balanced typography and polished course showcases',
  document: MODERN_DOCUMENT
};
