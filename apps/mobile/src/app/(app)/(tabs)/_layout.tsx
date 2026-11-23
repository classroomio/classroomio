import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useEffect, useEffectEvent } from 'react';

import { useHasAppeared } from '@/feature/common/helpers/use-has-appeared';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTabIcons } from '@/feature/common/helpers/use-tab-icons';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useSyncTimeZone } from '@/feature/goals/api/goals';
import { StaffOfflineScreen } from '@/feature/offline/components/staff-offline-screen';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { useGradingQueueCount } from '@/feature/teach/api/grading-queue';

const BADGE_CAP = 99;

export default function TabsLayout() {
  const { colors } = useTheme();
  const tabIcons = useTabIcons();
  // iOS 26 mis-lays out tab labels when item images are set before the tab bar is in the window.
  const icons = useHasAppeared() ? tabIcons : null;
  const { role, org } = useActiveOrg();
  const offline = useIsOffline();
  const t = useTranslations(commonCatalog);
  const format = useFormatters();
  const toGrade = useGradingQueueCount(role === 'tutor').data ?? 0;
  const toGradeBadge = toGrade > BADGE_CAP ? `${format.number(BADGE_CAP)}+` : format.number(toGrade);
  const student = role === 'student';
  const studentOnline = student && !offline;

  const syncTimeZone = useEffectEvent(useSyncTimeZone());
  const orgId = org?.id ?? null;

  useEffect(() => {
    if (student && offline) router.navigate('/learning');
  }, [student, offline]);

  useEffect(() => {
    if (!student || offline || !orgId) return;

    void syncTimeZone().catch(() => {});
  }, [student, offline, orgId]);

  if (!student && offline) return <StaffOfflineScreen />;

  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="home" hidden={student && offline}>
        <NativeTabs.Trigger.Icon src={icons?.['house']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabHome')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learning" hidden={!student}>
        <NativeTabs.Trigger.Icon src={icons?.['book-open']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabMyLearning')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore" hidden={!studentOnline}>
        <NativeTabs.Trigger.Icon src={icons?.['compass']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabExplore')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="goals" hidden={!studentOnline}>
        <NativeTabs.Trigger.Icon src={icons?.['target']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabGoals')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="people" hidden={role !== 'admin'}>
        <NativeTabs.Trigger.Icon src={icons?.['users-three']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabPeople')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="courses" hidden={student}>
        <NativeTabs.Trigger.Icon src={icons?.['books']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabCourses')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learners" hidden={role !== 'tutor'}>
        <NativeTabs.Trigger.Icon src={icons?.['student']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabLearners')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="submissions" hidden={role !== 'tutor'}>
        <NativeTabs.Trigger.Icon src={icons?.['tray']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabSubmissions')}</NativeTabs.Trigger.Label>
        {toGrade > 0 ? <NativeTabs.Trigger.Badge>{toGradeBadge}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile" hidden={student && offline}>
        <NativeTabs.Trigger.Icon src={icons?.['user-circle']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabProfile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
