import { router, Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { HeaderTextButton } from '@/feature/teach/components/header-text-button';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import { teachCatalog } from '@/feature/teach/translations/catalog';

export const unstable_settings = { anchor: 'index' };

export default function CoursesLayout() {
  const { colors } = useTheme();
  const t = useTranslations(commonCatalog);
  const teach = useTranslations(teachCatalog);
  const staff = useTranslations(staffCatalog);
  const modal = {
    presentation: 'modal',
    headerLargeTitleEnabled: false,
    headerLeft: () => <HeaderTextButton onPress={() => router.back()}>{t('close')}</HeaderTextButton>
  } as const;

  return (
    <Stack screenOptions={tabStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ title: t('tabCourses') }} />
      <Stack.Screen name="[courseId]/index" options={{ title: t('titleCourse'), headerLargeTitleEnabled: false }} />
      <Stack.Screen
        name="[courseId]/people"
        options={{ title: staff('coursePeople'), headerLargeTitleEnabled: false }}
      />
      <Stack.Screen name="[courseId]/invite" options={{ ...modal, title: staff('inviteTitle') }} />
      <Stack.Screen name="[courseId]/settings" options={{ ...modal, title: staff('courseSettings') }} />
      <Stack.Screen name="[courseId]/attendance" options={{ ...modal, title: t('titleAttendance') }} />
      <Stack.Screen name="[courseId]/check-in" options={{ ...modal, title: teach('titleCheckIn') }} />
      <Stack.Screen name="[courseId]/announce" options={{ ...modal, title: t('titleAnnouncement') }} />
      <Stack.Screen
        name="[courseId]/post/[feedId]"
        options={{ title: t('titleComments'), headerLargeTitleEnabled: false }}
      />
    </Stack>
  );
}
