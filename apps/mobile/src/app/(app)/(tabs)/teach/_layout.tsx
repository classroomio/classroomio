import { router, Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { HeaderTextButton } from '@/feature/teach/components/header-text-button';
import { NotificationBell } from '@/feature/notifications/components/notification-bell';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { teachCatalog } from '@/feature/teach/translations/catalog';

export const unstable_settings = { anchor: 'index' };

export default function TeachLayout() {
  const { colors } = useTheme();
  const t = useTranslations(commonCatalog);
  const teach = useTranslations(teachCatalog);
  const modal = {
    presentation: 'modal',
    headerLargeTitleEnabled: false,
    headerLeft: () => <HeaderTextButton onPress={() => router.back()}>{t('close')}</HeaderTextButton>
  } as const;

  return (
    <Stack screenOptions={tabStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: t('tabTeach'), headerRight: () => <NotificationBell /> }} />
      <Stack.Screen name="queue" options={{ title: t('titleToGrade') }} />
      <Stack.Screen name="submission/[submissionId]" options={{ ...modal, title: t('titleSubmission') }} />
      <Stack.Screen
        name="course/[courseId]/index"
        options={{ title: t('titleCourse'), headerLargeTitleEnabled: false }}
      />
      <Stack.Screen name="course/[courseId]/attendance" options={{ ...modal, title: t('titleAttendance') }} />
      <Stack.Screen name="course/[courseId]/check-in" options={{ ...modal, title: teach('titleCheckIn') }} />
      <Stack.Screen name="course/[courseId]/announce" options={{ ...modal, title: t('titleAnnouncement') }} />
      <Stack.Screen
        name="course/[courseId]/post/[feedId]"
        options={{ title: t('titleComments'), headerLargeTitleEnabled: false }}
      />
    </Stack>
  );
}
