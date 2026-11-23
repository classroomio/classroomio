import { StyleSheet, View } from 'react-native';

import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { durationLabel, levelLabel } from '@/feature/course/helpers/course-facts';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type CourseFactsProps = {
  description: string | null;
  level: string | null;
  durationMinutes: number | null;
  lessonCount: number;
  instructorName: string | null;
};

/** What the course is about, its level, length, lesson count and instructor. */
export function CourseFacts({ description, level, durationMinutes, lessonCount, instructorName }: CourseFactsProps) {
  const t = useTranslations(courseCatalog);
  const format = useFormatters();
  const locale = useLocale();
  const { colors } = useTheme();
  const facts = [
    { label: t('factLevel'), value: levelLabel(level, t) },
    { label: t('factDuration'), value: durationLabel(durationMinutes, t, locale) },
    { label: t('factLessons'), value: format.number(lessonCount) },
    { label: t('factInstructor'), value: instructorName }
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <View style={styles.root}>
      {description ? (
        <View style={styles.about}>
          <Text variant="subheading" accessibilityRole="header">
            {t('aboutCourse')}
          </Text>
          <Text variant="body" tone="muted">
            {description}
          </Text>
        </View>
      ) : null}
      <View style={[styles.grid, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {facts.map((fact) => (
          <View key={fact.label} style={styles.fact} accessible accessibilityLabel={`${fact.label}, ${fact.value}`}>
            <Text variant="caption" tone="muted">
              {fact.label}
            </Text>
            <Text variant="bodyStrong" numberOfLines={2}>
              {fact.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.md },
  about: { gap: SPACING.xs },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous',
    paddingVertical: SPACING.xs
  },
  fact: { width: '50%', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, gap: 2 }
});
