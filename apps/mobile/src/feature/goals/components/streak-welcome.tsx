import { router } from 'expo-router';
import Storage from 'expo-sqlite/kv-store';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Keyframe, ReduceMotion } from 'react-native-reanimated';

import { Button, ButtonText } from '@/feature/common/components/button';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useWindowInsets } from '@/feature/common/helpers/use-window-insets';
import { goalsCatalog } from '@/feature/goals/translations/catalog';
import type { GoalsSummary } from '@/feature/goals/types/goals';
import { StreakFlame } from '@/feature/goals/components/streak-flame';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const SHOWN_KEY = 'streak-welcome:last-shown';

const FLAME = 88;

const FLAME_IN = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.9 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT }
})
  .duration(360)
  .reduceMotion(ReduceMotion.System);

type StreakWelcomeProps = {
  userId: string | null;
  goals: GoalsSummary | undefined;
  /** Opens the course to resume, or null when there is none. */
  onResume: (() => void) | null;
};

/** Full-screen streak greeting on the first open of the learner's day, offering to resume or explore. */
export function StreakWelcome({ userId, goals, onResume }: StreakWelcomeProps) {
  const t = useTranslations(goalsCatalog);
  const { colors } = useTheme();
  const insets = useWindowInsets();
  const [visible, setVisible] = useState(false);
  const today = goals?.today ?? null;
  const current = goals?.streak.current ?? 0;

  useEffect(() => {
    if (!userId || !today || current <= 0) return;

    const key = `${SHOWN_KEY}:${userId}`;
    if (Storage.getItemSync(key) === today) return;

    Storage.setItemSync(key, today);
    setVisible(true);
    successHaptic();
  }, [userId, today, current]);

  if (!visible || !goals) return null;

  const close = (next?: () => void) => {
    setVisible(false);
    next?.();
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => close()}>
      <Animated.View
        entering={FadeIn.duration(DURATION.base).easing(EASE_OUT)}
        exiting={FadeOut.duration(DURATION.fast)}
        style={[
          styles.screen,
          { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }
        ]}
      >
        <View style={styles.center} accessible accessibilityRole="summary">
          <Animated.View entering={FLAME_IN}>
            <StreakFlame state={goals.streak.activeToday ? 'lit' : 'waiting'} size={FLAME} />
          </Animated.View>
          <Text variant="display" style={styles.text}>
            {t('welcomeTitle', { count: current })}
          </Text>
          <Text variant="body" tone="muted" style={styles.text}>
            {goals.streak.activeToday ? t('welcomeDescriptionActive') : t('welcomeDescription')}
          </Text>
        </View>
        <View style={styles.actions}>
          {onResume ? (
            <Button size="lg" onPress={() => close(onResume)}>
              <ButtonText>{t('welcomeResume')}</ButtonText>
            </Button>
          ) : null}
          <Button size="lg" variant="outline" onPress={() => close(() => router.navigate('/explore'))}>
            <ButtonText>{t('welcomeExplore')}</ButtonText>
          </Button>
          <Button size="lg" variant="ghost" onPress={() => close()}>
            <ButtonText>{t('welcomeDismiss')}</ButtonText>
          </Button>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: GUTTER, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  text: { textAlign: 'center' },
  actions: { gap: SPACING.xs }
});
