import { describe, expect, it } from 'vitest';

import { buildHighlightPath, buildRoutePath } from './route-path';
import { NAVIGATION_SOURCE, NAVIGATION_SOURCE_PARAM, ROUTE_NAME, ROUTE_SECTIONS } from './routes';

describe('buildRoutePath', () => {
  it('fills path params and moves other values into the query', () => {
    const path = buildRoutePath(ROUTE_NAME.COURSE_CERTIFICATE, { id: 'course-1', tab: 'settings' });

    expect(path).toBe('/courses/course-1/certificates?tab=settings');
  });

  it('skips empty values and leaves no trailing question mark', () => {
    expect(buildRoutePath(ROUTE_NAME.COURSE_SETTINGS, { id: 'course-1', tab: undefined })).toBe(
      '/courses/course-1/settings'
    );
  });

  it('encodes path params', () => {
    expect(buildRoutePath(ROUTE_NAME.COURSE_SETTINGS, { id: 'a/b' })).toBe('/courses/a%2Fb/settings');
  });
});

describe('buildHighlightPath', () => {
  it('adds the highlight section after the other query params', () => {
    const path = buildHighlightPath(
      ROUTE_NAME.COURSE_SETTINGS,
      ROUTE_SECTIONS[ROUTE_NAME.COURSE_SETTINGS].COMPLETION_RULES,
      { id: 'course-1', [NAVIGATION_SOURCE_PARAM]: NAVIGATION_SOURCE.CERTIFICATE_SETTINGS }
    );

    expect(path).toBe('/courses/course-1/settings?from=certificate-settings&highlight=completion-rules');
  });
});
