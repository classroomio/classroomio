import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { HIT_SLOP } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useUnreadNotificationsQuery } from '@/feature/notifications/api/notifications';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';

/** Header button that opens the notification list, with a dot while anything is unread. */
export function NotificationBell() {
  const t = useTranslations(notificationsCatalog);
  const { colors } = useTheme();
  const unread = useUnreadNotificationsQuery();
  const count = unread.data?.unreadCount ?? 0;
  const label = count > 0 ? t('bellUnreadA11y', { count }) : t('bellA11y');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      onPress={() => {
        tapHaptic();
        router.push('/notifications');
      }}
      style={styles.button}
    >
      <Icon icon={Bell} size={22} tone="primary" strokeWidth={2} />
      {count > 0 ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.dot, { backgroundColor: colors.primary, borderColor: colors.background }]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2
  }
});
