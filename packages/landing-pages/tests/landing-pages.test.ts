import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  getDefaultDocumentForTemplate,
  isLandingPageDocumentV1,
  isLandingPagePresentationV1,
  renderLandingPage,
  sanitizeHref,
  sanitizeImageUrl,
  TEMPLATE_LIST,
  TEMPLATES,
  validateLandingPageDocument,
  validateLandingPagePresentation,
  type LandingPagePresentationV1,
  type LandingPageRenderData
} from '../src';

describe('@cio/landing-pages', () => {
  describe('templates', () => {
    it('provides all 4 core templates', () => {
      expect(TEMPLATE_LIST.length).toBe(4);
      expect(Object.keys(TEMPLATES)).toEqual(['bootcamp', 'creator', 'modern', 'minimal']);
    });

    it('validates all built-in template documents successfully', () => {
      for (const tpl of TEMPLATE_LIST) {
        const validation = validateLandingPageDocument(tpl.document);
        expect(validation.success, `Template ${tpl.id} failed validation: ${validation.error}`).toBe(true);
        expect(isLandingPageDocumentV1(tpl.document)).toBe(true);
      }
    });

    it('returns a clone of the default document for a template', () => {
      const doc1 = getDefaultDocumentForTemplate('bootcamp');
      const doc2 = getDefaultDocumentForTemplate('bootcamp');
      expect(doc1).toEqual(doc2);
      expect(doc1).not.toBe(doc2);
    });
  });

  describe('schema validation and sanitization', () => {
    it('sanitizes hrefs safely', () => {
      expect(sanitizeHref('/courses')).toBe('/courses');
      expect(sanitizeHref('#faq')).toBe('#faq');
      expect(sanitizeHref('https://classroomio.com')).toBe('https://classroomio.com');
      expect(sanitizeHref('mailto:help@classroomio.com')).toBe('mailto:help@classroomio.com');
      expect(sanitizeHref('../courses')).toBe('../courses');
      expect(sanitizeHref('javascript:alert(1)')).toBe('#');
      expect(sanitizeHref('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('#');
      expect(sanitizeHref(null)).toBe('#');
      expect(sanitizeHref('')).toBe('#');
    });

    it('sanitizes image URLs safely', () => {
      expect(sanitizeImageUrl('https://example.com/logo.png')).toBe('https://example.com/logo.png');
      expect(sanitizeImageUrl('/images/hero.jpg')).toBe('/images/hero.jpg');
      expect(sanitizeImageUrl('javascript:alert(1)')).toBeUndefined();
      expect(sanitizeImageUrl(null)).toBeUndefined();
      expect(sanitizeImageUrl('')).toBeUndefined();
    });

    it('rejects invalid hex colors', () => {
      const doc = getDefaultDocumentForTemplate('modern');
      const invalidDoc = {
        ...doc,
        theme: {
          ...doc.theme,
          primaryColor: 'not-a-hex'
        }
      };
      const validation = validateLandingPageDocument(invalidDoc);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain('hex color');
    });

    it('validates a complete LandingPagePresentationV1 record', () => {
      const doc = getDefaultDocumentForTemplate('modern');
      const presentation: LandingPagePresentationV1 = {
        kind: 'document',
        schema: 'classroomio.landing-page',
        version: 1,
        source: {
          kind: 'plugin',
          pluginId: 'com.classroomio.landing-studio',
          installationId: 'c1c1c1c1-1111-4111-8111-111111111111',
          pluginVersion: '1.0.0',
          templateSourceId: 'modern',
          templateName: 'Modern Academy'
        },
        document: doc,
        revision: 1,
        publishedAt: new Date().toISOString(),
        publishedBy: 'user-admin-123'
      };

      expect(isLandingPagePresentationV1(presentation)).toBe(true);
      const validation = validateLandingPagePresentation(presentation);
      expect(validation.success).toBe(true);
    });

    it('rejects presentation with invalid installationId UUID', () => {
      const doc = getDefaultDocumentForTemplate('modern');
      const presentation = {
        kind: 'document',
        schema: 'classroomio.landing-page',
        version: 1,
        source: {
          kind: 'plugin',
          pluginId: 'com.classroomio.landing-studio',
          installationId: 'not-a-uuid',
          pluginVersion: '1.0.0'
        },
        document: doc,
        revision: 1,
        publishedAt: new Date().toISOString(),
        publishedBy: 'user-1'
      };

      const validation = validateLandingPagePresentation(presentation);
      expect(validation.success).toBe(false);
    });
  });

  describe('renderer', () => {
    const mockRenderData: LandingPageRenderData = {
      organization: {
        id: 'org-1',
        name: 'Acme Academy',
        slug: 'acme',
        logoUrl: 'https://example.com/acme.png'
      },
      courses: [
        {
          id: 'course-1',
          title: 'Fullstack TypeScript',
          slug: 'fullstack-ts',
          description: 'Build robust scalable web apps with TS and Node.',
          image: 'https://example.com/course1.jpg',
          isPricing: true,
          cost: 49.99,
          currency: '$',
          totalLessons: 24
        }
      ],
      auth: {
        isAuthenticated: false,
        user: null,
        action: { label: 'Sign in', href: '/login' }
      }
    };

    it('renders landing page with organization branding and courses', () => {
      const doc = getDefaultDocumentForTemplate('bootcamp');
      const result = renderLandingPage(doc, mockRenderData);

      expect(result.html).toContain('Acme Academy');
      expect(result.html).toContain('https://example.com/acme.png');
      expect(result.html).toContain('Fullstack TypeScript');
      expect(result.html).toContain('$49.99');
      expect(result.html).toContain('24 lessons');
      expect(result.html).toContain('/course/fullstack-ts');
      expect(result.css).toContain('--cio-lp-primary: #4f46e5');
      expect(result.fontsHref).toContain('Plus+Jakarta+Sans');
      expect(result.meta.title).toContain('Code Bootcamp');
    });

    it('escapes user input to prevent XSS injection', () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe('&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;');

      const doc = getDefaultDocumentForTemplate('creator');
      doc.hero.headline = '<img src=x onerror=alert(1)>';
      doc.hero.subheadline = '"><script>alert(2)</script>';

      const result = renderLandingPage(doc, mockRenderData);
      expect(result.html).not.toContain('<img src=x onerror=alert(1)>');
      expect(result.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(result.html).not.toContain('<script>alert(2)</script>');
    });

    it('renders authenticated dashboard button when user is logged in', () => {
      const doc = getDefaultDocumentForTemplate('modern');
      const authData: LandingPageRenderData = {
        ...mockRenderData,
        auth: {
          isAuthenticated: true,
          user: { id: 'u1', name: 'John Doe', email: 'john@example.com' },
          action: { label: 'Continue learning', href: '/lms' }
        }
      };

      const result = renderLandingPage(doc, authData);
      expect(result.html).toContain('Continue learning');
      expect(result.html).toContain('/lms');
      expect(result.html).not.toContain('Sign in');
    });

    it('renders video and contact sections correctly', () => {
      const doc = getDefaultDocumentForTemplate('modern');
      doc.sections.push({
        id: 'sec-video',
        type: 'video',
        enabled: true,
        title: 'Watch our story',
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ'
      });
      doc.sections.push({
        id: 'sec-contact',
        type: 'contact',
        enabled: true,
        title: 'Get in touch',
        fields: [{ id: 'f1', name: 'email', label: 'Work Email', type: 'email', required: true }]
      });

      const validation = validateLandingPageDocument(doc);
      expect(validation.success).toBe(true);

      const result = renderLandingPage(doc, mockRenderData);
      expect(result.html).toContain('Watch our story');
      expect(result.html).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
      expect(result.html).toContain('Get in touch');
      expect(result.html).toContain('Work Email');
    });

    it('filters courses by selectedCourseIds when specified', () => {
      const doc = getDefaultDocumentForTemplate('modern');
      const coursesSection = doc.sections.find((s) => s.type === 'courses');
      if (coursesSection && coursesSection.type === 'courses') {
        coursesSection.selectedCourseIds = ['course-2'];
      }

      const multiCourseData: LandingPageRenderData = {
        ...mockRenderData,
        courses: [
          {
            id: 'course-1',
            title: 'Course One',
            slug: 'course-1',
            isPricing: false
          },
          {
            id: 'course-2',
            title: 'Course Two',
            slug: 'course-2',
            isPricing: false
          }
        ]
      };

      const result = renderLandingPage(doc, multiCourseData);
      expect(result.html).toContain('Course Two');
      expect(result.html).not.toContain('Course One');
    });
  });
});
