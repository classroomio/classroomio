import { ArrowLeftIcon } from 'phosphor-react-native/src/icons/ArrowLeft';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CloudArrowUpIcon } from 'phosphor-react-native/src/icons/CloudArrowUp';
import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { LockIcon } from 'phosphor-react-native/src/icons/Lock';
import { ContentType } from '@cio/utils/constants/content';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Progress } from '@/feature/common/components/progress';
import { IconTile } from '@/feature/common/components/icon-tile';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { lockReasonOf } from '@/feature/course/helpers/content-copy';
import { contentIconOf } from '@/feature/course/helpers/content-icon';
import { isAccessible } from '@/feature/course/helpers/course-content';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { CourseContentItem } from '@/feature/course/types/course-detail';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';

const COMPLETED_ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.94 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT }
}).duration(220);

export function LessonFooter({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return <View style={[styles.footer, { borderTopColor: colors.border }]}>{children}</View>;
}

type LessonCompletionProps = {
  policy: string;
  complete: boolean;
  threshold: number | null;
  watchedPercent: number | null;
  hasNext: boolean;
  pending: boolean;
  /** Completed on this device and waiting to reach the server. */
  syncPending?: boolean;
  onComplete: () => void;
  onUndo: () => void;
};

/** The completion control for the lesson's policy: a button for `manual`, watch progress for `video_watch`, nothing for `none`. */
export function LessonCompletion({
  policy,
  complete,
  threshold,
  watchedPercent,
  hasNext,
  pending,
  syncPending = false,
  onComplete,
  onUndo
}: LessonCompletionProps) {
  const t = useTranslations(lessonCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const [completeOnOpen] = useState(complete);

  if (complete) {
    return (
      <View style={styles.completed}>
        <Animated.View
          entering={completeOnOpen ? undefined : COMPLETED_ENTER}
          style={styles.completedLabel}
          accessible
          accessibilityLabel={syncPending ? t('completedSyncPendingLabel') : t('completedLabel')}
        >
          <View style={[styles.completedTile, { backgroundColor: colors.successTint }]}>
            <Icon icon={syncPending ? CloudArrowUpIcon : CheckIcon} size={18} tone="success" weight="bold" />
          </View>
          <View style={styles.completedCopy}>
            <Text variant="bodyStrong" tone="success">
              {t('completed')}
            </Text>
            {syncPending ? (
              <Text variant="caption" tone="muted">
                {t('syncsWhenBackOnline')}
              </Text>
            ) : null}
          </View>
        </Animated.View>
        {policy === 'manual' && !syncPending ? (
          <Button size="sm" variant="ghost" disabled={pending} onPress={onUndo}>
            <ButtonText>{t('markNotComplete')}</ButtonText>
          </Button>
        ) : null}
      </View>
    );
  }

  if (policy === 'video_watch') {
    const percent = threshold ?? 95;

    return (
      <Banner tone="info">
        <BannerIcon icon={EyeIcon} />
        <BannerContent>
          <BannerTitle>{t('watchToComplete', { percent: format.percent(percent) })}</BannerTitle>
          <BannerDescription>
            {watchedPercent !== null
              ? t('watchedSoFar', { percent: format.percent(watchedPercent) })
              : t('completesOnItsOwn')}
          </BannerDescription>
          {watchedPercent !== null ? (
            <View style={styles.watchProgress}>
              <Progress value={(watchedPercent / percent) * 100} />
            </View>
          ) : null}
        </BannerContent>
      </Banner>
    );
  }

  if (policy !== 'manual') return null;

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

type LessonNavigationProps = {
  previous: CourseContentItem | null;
  next: CourseContentItem | null;
  items: CourseContentItem[];
  onOpen: (item: CourseContentItem) => void;
};

/** The way on from the lesson: the next item as a card, and a quieter link back to the previous one. */
export function LessonNavigation({ previous, next, items, onOpen }: LessonNavigationProps) {
  if (!previous && !next) return null;

  return (
    <View style={styles.navigation}>
      {next ? <LessonNextCard next={next} items={items} onOpen={onOpen} /> : null}
      {previous ? <LessonPreviousLink previous={previous} onOpen={onOpen} /> : null}
    </View>
  );
}

type LessonNextCardProps = {
  next: CourseContentItem;
  items: CourseContentItem[];
  onOpen: (item: CourseContentItem) => void;
};

function LessonNextCard({ next, items, onOpen }: LessonNextCardProps) {
  const t = useTranslations(lessonCatalog);
  const courseT = useTranslations(courseCatalog);
  const { colors, elevation } = useTheme();
  const locked = !isAccessible(next);
  const isExercise = next.type === ContentType.Exercise;
  const label = isExercise ? t('nextExercise') : t('nextLesson');
  const title = next.title || (isExercise ? courseT('untitledExercise') : courseT('untitledLesson'));

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={[
        t(isExercise ? 'nextExerciseItem' : 'nextLessonItem', { title }),
        locked ? lockReasonOf(next, items, courseT) : null
      ]
        .filter(Boolean)
        .join(', ')}
      disabled={locked}
      scaleTo={0.985}
      onPress={() => {
        tapHaptic();
        onOpen(next);
      }}
      style={[styles.nextCard, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised]}
    >
      {locked ? (
        <View style={[styles.lockTile, { backgroundColor: colors.muted }]}>
          <Icon icon={LockIcon} size={20} tone="subtle" />
        </View>
      ) : (
        <IconTile icon={contentIconOf(next)} tone="primary" size={44} />
      )}
      <View style={styles.nextCopy}>
        <Text variant="captionStrong" tone={locked ? 'subtle' : 'primary'} numberOfLines={1}>
          {label}
        </Text>
        <Text variant="bodyStrong" tone={locked ? 'muted' : 'ink'} numberOfLines={2}>
          {title}
        </Text>
        {locked ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {lockReasonOf(next, items, courseT)}
          </Text>
        ) : null}
      </View>
      {locked ? null : <Icon icon={ArrowRightIcon} size={20} tone="muted" />}
    </PressableScale>
  );
}

function LessonPreviousLink({
  previous,
  onOpen
}: {
  previous: CourseContentItem;
  onOpen: (item: CourseContentItem) => void;
}) {
  const t = useTranslations(lessonCatalog);
  const available = isAccessible(previous);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
      accessibilityLabel={t('previousItem', { title: previous.title })}
      disabled={!available}
      hitSlop={HIT_SLOP}
      onPress={() => {
        tapHaptic();
        onOpen(previous);
      }}
      style={({ pressed }) => [styles.previous, (pressed || !available) && styles.previousDimmed]}
    >
      <Icon icon={ArrowLeftIcon} size={16} tone="muted" />
      <Text variant="captionStrong" tone="muted" numberOfLines={1} style={styles.previousText}>
        {t('previousItem', { title: previous.title })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: { gap: SPACING.lg, paddingTop: SPACING.xl, borderTopWidth: StyleSheet.hairlineWidth },
  completed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  completedLabel: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  completedTile: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill
  },
  completedCopy: { gap: 2 },
  watchProgress: { marginTop: SPACING.xs },
  navigation: { gap: SPACING.md },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  lockTile: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.input,
    borderCurve: 'continuous'
  },
  nextCopy: { flex: 1, gap: 2 },
  previous: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xxs + 2 },
  previousDimmed: { opacity: 0.5 },
  previousText: { flexShrink: 1 }
});
