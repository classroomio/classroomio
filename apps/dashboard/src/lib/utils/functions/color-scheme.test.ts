import { describe, expect, it } from 'vitest';
import { isPublicOrgSitePage } from './color-scheme';

describe('isPublicOrgSitePage', () => {
  it('returns false for dashboard routes', () => {
    expect(isPublicOrgSitePage(false, '/lms')).toBe(false);
    expect(isPublicOrgSitePage(false, '/courses/abc')).toBe(false);
  });

  it('returns true for public org-site pages', () => {
    expect(isPublicOrgSitePage(true, '/')).toBe(true);
    expect(isPublicOrgSitePage(true, '/courses')).toBe(true);
    expect(isPublicOrgSitePage(true, '/course/my-course')).toBe(true);
    expect(isPublicOrgSitePage(true, '/course/my-course/enroll')).toBe(true);
  });

  it('returns false for org-site lesson player routes', () => {
    expect(isPublicOrgSitePage(true, '/course/my-course/lesson/intro')).toBe(false);
  });
});
