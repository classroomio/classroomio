import { Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function CommunityLayout() {
  const { colors } = useTheme();
  const t = useTranslations(commonCatalog);

  return (
    <Stack screenOptions={tabStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: t('tabCommunity') }} />
      <Stack.Screen name="[slug]" options={{ title: t('titleQuestion'), headerLargeTitleEnabled: false }} />
      <Stack.Screen
        name="ask"
        options={{ title: t('titleAskQuestion'), presentation: 'modal', headerLargeTitleEnabled: false }}
      />
      <Stack.Screen
        name="edit/[slug]"
        options={{ title: t('titleEditQuestion'), presentation: 'modal', headerLargeTitleEnabled: false }}
      />
    </Stack>
  );
}
