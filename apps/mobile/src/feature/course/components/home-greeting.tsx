import { StyleSheet, View } from 'react-native';

import { useAccountQuery } from '@/feature/account/api/account';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { relativeDays } from '@/feature/course/helpers/compliance-deadline';
import { dayPartOf, firstNameOf, type HomeStatus } from '@/feature/course/helpers/home-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { en } from '@/feature/course/translations/en';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const GREETING_KEYS = {
  morning: { named: 'greetingMorning', plain: 'greetingMorningNoName' },
  afternoon: { named: 'greetingAfternoon', plain: 'greetingAfternoonNoName' },
  evening: { named: 'greetingEvening', plain: 'greetingEveningNoName' }
} as const;

function statusText(status: HomeStatus, t: Translator<typeof en>) {
  switch (status.kind) {
    case 'overdue':
      return t('homeStatusOverdue', { count: status.count });
    case 'due':
      return t('homeStatusDue', { title: status.title, relative: relativeDays(status.days, t) });
    case 'in-progress':
      return t('homeStatusInProgress', { count: status.count });
    case 'not-started':
      return t('homeStatusNotStarted', { count: status.count });
    case 'all-done':
      return t('homeStatusAllDone');
  }
}

export function HomeGreeting({ status }: { status: HomeStatus | null }) {
  const t = useTranslations(courseCatalog);
  const account = useAccountQuery();
  const name = firstNameOf(account.data?.profile.fullname);
  const keys = GREETING_KEYS[dayPartOf()];

  return (
    <View style={styles.greeting}>
      <Text variant="display" accessibilityRole="header" numberOfLines={2}>
        {name ? t(keys.named, { name }) : t(keys.plain)}
      </Text>
      {status ? (
        <Text variant="body" tone="muted" numberOfLines={2}>
          {statusText(status, t)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: SPACING.xxs }
});
