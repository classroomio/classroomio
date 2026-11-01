import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { ApiError, request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, snapshotQueryOptions, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { NOTIFICATIONS_PAGE_SIZE } from '@/feature/notifications/constants/notifications';
import {
  cancelPendingDelete,
  schedulePendingDelete,
  usePendingDeletes,
  type PendingDelete
} from '@/feature/notifications/helpers/pending-deletes';
import type { NotificationItem, NotificationPage } from '@/feature/notifications/types/notifications';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import type { ToastAction } from '@/feature/toast/types/toast';

type NotificationPages = InfiniteData<NotificationPage, string | undefined>;

type UnreadSummary = { unreadCount: number };

export const notificationsQueryKey = (userId: string | null, orgId: string | null) =>
  ['notifications', userId, orgId] as const;

export function useNotificationKeys() {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const all = notificationsQueryKey(userId, orgId);

  return {
    all,
    list: [...all, 'list'] as const,
    summary: [...all, 'summary'] as const,
    enabled: Boolean(userId && orgId)
  };
}

function pendingUnreadCount(pending: ReadonlyMap<string, PendingDelete>) {
  let count = 0;
  for (const entry of pending.values()) if (entry.unread) count += 1;

  return count;
}

function withoutPending(pages: NotificationPages, pending: ReadonlyMap<string, PendingDelete>): NotificationPages {
  if (pending.size === 0) return pages;

  const hiddenUnread = pendingUnreadCount(pending);

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      unreadCount: Math.max(0, page.unreadCount - hiddenUnread),
      items: page.items.filter((item) => !pending.has(item.id))
    }))
  };
}

/** The notification list, without notifications waiting to be deleted. */
export function useNotificationsQuery() {
  const api = useApi();
  const keys = useNotificationKeys();
  const pending = usePendingDeletes();

  return useInfiniteQuery({
    queryKey: keys.list,
    queryFn: async ({ pageParam }) => {
      const response = await request(
        api.account.notifications.$get({
          query: { limit: String(NOTIFICATIONS_PAGE_SIZE), ...(pageParam ? { cursor: pageParam } : {}) }
        })
      );
      if (!pageParam) writeQuerySnapshot(keys.list, response.data);

      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: () => {
      const firstPage = readQuerySnapshot<NotificationPage>(keys.list);

      return firstPage ? { pages: [firstPage], pageParams: [undefined] } : undefined;
    },
    initialDataUpdatedAt: 0,
    select: (pages) => withoutPending(pages, pending),
    enabled: keys.enabled
  });
}

/** Unread count for the bell and the app icon badge, from a one-item page. */
export function useUnreadNotificationsQuery() {
  const api = useApi();
  const keys = useNotificationKeys();
  const pending = usePendingDeletes();
  const hiddenUnread = pendingUnreadCount(pending);

  return useQuery({
    ...snapshotQueryOptions<UnreadSummary>(keys.summary, async () => {
      const response = await request(api.account.notifications.$get({ query: { limit: '1' } }));

      return { unreadCount: response.data.unreadCount };
    }),
    select: (summary) => ({ unreadCount: Math.max(0, summary.unreadCount - hiddenUnread) }),
    enabled: keys.enabled
  });
}

type ReadChange = { notificationId: string | null; readAt: string | null };

function applyReadChange(pages: NotificationPages | undefined, change: ReadChange, unreadCount: number) {
  if (!pages) return pages;

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      unreadCount,
      items: page.items.map((item) => {
        const targeted = change.notificationId === null || item.id === change.notificationId;
        if (!targeted || Boolean(item.readAt) === Boolean(change.readAt)) return item;

        return { ...item, readAt: change.readAt };
      })
    }))
  };
}

function removeItem(pages: NotificationPages | undefined, notificationId: string, unreadCount: number) {
  if (!pages) return pages;

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      unreadCount,
      items: page.items.filter((item) => item.id !== notificationId)
    }))
  };
}

