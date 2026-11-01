import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { selectionHaptic, tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { UnsupportedQuestion } from '@/feature/exercise/components/unsupported-question';
import { placementsFromAnswer, wordBankOf } from '@/feature/exercise/helpers/arrangement';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function WordBankQuestion({ question }: { question: ExerciseQuestion }) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const { answer, setAnswer } = useQuestionAnswer(question, 'WORD_BANK');
  const { segments, blankCount, chips } = wordBankOf(question);
  const placements = placementsFromAnswer(answer?.filledBlanks ?? [], chips, blankCount);
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const chipLabel = (chipId: string | null) => chips.find((chip) => chip.id === chipId)?.label ?? '';

  if (blankCount === 0) return <UnsupportedQuestion reason={t('wordBankNoBlanks')} />;

  const commit = (next: (string | null)[]) => {
    const filledBlanks = next.map(chipLabel);
    setAnswer(filledBlanks.some(Boolean) ? { type: 'WORD_BANK', filledBlanks } : null);
  };

  const placeChip = (chipId: string) => {
    const target = activeBlank !== null && placements[activeBlank] === null ? activeBlank : placements.indexOf(null);
    if (target < 0) return;

    selectionHaptic();
    const next = placements.map((placed, index) => (index === target ? chipId : placed));
    commit(next);
    const nextEmpty = next.indexOf(null);
    setActiveBlank(nextEmpty >= 0 ? nextEmpty : null);
  };

  const pressBlank = (index: number) => {
    tapHaptic();
    if (placements[index] !== null) {
      commit(placements.map((placed, position) => (position === index ? null : placed)));
    }
    setActiveBlank(index);
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.sentence, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {segments.flatMap((segment, segmentIndex) => {
          if (segment.type === 'text') {
            return segment.value
              .split(/(\s+)/)
              .filter((token) => token.trim().length > 0)
              .map((token, tokenIndex) => (
                <Text key={`${segmentIndex}-${tokenIndex}`} variant="body">
                  {token}
                </Text>
              ));
          }

          const placed = placements[segment.index] ?? null;
          const active = activeBlank === segment.index;

          return [
            <PressableScale
              key={`blank-${segment.index}`}
              accessibilityRole="button"
              accessibilityLabel={
                placed
                  ? t('blankFilled', { number: segment.index + 1, word: chipLabel(placed) })
                  : t('blankEmpty', { number: segment.index + 1 })
              }
              accessibilityState={{ selected: active }}
              onPress={() => pressBlank(segment.index)}
              style={[
                styles.blank,
                {
                  borderColor: active ? colors.primary : placed ? colors.primary : colors.borderStrong,
                  backgroundColor: placed ? colors.primaryTint : active ? colors.muted : colors.surface,
                  borderStyle: placed ? 'solid' : 'dashed'
                }
              ]}
            >
              {placed ? (
                <Animated.View key={placed} entering={FadeIn.duration(DURATION.fast).easing(EASE_OUT)}>
                  <Text variant="captionStrong" tone="primary">
                    {chipLabel(placed)}
                  </Text>
                </Animated.View>
              ) : (
                <Text variant="caption" tone="subtle">
                  {segment.index + 1}
                </Text>
              )}
            </PressableScale>
          ];
        })}
      </View>

      <View style={styles.bank} accessibilityLabel={t('wordBank')}>
        {chips.map((chip) => {
          const used = placements.includes(chip.id);

          return (
            <PressableScale
              key={chip.id}
              accessibilityRole="button"
              accessibilityLabel={used ? t('wordPlaced', { word: chip.label }) : chip.label}
              accessibilityState={{ disabled: used }}
              disabled={used}
              onPress={() => placeChip(chip.id)}
              style={[
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                used && { backgroundColor: colors.muted, borderColor: colors.muted }
              ]}
            >
              <Text variant="captionStrong" tone={used ? 'subtle' : 'ink'}>
                {chip.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      <Text variant="caption" tone="muted">
        {t('wordBankHint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.md },
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 5,
    rowGap: SPACING.xs,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  blank: {
    minWidth: 72,
    minHeight: 34,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADII.input,
    borderCurve: 'continuous'
  },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    minHeight: 40,
    paddingHorizontal: SPACING.sm + 2,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADII.input,
    borderCurve: 'continuous'
  }
});
