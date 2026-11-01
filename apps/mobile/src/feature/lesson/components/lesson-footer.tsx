import { ArrowLeftIcon } from 'phosphor-react-native/src/icons/ArrowLeft';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CloudArrowUpIcon } from 'phosphor-react-native/src/icons/CloudArrowUp';
import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { ContentType } from '@cio/utils/constants/content';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { lockReasonOf } from '@/feature/course/helpers/content-copy';
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
          <Icon icon={syncPending ? CloudArrowUpIcon : CheckCircleIcon} size={20} tone="success" />
          <View>
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

export function LessonNavigation({ previous, next, items, onOpen }: LessonNavigationProps) {
  const t = useTranslations(lessonCatalog);
  const courseT = useTranslations(courseCatalog);
  if (!previous && !next) return null;

  const nextLocked = next ? !isAccessible(next) : false;
  const nextIsExercise = next?.type === ContentType.Exercise;

  return (
    <View style={styles.navigation}>
      <View style={styles.navigationRow}>
        {previous ? (
          <Button
            variant="outline"
            disabled={!isAccessible(previous)}
            accessibilityLabel={t('previousItem', { title: previous.title })}
            onPress={() => onOpen(previous)}
            style={styles.navigationButton}
          >
            <ButtonIcon icon={ArrowLeftIcon} />
            <ButtonText>{t('previous')}</ButtonText>
          </Button>
        ) : null}
        {next ? (
          <Button
            variant="outline"
            disabled={nextLocked}
            accessibilityLabel={t(nextIsExercise ? 'nextExerciseItem' : 'nextLessonItem', { title: next.title })}
            onPress={() => onOpen(next)}
            style={styles.navigationButton}
          >
            <ButtonText>{nextIsExercise ? t('nextExercise') : t('nextLesson')}</ButtonText>
            <ButtonIcon icon={ArrowRightIcon} />
          </Button>
        ) : null}
      </View>
      {next ? (
        <Text variant="caption" tone="muted" style={styles.hint} numberOfLines={2}>
          {nextLocked ? lockReasonOf(next, items, courseT) : t('nextItem', { title: next.title })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { gap: SPACING.md, paddingTop: SPACING.lg, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  completed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  completedLabel: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  watchProgress: { marginTop: SPACING.xs },
  navigation: { gap: SPACING.xs },
  navigationRow: { flexDirection: 'row', gap: SPACING.xs },
  navigationButton: { flex: 1 },
  hint: { textAlign: 'center' }
});
