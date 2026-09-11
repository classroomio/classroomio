import type { NotificationItem } from './types';

export function sortNewestFirst(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function filterByUnread(items: NotificationItem[], onlyUnread: boolean): NotificationItem[] {
  if (!onlyUnread) return items;

  return items.filter((item) => item.unread);
}
