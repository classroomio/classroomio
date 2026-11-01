import { View } from 'react-native';

import { useMarkNotificationRead } from '@/feature/notifications/api/notifications';
import { openNotificationTarget } from '@/feature/notifications/helpers/open-notification';
import type { NotificationItem } from '@/feature/notifications/types/notifications';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';

import { NotificationRow } from './notification-row';

function positionOf(index: number, count: number) {
  if (count === 1) return 'only';
  if (index === 0) return 'first';

  return index === count - 1 ? 'last' : 'middle';
}

/** The learner's latest notifications as one card: grades, announcements, new courses and replies. */
export function RecentUpdates({ items }: { items: NotificationItem[] }) {
  const markRead = useMarkNotificationRead();
  const { organizations } = useActiveOrg();

  const open = (item: NotificationItem) => {
    if (!item.readAt) markRead.mutate(item.id);
    openNotificationTarget({ deepLink: item.deepLink, memberOrgIds: organizations.map((org) => org.id) });
  };

  return (
    <View>
      {items.map((item, index) => (
        <NotificationRow
          key={item.id}
          item={item}
          position={positionOf(index, items.length)}
          onPress={open}
          onMarkRead={(target) => markRead.mutate(target.id)}
        />
      ))}
    </View>
  );
}
