import { Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { NotificationBell } from '@/feature/notifications/components/notification-bell';
import { staffCatalog } from '@/feature/staff/translations/catalog';

export const unstable_settings = { anchor: 'index' };

export default function HomeLayout() {
  const { colors } = useTheme();
  const t = useTranslations(staffCatalog);

  return (
    <Stack screenOptions={tabStackScreenOptions(colors)}>
      <Stack.Screen
        name="index"
        options={{ title: '', headerLargeTitleEnabled: false, headerRight: () => <NotificationBell /> }}
      />
      <Stack.Screen name="activity" options={{ title: t('recentActivity'), headerLargeTitleEnabled: false }} />
    </Stack>
  );
}
