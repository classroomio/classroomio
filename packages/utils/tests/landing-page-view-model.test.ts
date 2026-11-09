import { describe, expect, it } from 'vitest';
import {
  projectPublicLandingPageViewModel,
  sanitizePublicLandingHref,
  sanitizePublicLandingImage,
  ZPublicLandingPageViewModel
} from '../src/validation/organization/landing-page-view-model';

describe('projectPublicLandingPageViewModel', () => {
  it('sanitizes unsafe href schemes', () => {
    expect(sanitizePublicLandingHref('javascript:alert(1)')).toBe('#');
    expect(sanitizePublicLandingHref('data:text/html;base64,PHNjcmlwdD4=')).toBe('#');
    expect(sanitizePublicLandingHref('vbscript:msgbox(1)')).toBe('#');
    expect(sanitizePublicLandingHref('https://classroomio.com')).toBe('https://classroomio.com');
    expect(sanitizePublicLandingHref('/courses')).toBe('/courses');
    expect(sanitizePublicLandingHref('#curriculum')).toBe('#curriculum');
    expect(sanitizePublicLandingHref('mailto:hello@classroomio.com')).toBe('mailto:hello@classroomio.com');
    expect(sanitizePublicLandingHref('tel:+123456789')).toBe('tel:+123456789');
  });

  it('sanitizes image URLs and qualifies relative paths', () => {
    expect(sanitizePublicLandingImage('javascript:alert(1)')).toBeUndefined();
    expect(sanitizePublicLandingImage('data:image/svg+xml,...')).toBeUndefined();
    expect(sanitizePublicLandingImage('https://images.unsplash.com/photo-123')).toBe(
      'https://images.unsplash.com/photo-123'
    );
    expect(sanitizePublicLandingImage('/images/hero.jpg', 'https://app.classroomio.com')).toBe(
      'https://app.classroomio.com/images/hero.jpg'
    );
    expect(sanitizePublicLandingImage('   ')).toBeUndefined();
    expect(sanitizePublicLandingImage(null)).toBeUndefined();
  });

  it('projects public view model and strips private state', () => {
    const rawLanding = {
      hero: {
        heading: 'Learn Modern AI',
        subheading: 'Master agentic engineering',
        eyebrow: 'Specialized Track',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
        stats: [
          { label: 'Learners', value: '10K+' },
          { label: 'Rating', value: '4.9' }
        ],
        primaryAction: {
          label: 'Start Now',
          href: 'javascript:stealToken()'
        },
        secondaryAction: {
          label: 'Explore Courses',
          href: '/courses'
        }
      },
      links: {
        enabled: true,
        title: 'Quick Resources',
        items: [
          { label: 'Documentation', href: 'https://docs.classroomio.com' },
          { label: 'Unsafe', href: 'data:text/html,evil' }
        ]
      },
      embed: {
        enabled: true,
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      },
      footer: {
        text: 'All rights reserved',
        links: [{ label: 'Privacy', href: '/privacy' }],
        socialLinks: [
          { platform: 'x', href: 'https://x.com/classroomio' },
          { platform: 'bad', href: 'javascript:alert(1)' }
        ]
      }
    };

    const rawCourses = [
      {
        id: 'course-1',
        title: 'Fullstack AI',
        description: 'Complete guide',
        slug: 'fullstack-ai',
        cost: 49,
        currency: 'USD',
        bannerImage: 'https://cdn.classroomio.com/banner.png',
        // Private fields that must NOT appear in view model
        internalNotes: 'Top secret draft',
        authorEmail: 'admin@school.com',
        stripeSecret: 'sk_test_123'
      }
    ];

    const viewModel = projectPublicLandingPageViewModel({
      theme: 'bold',
      templateId: 'neo-brutalism',
      org: {
        id: 'org-1',
        name: 'AI Academy',
        siteName: 'ai-academy',
        avatarUrl: 'https://cdn.classroomio.com/logo.png'
      },
      landingpage: rawLanding,
      courses: rawCourses,
      hasMoreCourses: false,
      isAuthenticated: false,
      signInLabel: 'Sign In'
    });

    const parsed = ZPublicLandingPageViewModel.safeParse(viewModel);
    expect(parsed.success).toBe(true);

    // Assert private data was omitted
    expect((viewModel.courses[0] as Record<string, unknown>).internalNotes).toBeUndefined();
    expect((viewModel.courses[0] as Record<string, unknown>).authorEmail).toBeUndefined();
    expect((viewModel.courses[0] as Record<string, unknown>).stripeSecret).toBeUndefined();

    // Assert unsafe hrefs were sanitized
    expect(viewModel.hero.eyebrow).toBe('Specialized Track');
    expect(viewModel.hero.image).toBe('https://images.unsplash.com/photo-1552664730-d307ca884978');
    expect(viewModel.hero.stats).toEqual([
      { label: 'Learners', value: '10K+' },
      { label: 'Rating', value: '4.9' }
    ]);
    expect(viewModel.hero.primaryAction?.href).toBe('/courses');
    expect(viewModel.links?.items[1].href).toBe('#');
    expect(viewModel.footer?.socialLinks).toHaveLength(1);
    expect(viewModel.footer?.socialLinks[0].platform).toBe('x');
  });
});

