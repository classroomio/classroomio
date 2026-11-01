import { EnvelopeOpenIcon } from 'phosphor-react-native/src/icons/EnvelopeOpen';
import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type AccessibilityActionEvent, type PressableProps } from 'react-native';

import { PressableScale } from '@/feature/common/components/pressable-scale';
import { SwipeActionRow } from '@/feature/common/components/swipe-action-row';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useScreenReaderEnabled } from '@/feature/common/helpers/use-screen-reader-enabled';
import { spokenDateTime, timeAgo } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { hrefForDeepLink } from '@/feature/notifications/helpers/deep-link';
import type { NotificationRowPosition } from '@/feature/notifications/helpers/notification-groups';
import {
  notificationCopy,
  notificationDisplay,
  toIsoTimestamp
} from '@/feature/notifications/helpers/notification-display';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';
import type { NotificationItem } from '@/feature/notifications/types/notifications';

import { useNotificationActions } from './notification-actions';
import { NotificationMedia } from './notification-media';

const TILE_SIZE = 42;
const BORDER_WIDTH = StyleSheet.hairlineWidth * 2;

type NotificationRowProps = { item: NotificationItem; position: NotificationRowPosition };

/**
 * One notification as a segment of a grouped card. Swipe right to mark read or unread, swipe left to delete;
 * long-press for the same actions. Must be inside `NotificationActions`.
 */
export function NotificationRow({ item, position }: NotificationRowProps) {
  const t = useTranslations(notificationsCatalog);
  const common = useTranslations(commonCatalog);
  const actions = useNotificationActions();
  const screenReader = useScreenReaderEnabled();
  const unread = !item.readAt;
  // expo-router's native context menu wrapper hides its trigger from VoiceOver.
  const nativeMenu = Platform.OS === 'ios' && !screenReader;

  return (
    <NotificationRowSegment position={position}>
      <SwipeActionRow
        resetKey={item.id}
        enabled={!actions.offline}
        leading={{
          label: unread ? t('markRead') : t('markUnread'),
          icon: unread ? EnvelopeOpenIcon : EnvelopeSimpleIcon,
          onCommit: () => actions.toggleRead(item)
        }}
        trailing={{ label: common('delete'), icon: TrashIcon, tone: 'danger', onCommit: () => actions.remove(item) }}
      >
        {nativeMenu ? (
          <NotificationRowMenu item={item} />
        ) : (
          <NotificationRowContent
            item={item}
            onLongPress={Platform.OS === 'android' ? () => actions.showMenu(item) : undefined}
          />
        )}
      </SwipeActionRow>
    </NotificationRowSegment>
  );
}

function NotificationRowMenu({ item }: { item: NotificationItem }) {
  const t = useTranslations(notificationsCatalog);
  const common = useTranslations(commonCatalog);
  const actions = useNotificationActions();
  const href = hrefForDeepLink(item.deepLink);
  const offlineNote = actions.offline ? t('unavailableOffline') : undefined;

  return (
    <Link
      href={href ?? '/notifications'}
      asChild
      onPress={(event) => {
        event.preventDefault();
        actions.open(item);
      }}
    >
      <Link.Trigger>
        <NotificationRowContent item={item} />
      </Link.Trigger>
      <Link.Menu>
        <Link.MenuAction icon="arrow.up.forward" hidden={!href} onPress={() => actions.open(item)}>
          {common('open')}
        </Link.MenuAction>
        <Link.MenuAction
          icon={item.readAt ? 'envelope.badge' : 'envelope.open'}
          disabled={actions.offline}
          subtitle={offlineNote}
          onPress={() => actions.toggleRead(item)}
        >
          {item.readAt ? t('markUnread') : t('markRead')}
        </Link.MenuAction>
        <Link.MenuAction
          icon="trash"
          destructive
          disabled={actions.offline}
          subtitle={offlineNote}
          onPress={() => actions.remove(item)}
        >
          {common('delete')}
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  );
}

type NotificationRowContentProps = {
  item: NotificationItem;
  /** Supplied by `Link.Trigger` on iOS. */
  onPress?: PressableProps['onPress'];
  onLongPress?: () => void;
};

function NotificationRowContent({ item, onPress, onLongPress }: NotificationRowContentProps) {
  const t = useTranslations(notificationsCatalog);
  const common = useTranslations(commonCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const actions = useNotificationActions();
  const display = notificationDisplay(item);
  const copy = notificationCopy(item, new Date(), locale);
  const createdAt = toIsoTimestamp(item.createdAt);
  const unread = !item.readAt;
  const readLabel = unread ? t('markRead') : t('markUnread');

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'toggleRead') actions.toggleRead(item);
    if (event.nativeEvent.actionName === 'delete') actions.remove(item);
  };

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={[unread ? t('unread') : null, copy.title, copy.body, spokenDateTime(createdAt, locale)]
        .filter(Boolean)
        .join('. ')}
      accessibilityHint={actions.offline ? t('unavailableOffline') : undefined}
      accessibilityActions={[
        { name: 'toggleRead', label: readLabel },
        { name: 'delete', label: common('delete') }
      ]}
      onAccessibilityAction={handleAccessibilityAction}
      scaleTo={0.985}
      onPress={(event) => {
        tapHaptic();
        if (onPress) onPress(event);
        else actions.open(item);
      }}
      onLongPress={onLongPress}
      style={styles.row}
    >
      {unread ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
      <NotificationMedia item={item} display={display} size={TILE_SIZE} />
      <View style={styles.content}>
        <View style={styles.titleLine}>
          <Text
            variant={unread ? 'bodyStrong' : 'body'}
            tone={unread ? 'ink' : 'body'}
            numberOfLines={2}
            style={styles.title}
          >
            {copy.title}
          </Text>
          <Text variant="caption" tone={unread ? 'primary' : 'subtle'} style={styles.time}>
            {timeAgo(createdAt, Date.now(), locale)}
          </Text>
        </View>
        {copy.body ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {copy.body}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

/** One slice of a rounded, bordered card, so list rows can form a card without a shared container. */
export function NotificationRowSegment({
  position,
  children
}: {
  position: NotificationRowPosition;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const first = position === 'first' || position === 'only';
  const last = position === 'last' || position === 'only';

  return (
    <View style={[styles.segment, { backgroundColor: colors.surface }, first && styles.first, last && styles.last]}>
      {children}
      {!first ? <View style={[styles.separator, { backgroundColor: colors.border }]} /> : null}
      <View
        pointerEvents="none"
        style={[
          styles.frame,
          { borderColor: colors.border },
          !first && styles.frameOpenTop,
          !last && styles.frameOpenBottom
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { overflow: 'hidden', borderCurve: 'continuous' },
  first: { borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl },
  last: { borderBottomLeftRadius: RADII.xl, borderBottomRightRadius: RADII.xl },
  frame: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: BORDER_WIDTH,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  frameOpenTop: { top: -RADII.xl * 2 },
  frameOpenBottom: { bottom: -RADII.xl * 2 },
  separator: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: SPACING.md + TILE_SIZE + SPACING.sm,
    height: BORDER_WIDTH
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2
  },
  dot: {
    position: 'absolute',
    left: (SPACING.md - 8) / 2,
    top: SPACING.sm + 2 + TILE_SIZE / 2 - 4,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  content: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs },
  title: { flex: 1 },
  time: { marginTop: 3 }
});
