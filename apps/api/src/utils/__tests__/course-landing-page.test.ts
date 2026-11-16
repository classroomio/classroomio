import { ContentType } from '@cio/utils/constants/content';
import type { CourseContentItem } from '@cio/core/services/course/utils';
import { describe, expect, it } from 'vitest';

import { toCourseLandingPage } from '../course-landing-page';

function liveClass(id: string, sectionId: string | null): CourseContentItem {
  return {
    id,
    type: ContentType.Lesson,
    title: `Lesson ${id}`,
    order: 1,
    createdAt: null,
    sectionId,
    isUnlocked: true,
    isComplete: null,
    lessonAt: '2026-01-01T10:00:00.000Z',
    callUrl: 'https://meet.example.com/private-room',
    sessionDurationMinutes: 60,
    recordingUrl: 'https://recordings.example.com/private',
    hasNoteContent: true,
    hasSlideContent: false,
    videosCount: 1,
    documentsCount: 0,
    questionCount: null,
    dueBy: null
  };
}

function buildCourse() {
  return {
    id: 'course-1',
    title: 'Course',
    isPublished: true,
    group: {
      id: 'group-1',
      members: [{ id: 'member-1', email: 'student@example.com', profile: { email: 'student@example.com' } }]
    },
    attendance: [{ id: 'attendance-1', studentId: 'member-1', isPresent: true }],
    content: {
      grouped: true,
      sections: [{ id: 'section-1', title: 'Section', order: 1, items: [liveClass('a', 'section-1')] }],
      items: [liveClass('b', null)]
    },
    org: { id: 'org-1', name: 'Org', siteName: 'org', theme: undefined }
  };
}

describe('toCourseLandingPage', () => {
  it('drops the group roster and attendance', () => {
    const landingPage = toCourseLandingPage(buildCourse());

    expect(landingPage).not.toHaveProperty('group');
    expect(landingPage).not.toHaveProperty('attendance');
    expect(JSON.stringify(landingPage)).not.toContain('student@example.com');
  });

  it('drops live-session call and recording links from every content item', () => {
    const landingPage = toCourseLandingPage(buildCourse());
    const allItems = [
      ...landingPage.content.items,
      ...landingPage.content.sections.flatMap((section) => section.items)
    ];

    expect(allItems).toHaveLength(2);
    for (const item of allItems) {
      expect(item).not.toHaveProperty('callUrl');
      expect(item).not.toHaveProperty('recordingUrl');
    }
  });

  it('keeps the fields the landing page renders', () => {
    const landingPage = toCourseLandingPage(buildCourse());

    expect(landingPage.title).toBe('Course');
    expect(landingPage.org).toEqual({ id: 'org-1', name: 'Org', siteName: 'org', theme: undefined });
    expect(landingPage.content.grouped).toBe(true);
    expect(landingPage.content.sections[0]).toMatchObject({ id: 'section-1', title: 'Section' });
    expect(landingPage.content.items[0]).toMatchObject({
      id: 'b',
      title: 'Lesson b',
      lessonAt: '2026-01-01T10:00:00.000Z'
    });
  });
});
