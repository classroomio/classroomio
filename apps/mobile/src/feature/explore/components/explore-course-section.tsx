import type { ReactNode } from 'react';

import { HtmlContent } from '@/feature/common/components/html-content';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';

export function ExploreCourseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ScreenSection>
      <ScreenSectionHeader title={title} />
      {children}
    </ScreenSection>
  );
}

export function ExploreCourseSectionHtml({ html }: { html: string }) {
  return <HtmlContent html={html} />;
}
