import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import type { NotificationItem } from '@/feature/notifications/types/notifications';

export type NotificationRowPosition = 'only' | 'first' | 'middle' | 'last';

export type NotificationSection = 'today' | 'earlier';

export type NotificationListEntry =
  | { kind: 'header'; key: string; section: NotificationSection; first: boolean }
  | { kind: 'row'; key: string; item: NotificationItem; position: NotificationRowPosition };

/** Where row `index` of `count` sits in its grouped card. */
export function positionOf(index: number, count: number): NotificationRowPosition {
  if (count === 1) return 'only';
  if (index === 0) return 'first';

  return index === count - 1 ? 'last' : 'middle';
}

function startOfToday(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/** Flattens notifications into Today and Earlier sections for a single list, newest first. */
export function groupNotifications(items: NotificationItem[], now = new Date()): NotificationListEntry[] {
  const todayStart = startOfToday(now);
  const today = items.filter((item) => parseTimestamp(item.createdAt) >= todayStart);
  const earlier = items.filter((item) => parseTimestamp(item.createdAt) < todayStart);
  const sections = [
    { section: 'today' as const, items: today },
    { section: 'earlier' as const, items: earlier }
  ].filter((section) => section.items.length > 0);

  return sections.flatMap((section, sectionIndex) => [
    { kind: 'header' as const, key: `header-${section.section}`, section: section.section, first: sectionIndex === 0 },
    ...section.items.map((item, index) => ({
      kind: 'row' as const,
      key: item.id,
      item,
      position: positionOf(index, section.items.length)
    }))
  ]);
}
