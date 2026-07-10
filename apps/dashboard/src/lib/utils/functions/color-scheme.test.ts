import { describe, expect, it } from 'vitest';
import { isPublicOrgSitePage } from './color-scheme';

describe('isPublicOrgSitePage', () => {
  it('returns false for non-org-site routes', () => {
    expect(isPublicOrgSitePage(false, '/lms')).toBe(false);
    expect(isPublicOrgSitePage(false, '/courses/abc')).toBe(false);
  });

  it('returns true for public org-site pages', () => {
    expect(isPublicOrgSitePage(true, '/')).toBe(true);
    expect(isPublicOrgSitePage(true, '/courses')).toBe(true);
    expect(isPublicOrgSitePage(true, '/courses/')).toBe(true);
    expect(isPublicOrgSitePage(true, '/course/my-course')).toBe(true);
    expect(isPublicOrgSitePage(true, '/course/my-course/enroll')).toBe(true);
  });

  it('returns false for authenticated org-site app routes', () => {
    expect(isPublicOrgSitePage(true, '/lms')).toBe(false);
    expect(isPublicOrgSitePage(true, '/lms/settings')).toBe(false);
    expect(isPublicOrgSitePage(true, '/courses/abc')).toBe(false);
    expect(isPublicOrgSitePage(true, '/courses/abc/newsfeed')).toBe(false);
    expect(isPublicOrgSitePage(true, '/course/my-course/lesson/intro')).toBe(false);
  });
});
