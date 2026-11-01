import type { LandingPageDocumentV1, LandingPageTemplateDefinition } from '../types';

export const MINIMAL_DOCUMENT: LandingPageDocumentV1 = {
  schema: 'classroomio.landing-page',
  version: 1,
  templateId: 'minimal',
  seo: {
    title: 'Curated Learning | High-Impact Knowledge',
    description: 'A focused, distraction-free environment for deep learning and mastery.'
  },
  theme: {
    primaryColor: '#18181b',
    secondaryColor: '#52525b',
    backgroundColor: '#fafafa',
    fontFamily: 'space-grotesk'
  },
  navigation: {
    showLogo: true,
    showAuthAction: true,
    customLinks: [
      { id: 'nav-courses', label: 'Courses', href: '#courses' },
      { id: 'nav-about', label: 'About', href: '#about' }
    ]
  },
  hero: {
    badge: 'Curated Catalog',
    headline: 'Essential Knowledge. Zero Distraction.',
    subheadline:
      'We curate the most impactful frameworks, lessons, and exercises to help you master new capabilities without information overload.',
    primaryAction: {
      label: 'Explore Catalog',
      href: '#courses'
    },
    mediaType: 'none'
  },
  sections: [
    {
      id: 'features-section',
      type: 'features',
      enabled: true,
      title: 'Our Principles',
      subtitle: 'Everything you need, nothing you do not.',
      items: [
        {
          id: 'feat-1',
          icon: 'target',
          title: 'Direct & Concise',
          description: 'No filler. Every concept is distilled to its core principles with practical examples.'
        },
        {
          id: 'feat-2',
          icon: 'compass',
          title: 'Self-Paced Progression',
          description: 'Learn at your rhythm with lifetime access to all learning materials.'
        }
      ]
    },
    {
      id: 'courses-section',
      type: 'courses',
      enabled: true,
      title: 'Current Offerings',
      subtitle: 'Carefully curated courses open for enrollment.',
      viewAllLabel: 'View All',
      viewAllHref: '/courses',
      maxItems: 6
    },
    {
      id: 'cta-section',
      type: 'cta',
      enabled: true,
      title: 'Begin your learning journey',
      description: 'Enroll in a course today and gain immediate access.',
      action: {
        label: 'Get Started',
        href: '#courses'
      }
    }
  ],
  footer: {
    copyrightText: '© All rights reserved.',
    links: [
      { id: 'footer-terms', label: 'Terms', href: '/terms' },
      { id: 'footer-privacy', label: 'Privacy', href: '/privacy' }
    ]
  }
};

export const MINIMAL_TEMPLATE: LandingPageTemplateDefinition = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Stripped-back editorial aesthetic emphasizing clear typography, whitespace, and focus on curriculum',
  document: MINIMAL_DOCUMENT
};
