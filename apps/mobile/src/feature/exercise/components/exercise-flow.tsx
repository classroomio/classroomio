import { FileMagnifyingGlassIcon } from 'phosphor-react-native/src/icons/FileMagnifyingGlass';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ScreenScrollView } from '@/feature/common/components/screen';
import { Skeleton, SkeletonGroup, SkeletonList } from '@/feature/common/components/skeleton';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { CourseActionBar } from '@/feature/course/components/course-action-bar';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useExerciseAttemptsQuery, useExerciseQuery } from '@/feature/exercise/api/exercise';
import { ConnectionRequired } from '@/feature/exercise/components/connection-required';
import { ExerciseIntro, ExerciseIntroStart } from '@/feature/exercise/components/exercise-intro';
import {
  AttemptSwitcher,
  ResultActions,
  ResultBreakdown,
  ResultFeedback,
  ResultSummary
} from '@/feature/exercise/components/exercise-result';
import { ExerciseSession } from '@/feature/exercise/components/exercise-session';
import { ExerciseTake } from '@/feature/exercise/components/exercise-take';
import { clearExerciseDraft, readExerciseDraft } from '@/feature/exercise/helpers/draft-store';
import { activeQuestionsOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseDraft } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type Mode = 'intro' | 'taking' | 'result';

type ExerciseFlowProps = { courseId: string; exerciseId: string };

export function ExerciseFlow({ courseId, exerciseId }: ExerciseFlowProps) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const tc = useTranslations(commonCatalog);
  const { userId } = useAuth();
  const online = !useIsOffline();
  const exerciseQuery = useExerciseQuery(courseId, exerciseId);
  const attemptsQuery = useExerciseAttemptsQuery(courseId, exerciseId);
  const [draft, setDraft] = useState<ExerciseDraft | null>(() =>
    userId ? readExerciseDraft(userId, exerciseId) : null
  );
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [attemptIndex, setAttemptIndex] = useState<number | null>(null);

  const attemptCount = attemptsQuery.data?.attempts.length;
  const draftIsStale = draft !== null && attemptCount !== undefined && draft.baseAttemptCount !== attemptCount;

  useEffect(() => {
    if (!draftIsStale || !userId) return;

    void clearExerciseDraft(userId, exerciseId);
    setDraft(null);
  }, [draftIsStale, userId, exerciseId]);

  const retry = () => Promise.all([exerciseQuery.refetch(), attemptsQuery.refetch()]);

  const header = (
    <Stack.Screen
      options={{ title: exerciseQuery.data?.title ?? t('exerciseFallbackTitle'), headerRight: () => null }}
    />
  );

  if (exerciseQuery.isPending || attemptsQuery.isPending) {
    if (!online) {
      return (
        <ScreenScrollView>
          {header}
          <ConnectionRequired hasDraft={draft !== null} onRetry={retry} />
        </ScreenScrollView>
      );
    }

    return (
      <ScreenScrollView scrollEnabled={false}>
        {header}
        <SkeletonGroup style={styles.skeletonHeading}>
          <Skeleton width={52} height={52} radius={RADII.input} />
          <Skeleton height={26} width="80%" radius={RADII.xs} />
          <Skeleton height={26} width="50%" radius={RADII.xs} />
        </SkeletonGroup>
        <SkeletonList count={3} media="thumbnail" lines={1} />
      </ScreenScrollView>
    );
  }

  if (exerciseQuery.isError || attemptsQuery.isError) {
    const error = exerciseQuery.error ?? attemptsQuery.error;

    return (
      <ScreenScrollView>
        {header}
        {online ? (
          <Empty>
            <EmptyMedia icon={FileMagnifyingGlassIcon} />
            <EmptyTitle>{t('loadErrorTitle')}</EmptyTitle>
            <EmptyDescription>{errorMessage(error)}</EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onPress={retry}>
                <ButtonText>{tc('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ConnectionRequired hasDraft={draft !== null} onRetry={retry} />
        )}
      </ScreenScrollView>
    );
  }

  const exercise = exerciseQuery.data;
  const summary = attemptsQuery.data;
  const attempts = summary.attempts;
  const validDraft = draftIsStale ? null : draft;
  const canTake = attempts.length === 0 || summary.canRetake;
  const fallbackMode: Mode = validDraft && canTake ? 'taking' : attempts.length > 0 ? 'result' : 'intro';
  const mode = chosenMode === 'taking' && !canTake ? 'result' : (chosenMode ?? fallbackMode);

  const startAttempt = (fresh: boolean) => {
    if (fresh && userId) {
      void clearExerciseDraft(userId, exerciseId);
      setDraft(null);
    }
    setSessionKey((key) => key + 1);
    setChosenMode('taking');
  };

  if (mode === 'taking' && userId) {
    return (
      <ExerciseSession
        key={sessionKey}
        courseId={courseId}
        exerciseId={exerciseId}
        exercise={exercise}
        userId={userId}
        baseAttemptCount={attempts.length}
        initialDraft={validDraft}
      >
        <Stack.Screen options={{ title: exercise.title }} />
        <ExerciseTake
          onSubmitted={() => {
            void clearExerciseDraft(userId, exerciseId);
            setDraft(null);
            setAttemptIndex(null);
            setChosenMode('result');
          }}
        />
      </ExerciseSession>
    );
  }

  const shownIndex = Math.min(attemptIndex ?? attempts.length - 1, attempts.length - 1);
  const attempt = attempts[shownIndex];

  if (mode === 'result' && attempt) {
    const isLatest = shownIndex === attempts.length - 1;

    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenScrollView onRefresh={() => attemptsQuery.refetch()}>
          {header}
          <AttemptSwitcher index={shownIndex} total={attempts.length} onChange={setAttemptIndex} />
          <ResultSummary key={attempt.id} attempt={attempt} summary={summary} isLatest={isLatest} />
          <ResultFeedback feedback={attempt.feedback} />
          <ResultBreakdown attempt={attempt} questions={activeQuestionsOf(exercise)} />
        </ScreenScrollView>
        <CourseActionBar>
          <ResultActions
            canRetake={summary.canRetake}
            isLatest={isLatest}
            onRetake={() => startAttempt(true)}
            onDone={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        </CourseActionBar>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenScrollView>
        {header}
        <ExerciseIntro exercise={exercise} />
      </ScreenScrollView>
      <CourseActionBar>
        <ExerciseIntroStart exercise={exercise} onStart={() => startAttempt(false)} />
      </CourseActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  skeletonHeading: { gap: SPACING.md }
});
