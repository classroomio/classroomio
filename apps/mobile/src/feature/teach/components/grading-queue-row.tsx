import { ClipboardCheck, Clock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/feature/common/components/avatar';
import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { SwipeActionRow } from '@/feature/common/components/swipe-action-row';
import { Text } from '@/feature/common/components/text';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { answerKindsLabel } from '@/feature/teach/helpers/answer-kinds';
import { daysSince, elapsedCopy, WAITING_KEYS } from '@/feature/teach/helpers/relative-time';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { GradingQueueItem } from '@/feature/teach/types/teach';

const LONG_WAIT_DAYS = 3;

type GradingQueueRowProps = { item: GradingQueueItem; onPress: (item: GradingQueueItem) => void };

export function GradingQueueRow({ item, onPress }: GradingQueueRowProps) {
  const t = useTranslations(teachCatalog);
  const locale = useLocale();
  const learner = item.student?.fullname || t('formerLearner');
  const waiting = elapsedCopy(t, WAITING_KEYS, item.submittedAt);
  const longWait = daysSince(item.submittedAt) >= LONG_WAIT_DAYS;
  const kinds = answerKindsLabel(item.answerTypes, t, locale);

  return (
    <SwipeActionRow
      resetKey={item.id}
      trailing={{ label: t('gradeAction'), icon: ClipboardCheck, onCommit: () => onPress(item) }}
    >
      <Item
        onPress={() => onPress(item)}
        accessibilityLabel={[learner, item.exerciseTitle, item.courseTitle, waiting, item.isLate && t('submittedLate')]
          .filter(Boolean)
          .join(', ')}
      >
        <ItemMedia>
          <Avatar name={learner} uri={item.student?.avatarUrl} size={40} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle numberOfLines={1}>{learner}</ItemTitle>
          <ItemDescription numberOfLines={1}>
            {item.courseTitle} · {item.exerciseTitle}
          </ItemDescription>
          <View style={styles.meta}>
            <Icon icon={Clock} size={13} tone={longWait ? 'warning' : 'subtle'} />
            <Text variant="micro" tone={longWait ? 'warning' : 'muted'}>
              {waiting ?? t('waiting')}
            </Text>
            {kinds ? (
              <Text variant="micro" tone="muted" numberOfLines={1} style={styles.kinds}>
                · {kinds}
              </Text>
            ) : null}
            {item.isLate && (
              <Text variant="micro" tone="danger">
                · {t('late')}
              </Text>
            )}
          </View>
        </ItemContent>
        <ItemActions>
          <ItemChevron />
        </ItemActions>
      </Item>
    </SwipeActionRow>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  kinds: { flexShrink: 1 }
});
