import { resolveCourseNavHref } from './utils';

describe('resolveCourseNavHref', () => {
  it('routes a fragment-only nav href back to the org home page', () => {
    expect(resolveCourseNavHref('#about-us')).toBe('/#about-us');
  });

  it('leaves an already-rooted path untouched', () => {
    expect(resolveCourseNavHref('/pricing')).toBe('/pricing');
  });

  it('leaves an external URL untouched', () => {
    expect(resolveCourseNavHref('https://example.com')).toBe('https://example.com');
  });
});
