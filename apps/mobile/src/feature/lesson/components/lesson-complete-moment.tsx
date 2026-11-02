import { useEffect, useEffectEvent } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { NOTCH_BLOCK_STACK_DURATION, NotchBlockStack } from '@/feature/common/components/notch-block-stack';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';

const HOLD_AFTER_STACK = 200;

const SURFACE_ENTER = FadeIn.duration(DURATION.fast).easing(EASE_OUT);
const SURFACE_EXIT = FadeOut.duration(200).easing(EASE_OUT);
const COPY_ENTER = FadeInDown.duration(DURATION.base).delay(180).easing(EASE_OUT);

export type LessonCompleteMomentProps = {
  description: string | null;
  /** Runs once the moment has played; the screen advances or dismisses it. */
  onFinish: () => void;
};

/** A short, full-screen "Lesson complete" moment shown after the learner completes a lesson. */
export function LessonCompleteMoment({ description, onFinish }: LessonCompleteMomentProps) {
  const { colors } = useTheme();
  const t = useTranslations(lessonCatalog);
  const title = t('lessonComplete');
  const finish = useEffectEvent(onFinish);
  const announce = useEffectEvent(() =>
    AccessibilityInfo.announceForAccessibility(description ? `${title}. ${description}` : title)
  );

  useEffect(() => {
    successHaptic();
    announce();
    const timer = setTimeout(finish, NOTCH_BLOCK_STACK_DURATION + HOLD_AFTER_STACK);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      entering={SURFACE_ENTER}
      exiting={SURFACE_EXIT}
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, styles.surface, { backgroundColor: colors.background }]}
    >
      <NotchBlockStack cutoutColor={colors.background} />
      <Animated.View entering={COPY_ENTER} style={styles.copy}>
        <Text variant="title" accessibilityRole="header" style={styles.center}>
          {title}
        </Text>
        {description ? (
          <Text variant="body" tone="muted" numberOfLines={3} style={styles.center}>
            {description}
          </Text>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingHorizontal: GUTTER * 2,
    paddingBottom: SPACING.xxxl * 2
  },
  copy: { alignItems: 'center', gap: SPACING.xxs },
  center: { textAlign: 'center' }
});
