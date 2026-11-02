import { View } from 'react-native';

import { positionOf } from '@/feature/notifications/helpers/notification-groups';
import type { NotificationItem } from '@/feature/notifications/types/notifications';

import { NotificationActions } from './notification-actions';
import { NotificationRow } from './notification-row';

/** The learner's latest notifications as one card, with the same swipe and long-press actions as the full list. */
export function RecentUpdates({ items }: { items: NotificationItem[] }) {
  return (
    <NotificationActions>
      <View>
        {items.map((item, index) => (
          <NotificationRow key={item.id} item={item} position={positionOf(index, items.length)} />
        ))}
      </View>
    </NotificationActions>
  );
}
