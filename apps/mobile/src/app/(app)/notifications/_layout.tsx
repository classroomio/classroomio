import { Stack } from 'expo-router';

import { StackBackButton } from '@/feature/common/components/stack-back-button';
import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';

export default function NotificationsLayout() {
  const t = useTranslations(notificationsCatalog);
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={({ navigation, route }) => ({
        ...tabStackScreenOptions(colors),
        headerLeft: navigation.getState()?.routes[0]?.key === route.key ? () => <StackBackButton /> : undefined
      })}
    >
      <Stack.Screen name="index" options={{ title: t('title') }} />
      <Stack.Screen name="preferences" options={{ title: t('settingsTitle'), headerLargeTitleEnabled: false }} />
    </Stack>
  );
}
