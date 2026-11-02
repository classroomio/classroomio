import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CloudArrowUpIcon } from 'phosphor-react-native/src/icons/CloudArrowUp';
import { LockIcon } from 'phosphor-react-native/src/icons/Lock';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { isAccessible } from '@/feature/course/helpers/course-content';
import type { CourseContentItem } from '@/feature/course/types/course-detail';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';

const DEFAULT_WATCH_THRESHOLD = 95;

const COMPLETED_ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.9 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT }
}).duration(220);

/** One line of the lesson's bottom bar: status or progress on the left, the way on at the right. */
export function LessonActionRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function LessonActionNote({ children }: { children: string }) {
  return (
    <Text variant="caption" tone="muted" numberOfLines={2} style={styles.copy}>
      {children}
    </Text>
  );
}

export function LessonCompleteButton({
  hasNext,
  pending,
  onComplete
}: {
  hasNext: boolean;
  pending: boolean;
  onComplete: () => void;
}) {
  const t = useTranslations(lessonCatalog);

  return (
    <Button size="lg" disabled={pending} onPress={onComplete}>
      {pending ? (
        <ButtonSpinner />
      ) : (
        <>
          <ButtonIcon icon={CheckIcon} />
          <ButtonText>{hasNext ? t('completeAndContinue') : t('markComplete')}</ButtonText>
        </>
      )}
    </Button>
  );
}

type LessonCompletedStatusProps = {
  /** Plays the check's entrance; only when the lesson was completed during this visit. */
  animate: boolean;
  /** Completed on this device and waiting to reach the server. */
  syncPending: boolean;
  undoable: boolean;
  pending: boolean;
  detail: string;
  onUndo: () => void;
};

/** The completed check, which undoes completion when tapped, with a line of detail beside it. */
export function LessonCompletedStatus({
  animate,
  syncPending,
  undoable,
  pending,
  detail,
  onUndo
}: LessonCompletedStatusProps) {
  const t = useTranslations(lessonCatalog);
  const { colors } = useTheme();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={syncPending ? t('completedSyncPendingLabel') : t('completedLabel')}
        accessibilityHint={undoable ? t('markNotComplete') : undefined}
        accessibilityState={{ checked: true, disabled: !undoable || pending }}
        disabled={!undoable || pending}
        hitSlop={HIT_SLOP}
        onPress={() => {
          tapHaptic();
          onUndo();
        }}
      >
        <Animated.View
          entering={animate ? COMPLETED_ENTER : undefined}
          style={[styles.mark, { backgroundColor: syncPending ? colors.muted : colors.success }]}
        >
          <Icon
            icon={syncPending ? CloudArrowUpIcon : CheckIcon}
            size={20}
            tone={syncPending ? 'muted' : undefined}
            color={syncPending ? undefined : colors.onSolid}
            weight="bold"
          />
        </Animated.View>
      </Pressable>
      <View style={styles.copy}>
        <Text variant="label" tone="success" numberOfLines={1}>
          {t('completed')}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {syncPending ? t('syncsWhenBackOnline') : detail}
        </Text>
      </View>
    </>
  );
}

export function LessonWatchProgress({
  threshold,
  watchedPercent
}: {
  threshold: number | null;
  watchedPercent: number | null;
}) {
  const t = useTranslations(lessonCatalog);
  const format = useFormatters();
  const target = threshold ?? DEFAULT_WATCH_THRESHOLD;
  const watched = watchedPercent ?? 0;

  return (
    <View style={styles.copy}>
      <Text variant="captionStrong" numberOfLines={1}>
        {t('watchToComplete', { percent: format.percent(target) })}
      </Text>
      <View style={styles.watchRow}>
        <View style={styles.watchBar}>
          <Progress value={(watched / target) * 100} />
        </View>
        <Text variant="micro" tone="muted">
          {t('watchedPercent', { percent: format.percent(watched) })}
        </Text>
      </View>
    </View>
  );
}

type LessonNextButtonProps = {
  next: CourseContentItem;
  /** Solid once the lesson is done, quieter while there is still something to do here. */
  emphasized: boolean;
  lockReason: string | null;
  onNext: (item: CourseContentItem) => void;
};

export function LessonNextButton({ next, emphasized, lockReason, onNext }: LessonNextButtonProps) {
  const t = useTranslations(lessonCatalog);
  const open = isAccessible(next);

  return (
    <Button
      variant={emphasized ? 'primary' : 'secondary'}
      disabled={!open}
      accessibilityLabel={[t('nextItem', { title: next.title }), open ? null : lockReason].filter(Boolean).join(', ')}
      onPress={() => {
        tapHaptic();
        onNext(next);
      }}
    >
      {open ? null : <ButtonIcon icon={LockIcon} />}
      <ButtonText>{t('next')}</ButtonText>
      {open ? <ButtonIcon icon={ArrowRightIcon} /> : null}
    </Button>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 48 },
  copy: { flex: 1, gap: 2 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  watchBar: { flex: 1 },
  mark: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
