import { Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export default function ProfileLayout() {
  const { colors } = useTheme();
  const t = useTranslations(commonCatalog);
  const ts = useTranslations(settingsCatalog);

  return (
    <Stack screenOptions={tabStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: t('tabProfile') }} />
      <Stack.Screen name="settings" options={{ title: t('settings'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="language" options={{ title: ts('language'), headerLargeTitleEnabled: false }} />
      <Stack.Screen
        name="edit-name"
        options={{
          headerShown: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 0.9],
          sheetGrabberVisible: true,
          sheetCornerRadius: 18
        }}
      />
    </Stack>
  );
}
