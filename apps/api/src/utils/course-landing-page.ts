import type { CourseContent, CourseContentItem } from '@cio/core/services/course/utils';

type LandingPageContentItem = Omit<CourseContentItem, 'callUrl' | 'recordingUrl'>;

type LandingPageSource = {
  group: unknown;
  attendance: unknown;
  content: CourseContent;
};

function toLandingPageContentItem(item: CourseContentItem): LandingPageContentItem {
  const { callUrl: _callUrl, recordingUrl: _recordingUrl, ...landingItem } = item;

  return landingItem;
}

function toLandingPageContent(content: CourseContent) {
  const sections = content.sections.map((section) => {
    const items = section.items.map(toLandingPageContentItem);

    return { ...section, items };
  });
  const items = content.items.map(toLandingPageContentItem);

  return { grouped: content.grouped, sections, items };
}

/**
 * Reduces a course to what an anonymous visitor may see on its landing page:
 * no group roster, no attendance, and no live-session call or recording links.
 */
export function toCourseLandingPage<Course extends LandingPageSource>(course: Course) {
  const { group: _group, attendance: _attendance, content, ...landingFields } = course;
  const landingContent = toLandingPageContent(content);

  return { ...landingFields, content: landingContent };
}
