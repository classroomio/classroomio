import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { exploreCatalog } from '@/feature/explore/translations/catalog';
import type { ExploreCourse } from '@/feature/explore/types/explore';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { ExploreCoursePrice } from './explore-course-price';

type ExploreEnrollActionProps = {
  course: ExploreCourse;
  enrolling: boolean;
  disabled: boolean;
  onEnroll: () => void;
  onOpenCourse: () => void;
};

/**
 * What the learner can do with a catalogue course: open it when enrolled, enroll when the server allows it in the
 * app, or read why they cannot. Paid courses show their price and no purchase path.
 */
export function ExploreEnrollAction({ course, enrolling, disabled, onEnroll, onOpenCourse }: ExploreEnrollActionProps) {
  const t = useTranslations(exploreCatalog);

  if (course.isEnrolled) {
    return (
      <Button size="lg" onPress={onOpenCourse}>
        <ButtonText>{t('goToCourse')}</ButtonText>
        <ButtonIcon icon={ArrowRightIcon} />
      </Button>
    );
  }

  if (course.canEnrollInApp) {
    return (
      <Button size="lg" disabled={disabled || enrolling} onPress={onEnroll}>
        {enrolling ? <ButtonSpinner /> : <ButtonText>{t('enroll')}</ButtonText>}
      </Button>
    );
  }

  return (
    <View style={styles.note}>
      {course.requiresPayment ? <ExploreCoursePrice course={course} /> : null}
      <Text variant="caption" tone="muted">
        {course.requiresPayment ? t('paidNotAvailable') : t('inviteOnly')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { gap: SPACING.xxs, paddingVertical: SPACING.xxs }
});
