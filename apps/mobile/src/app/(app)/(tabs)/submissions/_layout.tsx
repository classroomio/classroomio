import { router, Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { HeaderTextButton } from '@/feature/teach/components/header-text-button';

export const unstable_settings = { anchor: 'index' };

export default function SubmissionsLayout() {
  const { colors } = useTheme();
  const t = useTranslations(commonCatalog);

  return (
    <Stack screenOptions={tabStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: t('tabSubmissions') }} />
      <Stack.Screen
        name="[submissionId]"
        options={{
          presentation: 'modal',
          headerLargeTitleEnabled: false,
          title: t('titleSubmission'),
          headerLeft: () => <HeaderTextButton onPress={() => router.back()}>{t('close')}</HeaderTextButton>
        }}
      />
    </Stack>
  );
}
