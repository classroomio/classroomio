import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, ICON_STROKE, SPACING } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { starMaxOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function StarQuestion({ question }: { question: ExerciseQuestion }) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const { answer, setAnswer } = useQuestionAnswer(question, 'STAR');
  const max = starMaxOf(question);
  const value = answer?.value ?? 0;
  const size = max > 7 ? 28 : 36;

  return (
    <View style={styles.wrap}>
      <View accessibilityRole="adjustable" style={styles.row}>
        {Array.from({ length: max }, (_, index) => {
          const rating = index + 1;
          const filled = rating <= value;

          return (
            <PressableScale
              key={rating}
              accessibilityRole="button"
              accessibilityLabel={t('starRatingLabel', { count: max, rating })}
              accessibilityState={{ selected: rating === value }}
              hitSlop={HIT_SLOP}
              scaleTo={0.88}
              onPress={() => {
                selectionHaptic();
                setAnswer({ type: 'STAR', value: rating });
              }}
              style={styles.star}
            >
              <Star
                size={size}
                color={filled ? colors.primary : colors.borderStrong}
                fill={filled ? colors.primary : 'transparent'}
                strokeWidth={ICON_STROKE}
                absoluteStrokeWidth
              />
            </PressableScale>
          );
        })}
      </View>
      <Text variant="caption" tone="muted">
        {value > 0 ? t('starRatingLabel', { count: max, rating: value }) : t('starPrompt')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xxs },
  star: { padding: SPACING.xxs }
});
