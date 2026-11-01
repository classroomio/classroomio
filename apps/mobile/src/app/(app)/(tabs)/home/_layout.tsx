import { Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { NotificationBell } from '@/feature/notifications/components/notification-bell';

export default function HomeLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={tabStackScreenOptions(colors)}>
      <Stack.Screen
        name="index"
        options={{ title: '', headerLargeTitleEnabled: false, headerRight: () => <NotificationBell /> }}
      />
    </Stack>
  );
}
