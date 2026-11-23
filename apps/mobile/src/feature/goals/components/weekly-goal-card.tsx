import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Button, ButtonIcon } from '@/feature/common/components/button';
import { Card } from '@/feature/common/components/card';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { FONT_FAMILY } from '@/feature/common/constants/typography';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useUpdateWeeklyTargetMutation } from '@/feature/goals/api/goals';
import { goalsCatalog } from '@/feature/goals/translations/catalog';
import type { GoalsSummary } from '@/feature/goals/types/goals';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';

const MIN_TARGET = 1;
const MAX_TARGET = 50;
const SAVE_DELAY_MS = 600;

const RING = 116;
const STROKE = 12;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const FILL_MS = 700;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Lessons completed this week as a filling ring against the learner's target, which they can raise or lower. */
export function WeeklyGoalCard({ goal }: { goal: GoalsSummary['weeklyGoal'] }) {
  const t = useTranslations(goalsCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const update = useUpdateWeeklyTargetMutation();
  const [draft, setDraft] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = draft ?? goal.target;
  const reached = goal.completed >= target;
  const remaining = Math.max(0, target - goal.completed);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const step = (delta: number) => {
    const next = Math.min(MAX_TARGET, Math.max(MIN_TARGET, target + delta));
    if (next === target) return;

    selectionHaptic();
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      update.mutate(next, {
        onSettled: () => setDraft(null),
        onError: (error) => showToast({ tone: 'danger', title: t('goalNotSaved'), description: errorMessage(error) })
      });
    }, SAVE_DELAY_MS);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.summary}>
        <GoalRing completed={goal.completed} target={target} reached={reached} />
        <View style={styles.copy}>
          <Text variant="heading">{t('weeklyTitle')}</Text>
          <Text variant="caption" tone={reached ? 'success' : 'muted'}>
            {reached ? t('weeklyReached') : t('weeklyRemaining', { count: remaining })}
          </Text>
        </View>
      </View>

      <View style={[styles.stepper, { backgroundColor: colors.muted }]}>
        <Button
          variant="ghost"
          size="icon"
          haptic={false}
          accessibilityLabel={t('lowerTarget')}
          disabled={target <= MIN_TARGET}
          onPress={() => step(-1)}
        >
          <ButtonIcon icon={MinusIcon} />
        </Button>
        <Text
          variant="label"
          style={styles.target}
          accessibilityLiveRegion="polite"
          accessibilityLabel={t('targetLabel', { count: target })}
        >
          {t('targetLabel', { count: target })}
        </Text>
        <Button
          variant="ghost"
          size="icon"
          haptic={false}
          accessibilityLabel={t('raiseTarget')}
          disabled={target >= MAX_TARGET}
          onPress={() => step(1)}
        >
          <ButtonIcon icon={PlusIcon} />
        </Button>
      </View>
    </Card>
  );
}

type GoalRingProps = { completed: number; target: number; reached: boolean };

function GoalRing({ completed, target, reached }: GoalRingProps) {
  const t = useTranslations(goalsCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const fraction = target > 0 ? Math.min(1, completed / target) : 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(fraction, { duration: FILL_MS, easing: EASE_OUT, reduceMotion: ReduceMotion.System }));
  }, [fraction, progress]);

  const arc = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progress.get()) }));

  return (
    <View
      style={styles.ring}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('weeklyProgress', { completed: format.number(completed), target: format.number(target) })}
      accessibilityValue={{ min: 0, max: target, now: Math.min(completed, target) }}
    >
      <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
        <Circle cx={RING / 2} cy={RING / 2} r={RADIUS} stroke={colors.mutedStrong} strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={RING / 2}
          cy={RING / 2}
          r={RADIUS}
          stroke={reached ? colors.success : colors.primary}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          animatedProps={arc}
        />
      </Svg>
      {reached ? <Icon icon={CheckIcon} size={16} tone="success" weight="bold" /> : null}
      <Text style={[styles.ringCount, { color: colors.ink }]}>{format.number(completed)}</Text>
      <Text variant="micro" tone="muted">
        {t('ofTarget', { target: format.number(target) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.md, padding: SPACING.md },
  summary: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  ring: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringCount: {
    fontFamily: FONT_FAMILY.extrabold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
    fontVariant: ['tabular-nums']
  },
  copy: { flex: 1, gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: RADII.lg, padding: SPACING.xxs },
  target: { flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }
});
