import { NativeTabs } from 'expo-router/native-tabs';

import { useHasAppeared } from '@/feature/common/helpers/use-has-appeared';
import { useTabIcons } from '@/feature/common/helpers/use-tab-icons';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useGradingQueueCount } from '@/feature/teach/api/grading-queue';

const BADGE_CAP = 99;

export default function TabsLayout() {
  const { colors } = useTheme();
  const tabIcons = useTabIcons();
  // iOS 26 mis-lays out tab labels when item images are set before the tab bar is in the window.
  const icons = useHasAppeared() ? tabIcons : null;
  const { isStaff } = useActiveOrg();
  const t = useTranslations(commonCatalog);
  const format = useFormatters();
  const toGrade = useGradingQueueCount(isStaff).data ?? 0;
  const toGradeBadge = toGrade > BADGE_CAP ? `${format.number(BADGE_CAP)}+` : format.number(toGrade);

  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon src={icons?.['house']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabHome')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learn">
        <NativeTabs.Trigger.Icon src={icons?.['book-open']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabLearn')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="compliance" hidden={isStaff}>
        <NativeTabs.Trigger.Icon src={icons?.['shield-check']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabCompliance')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="teach" hidden={!isStaff}>
        <NativeTabs.Trigger.Icon src={icons?.['chalkboard-teacher']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabTeach')}</NativeTabs.Trigger.Label>
        {toGrade > 0 ? <NativeTabs.Trigger.Badge>{toGradeBadge}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="community">
        <NativeTabs.Trigger.Icon src={icons?.['chats-circle']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabCommunity')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon src={icons?.['user-circle']} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabProfile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
