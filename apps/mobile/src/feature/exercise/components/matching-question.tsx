import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import {
  SortableHandle,
  SortableItem,
  SortableList,
  SortableMoveButtons
} from '@/feature/common/components/sortable-list';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { ArrangeStatus } from '@/feature/exercise/components/arrange-status';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { useScrollLock } from '@/feature/exercise/components/scroll-lock';
import { UnsupportedQuestion } from '@/feature/exercise/components/unsupported-question';
import { matchingPairsOf, stableShuffle } from '@/feature/exercise/helpers/arrangement';
import { sortableLabelsOf } from '@/feature/exercise/helpers/sortable-labels';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const ROW_HEIGHT = 64;
const GAP = SPACING.xs;

type RightItem = { id: string; label: string };

function rightOrderFromAnswer(lefts: string[], rights: RightItem[], pairs: { left: string; right: string }[]) {
  const remaining = [...rights];
  const ordered = lefts.map((left) => {
    const pair = pairs.find((candidate) => candidate.left === left);
    const index = remaining.findIndex((item) => item.label === pair?.right);

    return index >= 0 ? remaining.splice(index, 1)[0] : undefined;
  });

  return ordered.map((item) => item ?? remaining.shift()).filter((item): item is RightItem => Boolean(item));
}

export function MatchingQuestion({ question }: { question: ExerciseQuestion }) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const setScrollLocked = useScrollLock();
  const { answer, setAnswer } = useQuestionAnswer(question, 'MATCHING');
  const pairs = matchingPairsOf(question);
  const lefts = pairs.map((pair) => pair.left);
  const rights = pairs.map((pair, index) => ({ id: `right-${index}`, label: pair.right }));
  const ordered = answer
    ? rightOrderFromAnswer(lefts, rights, answer.pairs)
    : stableShuffle(rights, `matching:${question.id}`);

  if (pairs.length < 2) return <UnsupportedQuestion reason={t('matchingNoPairs')} />;

  const save = (ids: string[]) => {
    const byId = new Map(rights.map((item) => [item.id, item.label]));
    setAnswer({
      type: 'MATCHING',
      pairs: lefts.map((left, index) => ({ left, right: byId.get(ids[index] ?? '') ?? '' }))
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.columns}>
        <View style={styles.leftColumn}>
          {lefts.map((left, index) => (
            <View
              key={`${left}-${index}`}
              style={[styles.leftCell, { backgroundColor: colors.sand, borderColor: colors.border }]}
            >
              <Text variant="captionStrong" numberOfLines={3} maxFontSizeMultiplier={1.3} style={styles.leftText}>
                {left}
              </Text>
              <Icon icon={ArrowRight} size={14} tone="subtle" />
            </View>
          ))}
        </View>
        <SortableList
          ids={ordered.map((item) => item.id)}
          itemHeight={ROW_HEIGHT}
          gap={GAP}
          onReorder={save}
          onDragActiveChange={setScrollLocked}
          labels={sortableLabelsOf(t)}
          style={styles.rightColumn}
        >
          {ordered.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              accessibilityLabel={t('matchedWith', { item: item.label, target: lefts[index] ?? '' })}
            >
              <SortableHandle />
              <Text variant="caption" numberOfLines={3} maxFontSizeMultiplier={1.3} style={styles.rightText}>
                {item.label}
              </Text>
              <SortableMoveButtons />
            </SortableItem>
          ))}
        </SortableList>
      </View>
      <ArrangeStatus
        answered={Boolean(answer)}
        confirmLabel={t('useTheseMatches')}
        onConfirm={() => save(ordered.map((item) => item.id))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.sm },
  columns: { flexDirection: 'row', gap: SPACING.xs },
  leftColumn: { flex: 0.85, gap: GAP },
  leftCell: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  leftText: { flex: 1 },
  rightColumn: { flex: 1.15 },
  rightText: { flex: 1 }
});
