import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { NotchCard } from '@/feature/common/components/notch-card';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { progressPercentOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { CourseThumbnail } from './course-thumbnail';

type ContinueLearningCardProps = { course: EnrolledCourse; onContinue: (course: EnrolledCourse) => void };

export function ContinueLearningCard({ course, onContinue }: ContinueLearningCardProps) {
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const format = useFormatters();
  const progress = progressPercentOf(course);

  return (
    <NotchCard style={styles.card}>
      <View style={styles.header}>
        <CourseThumbnail uri={course.bannerImage || course.logo} size={44} />
        <View style={styles.copy}>
          <Text variant="heading" numberOfLines={2}>
            {course.title}
          </Text>
          <Text variant="caption" tone="muted">
            {t('percentComplete', { percent: format.percent(progress) })}
          </Text>
        </View>
      </View>
      <Progress value={progress} />
      <Button onPress={() => onContinue(course)}>
        <ButtonText>{common('continue')}</ButtonText>
        <ButtonIcon icon={ArrowRight} />
      </Button>
    </NotchCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  copy: { flex: 1, gap: 2 }
});