describe('projectPublicLandingPageViewModel with editor-shaped settings', () => {
  it('projects callout, embed, links and footer as the landing editor stores them', () => {
    const viewModel = projectPublicLandingPageViewModel({
      theme: 'com.classroomio.landing-templates:atelier',
      templateId: 'atelier',
      org: { id: 'org-1', name: 'Acme' },
      courses: [],
      hasMoreCourses: false,
      landingpage: {
        callout: {
          enabled: true,
          heading: 'Ready to start?',
          description: 'Join today',
          action: { label: 'Enroll', href: '/courses' }
        },
        embed: {
          enabled: true,
          title: 'Watch',
          code: '<iframe src="https://www.youtube.com/embed/abc" width="560"></iframe>',
          secondaryAction: { label: 'More', href: '/courses' }
        },
        links: {
          enabled: true,
          heading: 'Resources',
          cards: [{ icon: 'book-open', title: 'Docs', description: 'Read', href: 'https://docs.classroomio.com' }]
        },
        footer: {
          brand: {
            tagline: 'Learn',
            copyright: '© Acme',
            socials: [{ platform: 'x', href: 'https://x.com/acme' }]
          },
          columns: [{ id: 'c1', heading: 'Company', links: [{ id: 'l1', label: 'About', href: '/about' }] }],
          bottom: { text: 'Made with care', links: [{ id: 'b1', label: 'Privacy', href: '/privacy' }] }
        }
      }
    });

    expect(viewModel.callout?.title).toBe('Ready to start?');
    expect(viewModel.embed?.url).toBe('https://www.youtube.com/embed/abc');
    expect(viewModel.embed?.type).toBe('youtube');
    expect(viewModel.embed?.secondaryAction?.label).toBe('More');
    expect(viewModel.links?.cards?.[0].title).toBe('Docs');
    expect(viewModel.footer?.tagline).toBe('Learn');
    expect(viewModel.footer?.columns?.[0].links[0].label).toBe('About');
    expect(viewModel.footer?.links[0].label).toBe('Privacy');
    expect(viewModel.footer?.socialLinks[0].platform).toBe('x');
    expect(ZPublicLandingPageViewModel.safeParse(viewModel).success).toBe(true);
  });

  it('drops embeds whose iframe source is not https', () => {
    const viewModel = projectPublicLandingPageViewModel({
      theme: 't',
      templateId: 't',
      org: { id: 'o', name: 'A' },
      courses: [],
      hasMoreCourses: false,
      landingpage: { embed: { enabled: true, code: '<iframe src="javascript:alert(1)"></iframe>' } }
    });

    expect(viewModel.embed).toBeUndefined();
  });
});