/** Reads and writes the raw list and summary caches, which still contain notifications waiting to be deleted. */
function useNotificationCache() {
  const queryClient = useQueryClient();
  const keys = useNotificationKeys();

  const write = (update: (pages: NotificationPages | undefined) => NotificationPages | undefined, unread: number) => {
    const pages = queryClient.setQueryData<NotificationPages>(keys.list, update);
    queryClient.setQueryData<UnreadSummary>(keys.summary, { unreadCount: unread });
    writeQuerySnapshot(keys.summary, { unreadCount: unread });
    if (pages?.pages[0]) writeQuerySnapshot(keys.list, pages.pages[0]);
  };

  const currentUnread = () => queryClient.getQueryData<UnreadSummary>(keys.summary)?.unreadCount ?? 0;

  const snapshot = () => ({
    list: queryClient.getQueryData<NotificationPages>(keys.list),
    summary: queryClient.getQueryData<UnreadSummary>(keys.summary)
  });

  const restore = (previous: ReturnType<typeof snapshot>) => {
    queryClient.setQueryData(keys.list, previous.list);
    queryClient.setQueryData(keys.summary, previous.summary);
  };

  return {
    setRead: (change: ReadChange, unreadCount: number) =>
      write((pages) => applyReadChange(pages, change, unreadCount), unreadCount),
    remove: (notificationId: string, unreadCount: number) =>
      write((pages) => removeItem(pages, notificationId, unreadCount), unreadCount),
    currentUnread,
    snapshot,
    restore
  };
}

export function useMarkNotificationRead() {
  const api = useApi();
  const cache = useNotificationCache();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await request(
        api.account.notifications[':notificationId'].read.$post({ param: { notificationId } })
      );

      return response.data;
    },
    onMutate: (notificationId) => {
      const previous = cache.snapshot();
      const readAt = new Date().toISOString();
      cache.setRead({ notificationId, readAt }, Math.max(0, cache.currentUnread() - 1));

      return previous;
    },
    onSuccess: (data) => cache.setRead({ notificationId: data.id, readAt: data.readAt }, data.unreadCount),
    onError: (_error, _notificationId, previous) => {
      if (previous) cache.restore(previous);
    }
  });
}

export function useMarkNotificationUnread() {
  const api = useApi();
  const cache = useNotificationCache();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await request(
        api.account.notifications[':notificationId'].unread.$post({ param: { notificationId } })
      );

      return response.data;
    },
    onMutate: (notificationId) => {
      const previous = cache.snapshot();
      cache.setRead({ notificationId, readAt: null }, cache.currentUnread() + 1);

      return previous;
    },
    onSuccess: (data) => cache.setRead({ notificationId: data.id, readAt: null }, data.unreadCount),
    onError: (_error, _notificationId, previous) => {
      if (previous) cache.restore(previous);
    }
  });
}

export function useMarkAllNotificationsRead() {
  const api = useApi();
  const cache = useNotificationCache();

  return useMutation({
    mutationFn: async () => {
      const response = await request(api.account.notifications['read-all'].$post());

      return response.data;
    },
    onMutate: () => {
      const previous = cache.snapshot();
      cache.setRead({ notificationId: null, readAt: new Date().toISOString() }, 0);

      return previous;
    },
    onError: (_error, _variables, previous) => {
      if (previous) cache.restore(previous);
    }
  });
}

type DeleteOptions = {
  /** The toast action that undoes this delete; the delete is sent once that toast is gone. */
  undo: ToastAction;
  onError: (error: unknown) => void;
};

/**
 * Hides a notification at once and deletes it on the server when its Undo toast goes away. `undo` in the result
 * restores it if the delete has not been sent yet.
 */
export function useDeleteNotification() {
  const api = useApi();
  const cache = useNotificationCache();

  const send = async (notificationId: string) => {
    const response = await request(api.account.notifications[':notificationId'].$delete({ param: { notificationId } }));
    cache.remove(notificationId, response.data.unreadCount);
  };

  return {
    remove: (item: NotificationItem, options: DeleteOptions) =>
      schedulePendingDelete({
        id: item.id,
        unread: !item.readAt,
        undo: options.undo,
        send: () =>
          send(item.id).catch((error: unknown) => {
            if (error instanceof ApiError && error.status === 404) {
              cache.remove(item.id, Math.max(0, cache.currentUnread() - (item.readAt ? 0 : 1)));

              return;
            }

            options.onError(error);
          })
      }),
    undo: cancelPendingDelete
  };
}

export function useRefreshNotifications() {
  const queryClient = useQueryClient();
  const keys = useNotificationKeys();

  return () => queryClient.invalidateQueries({ queryKey: keys.all });
}
