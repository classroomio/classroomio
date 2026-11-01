import { Stack } from 'expo-router';

import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { exploreCatalog } from '@/feature/explore/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function LearnLayout() {
  const { colors } = useTheme();
  const t = useTranslations(commonCatalog);
  const explore = useTranslations(exploreCatalog);
  const cohort = useTranslations(cohortCatalog);

  return (
    <Stack screenOptions={tabStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: t('tabLearn') }} />
      <Stack.Screen name="explore/index" options={{ title: explore('screenTitle') }} />
      <Stack.Screen
        name="explore/[courseId]"
        options={{
          title: '',
          headerLargeTitleEnabled: false,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerLargeStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen name="cohorts/index" options={{ title: cohort('cohorts') }} />
      <Stack.Screen name="cohorts/[cohortId]/index" options={{ title: '', headerLargeTitleEnabled: false }} />
      <Stack.Screen name="cohorts/[cohortId]/announcements" options={{ title: cohort('announcements') }} />
      <Stack.Screen
        name="cohorts/[cohortId]/[postId]"
        options={{ title: cohort('announcement'), headerLargeTitleEnabled: false }}
      />
    </Stack>
  );
}
