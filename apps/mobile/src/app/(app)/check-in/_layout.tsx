import { Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { CheckInBackButton } from '@/feature/check-in/components/check-in-back-button';
import { checkInCatalog } from '@/feature/check-in/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function CheckInLayout() {
  const { colors } = useTheme();
  const t = useTranslations(checkInCatalog);

  return (
    <Stack
      screenOptions={{
        ...tabStackScreenOptions(colors),
        headerLargeTitleEnabled: false,
        title: t('screenTitle'),
        headerLeft: () => <CheckInBackButton />
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="scan" />
    </Stack>
  );
}
