import { StyleSheet, View } from 'react-native';

import {
  SortableHandle,
  SortableItem,
  SortableList,
  SortableMoveButtons
} from '@/feature/common/components/sortable-list';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { ArrangeStatus } from '@/feature/exercise/components/arrange-status';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { useScrollLock } from '@/feature/exercise/components/scroll-lock';
import { UnsupportedQuestion } from '@/feature/exercise/components/unsupported-question';
import { applyOrder, orderingItemsOf, stableShuffle } from '@/feature/exercise/helpers/arrangement';
import { sortableLabelsOf } from '@/feature/exercise/helpers/sortable-labels';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const ROW_HEIGHT = 64;

export function OrderingQuestion({ question }: { question: ExerciseQuestion }) {
  const t = useTranslations(exerciseCatalog);
  const setScrollLocked = useScrollLock();
  const { answer, setAnswer } = useQuestionAnswer(question, 'ORDERING');
  const source = orderingItemsOf(question);
  const items = answer ? applyOrder(source, answer.orderedValues) : stableShuffle(source, `ordering:${question.id}`);

  if (source.length < 2) return <UnsupportedQuestion reason={t('orderingTooFew')} />;

  const save = (ids: string[]) => {
    const byId = new Map(source.map((item) => [item.id, item]));
    const orderedValues = ids.map((id) => byId.get(id)?.value).filter((value): value is string => Boolean(value));
    setAnswer({ type: 'ORDERING', orderedValues });
  };

  return (
    <View style={styles.wrap}>
      <SortableList
        ids={items.map((item) => item.id)}
        itemHeight={ROW_HEIGHT}
        onReorder={save}
        onDragActiveChange={setScrollLocked}
        labels={sortableLabelsOf(t)}
      >
        {items.map((item, index) => (
          <SortableItem key={item.id} id={item.id} accessibilityLabel={item.label}>
            <SortableHandle />
            <Text variant="caption" tone="subtle" style={styles.number}>
              {index + 1}
            </Text>
            <Text variant="body" numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.label}>
              {item.label}
            </Text>
            <SortableMoveButtons />
          </SortableItem>
        ))}
      </SortableList>
      <ArrangeStatus
        answered={Boolean(answer)}
        confirmLabel={t('useThisOrder')}
        onConfirm={() => save(items.map((item) => item.id))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.sm },
  number: { width: 18, textAlign: 'center' },
  label: { flex: 1 }
});
