import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/feature/common/helpers/use-theme';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useGradingQueueCount } from '@/feature/teach/api/grading-queue';

const BADGE_CAP = 99;

export default function TabsLayout() {
  const { colors } = useTheme();
  const { isStaff } = useActiveOrg();
  const t = useTranslations(commonCatalog);
  const format = useFormatters();
  const toGrade = useGradingQueueCount(isStaff).data ?? 0;
  const toGradeBadge = toGrade > BADGE_CAP ? `${format.number(BADGE_CAP)}+` : format.number(toGrade);

  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>{t('tabHome')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learn">
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} md="menu_book" />
        <NativeTabs.Trigger.Label>{t('tabLearn')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="compliance" hidden={isStaff}>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'checkmark.shield', selected: 'checkmark.shield.fill' }}
          md="verified_user"
        />
        <NativeTabs.Trigger.Label>{t('tabCompliance')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="teach" hidden={!isStaff}>
        <NativeTabs.Trigger.Icon sf={{ default: 'graduationcap', selected: 'graduationcap.fill' }} md="school" />
        <NativeTabs.Trigger.Label>{t('tabTeach')}</NativeTabs.Trigger.Label>
        {toGrade > 0 ? <NativeTabs.Trigger.Badge>{toGradeBadge}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="community">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          md="forum"
        />
        <NativeTabs.Trigger.Label>{t('tabCommunity')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
        <NativeTabs.Trigger.Label>{t('tabProfile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
