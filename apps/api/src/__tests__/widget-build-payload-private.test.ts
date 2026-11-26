import { describe, expect, it } from 'vitest';

import { buildWidgetPayload, type BuildWidgetPayloadCourse } from '@cio/utils/validation/widget/build-payload';

const PUBLIC_COURSE_ID = '11111111-1111-4111-8111-111111111111';
const PRIVATE_COURSE_ID = '22222222-2222-4222-8222-222222222222';

function course(id: string, overrides: Partial<BuildWidgetPayloadCourse> = {}): BuildWidgetPayloadCourse {
  return {
    id,
    slug: id,
    title: `Course ${id.slice(0, 4)}`,
    isPublished: true,
    isPrivate: false,
    price: 'Free',
    lessonCount: 1,
    exerciseCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    ...overrides
  };
}

function payloadFor(selectionMode: 'manual' | 'published', selectedCourseIds: string[]) {
  return buildWidgetPayload({
    widget: {
      id: '33333333-3333-4333-8333-333333333333',
      publicKey: 'public-key',
      layoutType: 'card_grid',
      selectionMode,
      config: {}
    } as never,
    organization: { id: '44444444-4444-4444-8444-444444444444', name: 'Org', siteName: 'org' },
    orgBaseUrl: 'https://org.example.com',
    allCourses: [course(PUBLIC_COURSE_ID), course(PRIVATE_COURSE_ID, { isPrivate: true })],
    selectedCourseIds,
    planGatedFields: {
      isPaidPlan: true,
      canUseCustomColors: true,
      canUseCustomCss: true,
      canToggleBranding: true,
      isBrandingForced: false,
      availableThemes: ['classroomio'],
      selectedTheme: 'classroomio'
    } as never
  });
}

describe('buildWidgetPayload with private courses', () => {
  it('leaves private courses out when the widget lists all published courses', () => {
    const payload = payloadFor('published', []);

    expect(payload.courses.map((entry) => entry.id)).toEqual([PUBLIC_COURSE_ID]);
  });

  it('leaves private courses out even when they were picked manually', () => {
    const payload = payloadFor('manual', [PRIVATE_COURSE_ID, PUBLIC_COURSE_ID]);

    expect(payload.courses.map((entry) => entry.id)).toEqual([PUBLIC_COURSE_ID]);
  });
});
