import { renderNotificationCopy } from '@cio/utils/functions/notification-copy';
import { MailOpen } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { SwipeActionRow } from '@/feature/common/components/swipe-action-row';
import { Text, type TextTone } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { spokenDateTime, timeAgo } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { NOTIFICATION_CATEGORY_DISPLAY } from '@/feature/notifications/constants/notifications';
import type { NotificationRowPosition } from '@/feature/notifications/helpers/notification-groups';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';
import type { NotificationCategory, NotificationItem } from '@/feature/notifications/types/notifications';

const ICON_TONE: Partial<Record<NotificationCategory, TextTone>> = {
  overdue: 'danger',
  deadline_reminder: 'warning',
  renewal_due: 'warning'
};

type NotificationRowProps = {
  item: NotificationItem;
  position: NotificationRowPosition;
  onPress: (item: NotificationItem) => void;
  /** Absent when marking read isn't possible, for example offline. */
  onMarkRead?: (item: NotificationItem) => void;
};

export function NotificationRow({ item, position, onPress, onMarkRead }: NotificationRowProps) {
  const t = useTranslations(notificationsCatalog);
  const locale = useLocale();
  const { colors, elevation } = useTheme();
  const display = NOTIFICATION_CATEGORY_DISPLAY[item.category];
  const copy = renderNotificationCopy(item, new Date(), locale);
  const unread = !item.readAt;
  const first = position === 'first' || position === 'only';
  const last = position === 'last' || position === 'only';
  const canMarkRead = unread && onMarkRead !== undefined;

  return (
    <View
      style={[
        styles.surface,
        { backgroundColor: colors.surface, borderColor: colors.border },
        first && styles.first,
        last && [styles.last, elevation.raised]
      ]}
    >
      {!first ? <View style={[styles.separator, { backgroundColor: colors.border }]} /> : null}
      <SwipeActionRow
        resetKey={item.id}
        enabled={canMarkRead}
        trailing={canMarkRead ? { label: t('markRead'), icon: MailOpen, onCommit: () => onMarkRead(item) } : undefined}
      >
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={[
            unread ? t('unread') : null,
            copy.title,
            copy.body,
            spokenDateTime(item.createdAt, locale)
          ]
            .filter(Boolean)
            .join('. ')}
          accessibilityActions={canMarkRead ? [{ name: 'markRead', label: t('markRead') }] : undefined}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'markRead') onMarkRead?.(item);
          }}
          scaleTo={0.985}
          onPress={() => {
            tapHaptic();
            onPress(item);
          }}
          style={styles.row}
        >
          <View style={[styles.tile, { backgroundColor: colors.sand }]}>
            <Icon icon={display.icon} size={19} tone={ICON_TONE[item.category] ?? 'ink'} />
          </View>
          <View style={styles.content}>
            <Text variant={unread ? 'bodyStrong' : 'body'} numberOfLines={2}>
              {copy.title}
            </Text>
            {copy.body ? (
              <Text variant="caption" tone="muted" numberOfLines={2}>
                {copy.body}
              </Text>
            ) : null}
            <Text variant="micro" tone="subtle" style={styles.time}>
              {timeAgo(item.createdAt, Date.now(), locale)}
            </Text>
          </View>
          <View style={styles.marker}>
            {unread ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
          </View>
        </PressableScale>
      </SwipeActionRow>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  first: {
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl
  },
  last: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomLeftRadius: RADII.xl,
    borderBottomRightRadius: RADII.xl
  },
  separator: { height: StyleSheet.hairlineWidth * 2, marginLeft: SPACING.md + 40 + SPACING.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2
  },
  tile: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  },
  content: { flex: 1, gap: 2 },
  time: { marginTop: 2 },
  marker: { width: 10, paddingTop: 8, alignItems: 'flex-end' },
  dot: { width: 8, height: 8, borderRadius: 4 }
});
