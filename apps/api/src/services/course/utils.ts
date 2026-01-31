import { ContentType } from '@cio/utils/constants';
import type { CourseContentItemRow } from '@cio/db/queries/course';

export type CourseContentItem = {
  id: string;
  type: ContentType;
  title: string;
  order: number | null;
  createdAt: string | null;
  sectionId: string | null;
  isUnlocked: boolean | null;
  isComplete: boolean | null;
};

export type CourseContentSection = {
  id: string;
  title: string;
  order: number | null;
  items: CourseContentItem[];
};

export type CourseContent = {
  grouped: boolean;
  sections: CourseContentSection[];
  items: CourseContentItem[];
};

const CONTENT_TYPE_PRIORITY: Record<ContentType, number> = {
  [ContentType.Section]: -1,
  [ContentType.Lesson]: 0,
  [ContentType.Exercise]: 1
};

function sortContentItems(items: CourseContentItem[]): CourseContentItem[] {
  console.log('items', items);
  return [...items].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    console.log('orderDiff', orderDiff);
    if (orderDiff !== 0) return orderDiff;

    const typeDiff = CONTENT_TYPE_PRIORITY[a.type] - CONTENT_TYPE_PRIORITY[b.type];
    console.log('typeDiff', typeDiff);
    if (typeDiff !== 0) return typeDiff;

    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
}

function sortContentSections(sections: CourseContentSection[]): CourseContentSection[] {
  return [...sections].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;

    return a.title.localeCompare(b.title);
  });
}

function mapCourseContentItems(rows: CourseContentItemRow[]): CourseContentItem[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type as ContentType,
    title: row.title ?? '',
    order: row.order ?? null,
    createdAt: row.createdAt ?? null,
    sectionId: row.sectionId ?? null,
    isUnlocked: row.isUnlocked ?? null,
    isComplete: row.isComplete ?? null
  }));
}

export function buildCourseContent(rows: CourseContentItemRow[], isContentGroupingEnabled: boolean): CourseContent {
  const items = mapCourseContentItems(rows);
  const contentItems = items.filter((item) => item.type !== ContentType.Section);

  if (!isContentGroupingEnabled) {
    return {
      grouped: false,
      sections: [],
      items: sortContentItems(contentItems)
    };
  }

  const sectionItems = items.filter((item) => item.type === ContentType.Section);
  const sectionMap = new Map<string, CourseContentItem[]>();
  const ungroupedItems: CourseContentItem[] = [];

  for (const item of contentItems) {
    if (!item.sectionId) {
      ungroupedItems.push(item);
      continue;
    }

    if (!sectionMap.has(item.sectionId)) {
      sectionMap.set(item.sectionId, []);
    }

    sectionMap.get(item.sectionId)!.push(item);
  }

  const sections = sortContentSections(
    sectionItems.map((section) => ({
      id: section.id,
      title: section.title || 'Untitled section',
      order: section.order ?? null,
      items: sortContentItems(sectionMap.get(section.id) ?? [])
    }))
  );

  if (ungroupedItems.length > 0) {
    sections.push({
      id: 'ungrouped',
      title: 'Ungrouped',
      order: sections.length + 1,
      items: sortContentItems(ungroupedItems)
    });
  }

  return {
    grouped: true,
    sections,
    items: []
  };
}

export function calcPercentageWithRounding(a: number, b: number): number {
  if (b === 0) return 0;
  return Math.round((a / b) * 100);
}

export function formatLastSeen(lastLoginDate: string | null | undefined): string {
  if (!lastLoginDate) return 'Never';

  const lastLogin = new Date(lastLoginDate);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'Just now';
  }
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}
