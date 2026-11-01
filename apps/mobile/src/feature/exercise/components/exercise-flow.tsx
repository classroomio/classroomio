import { router, Stack } from 'expo-router';
import { FileQuestion } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ScreenScrollView } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useExerciseAttemptsQuery, useExerciseQuery } from '@/feature/exercise/api/exercise';
import { ConnectionRequired } from '@/feature/exercise/components/connection-required';
import { ExerciseIntro } from '@/feature/exercise/components/exercise-intro';
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

  const retry = () => {
    void exerciseQuery.refetch();
    void attemptsQuery.refetch();
  };

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
      <ScreenScrollView>
        {header}
        <Skeleton height={190} radius={RADII.md} />
        <Skeleton height={20} width="80%" />
        <Skeleton height={20} width="60%" />
        <Skeleton height={52} radius={RADII.md} />
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
            <EmptyMedia icon={FileQuestion} />
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
    return (
      <ScreenScrollView refreshing={attemptsQuery.isRefetching} onRefresh={() => void attemptsQuery.refetch()}>
        {header}
        <AttemptSwitcher index={shownIndex} total={attempts.length} onChange={setAttemptIndex} />
        <ResultSummary attempt={attempt} summary={summary} />
        <ResultFeedback feedback={attempt.feedback} />
        <ResultBreakdown attempt={attempt} questions={activeQuestionsOf(exercise)} />
        <View style={styles.actions}>
          <ResultActions
            canRetake={summary.canRetake}
            isLatest={shownIndex === attempts.length - 1}
            onRetake={() => startAttempt(true)}
            onDone={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView style={{ backgroundColor: colors.background }}>
      {header}
      <ExerciseIntro exercise={exercise} onStart={() => startAttempt(false)} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: SPACING.xs }
});
