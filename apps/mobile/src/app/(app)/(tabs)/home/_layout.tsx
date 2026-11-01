import { Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { NotificationBell } from '@/feature/notifications/components/notification-bell';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function HomeLayout() {
  const { colors } = useTheme();
  const t = useTranslations(commonCatalog);

  return (
    <Stack screenOptions={tabStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: t('tabHome'), headerRight: () => <NotificationBell /> }} />
    </Stack>
  );
}
