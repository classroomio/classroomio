import { Stack } from 'expo-router';
import { Check, CloudOff, Upload } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
  type KeyboardAwareScrollViewRef
} from 'react-native-keyboard-controller';
import Animated, { Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { warningHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useSubmitExerciseMutation } from '@/feature/exercise/api/exercise';
import { useExerciseSession } from '@/feature/exercise/components/exercise-session';
import { QuestionRenderer } from '@/feature/exercise/components/question-renderer';
import {
  QuestionBody,
  QuestionDescription,
  QuestionHeader,
  QuestionMedia,
  QuestionProblem,
  QuestionShell
} from '@/feature/exercise/components/question-shell';
import { ScrollLock } from '@/feature/exercise/components/scroll-lock';
import { toSubmissionAnswer } from '@/feature/exercise/helpers/answer-payload';
import { answerProblemOf, hasAnswerValue } from '@/feature/exercise/helpers/answer-state';
import { questionKeyOf } from '@/feature/exercise/helpers/question-model';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const FOOTER_HEIGHT = 120;

const QUESTION_SHIFT = 16;

const enterFromRight = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: QUESTION_SHIFT }] },
  100: { opacity: 1, transform: [{ translateX: 0 }], easing: EASE_OUT }
}).duration(200);

const enterFromLeft = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: -QUESTION_SHIFT }] },
  100: { opacity: 1, transform: [{ translateX: 0 }], easing: EASE_OUT }
}).duration(200);

const exitQuestion = new Keyframe({
  0: { opacity: 1 },
  100: { opacity: 0, easing: EASE_OUT }
}).duration(DURATION.press);

type ExerciseTakeProps = { onSubmitted: () => void };

export function ExerciseTake({ onSubmitted }: ExerciseTakeProps) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const tc = useTranslations(commonCatalog);
  const insets = useSafeAreaInsets();
  const session = useExerciseSession();
  const { courseId, exerciseId, exercise, questions, answers, currentIndex, setCurrentIndex, showProblems } = session;
  const online = !useIsOffline();
  const submit = useSubmitExerciseMutation(courseId, exerciseId);
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const problems = Object.fromEntries(
    questions.map((item) => [questionKeyOf(item), answerProblemOf(item, answers[questionKeyOf(item)], t)])
  );
  const unansweredRequired = questions.filter((item) => problems[questionKeyOf(item)] !== null).length;
  const answeredCount = questions.filter((item) => hasAnswerValue(answers[questionKeyOf(item)])).length;

  const goTo = (index: number) => {
    setDirection(index >= currentIndex ? 'forward' : 'back');
    setCurrentIndex(index);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const requestSubmit = () => {
    const firstProblem = questions.findIndex((item) => problems[questionKeyOf(item)] !== null);
    if (firstProblem >= 0) {
      warningHaptic();
      session.setShowProblems(true);
      goTo(firstProblem);
      showToast({
        tone: 'warning',
        title: t('questionsNeedAttention', { count: unansweredRequired })
      });
      return;
    }

    setConfirmOpen(true);
  };

  const confirmSubmit = () => {
    const payload = questions.flatMap((item) => {
      const answer = answers[questionKeyOf(item)];

      return hasAnswerValue(answer) ? [toSubmissionAnswer(answer, Number(item.id))] : [];
    });

    if (payload.length === 0) {
      setConfirmOpen(false);
      showToast({ tone: 'warning', title: t('answerAtLeastOne') });
      return;
    }

    submit.mutate(payload, {
      onSuccess: () => {
        setConfirmOpen(false);
        onSubmitted();
      },
      onError: (error) => {
        setConfirmOpen(false);
        showToast({ tone: 'danger', title: t('submitFailed'), description: errorMessage(error) });
      }
    });
  };

  if (!question) return null;

  const blocker = !online
    ? { icon: CloudOff, text: t('offlineBlocker') }
    : session.isUploading
      ? { icon: Upload, text: t('uploadBlocker') }
      : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerRight: () => <SavedIndicator savedAt={session.savedAt} /> }} />
      <ScrollLock>
        {(locked) => (
          <KeyboardAwareScrollView
            ref={scrollRef}
            bottomOffset={FOOTER_HEIGHT}
            scrollEnabled={!locked}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.content, { paddingBottom: FOOTER_HEIGHT + insets.bottom + SPACING.xl }]}
          >
            <ProgressSegments
              total={questions.length}
              current={currentIndex}
              isAnswered={(index) => {
                const item = questions[index];

                return item ? hasAnswerValue(answers[questionKeyOf(item)]) : false;
              }}
            />
            <Animated.View
              key={currentIndex}
              entering={direction === 'forward' ? enterFromRight : enterFromLeft}
              exiting={exitQuestion}
            >
              <QuestionShell
                question={question}
                number={currentIndex + 1}
                total={questions.length}
                problem={showProblems ? (problems[questionKeyOf(question)] ?? null) : null}
              >
                <QuestionHeader />
                <QuestionDescription />
                <QuestionMedia />
                <QuestionBody>
                  <QuestionRenderer question={question} />
                </QuestionBody>
                <QuestionProblem />
              </QuestionShell>
            </Animated.View>
          </KeyboardAwareScrollView>
        )}
      </ScrollLock>

      <KeyboardStickyView offset={{ opened: insets.bottom }}>
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + SPACING.sm
            }
          ]}
        >
          {blocker && (
            <View style={styles.blocker}>
              <Icon icon={blocker.icon} size={16} tone="warning" />
              <Text variant="caption" tone="muted" style={styles.blockerText}>
                {blocker.text}
              </Text>
            </View>
          )}
          <View style={styles.actions}>
            <Button
              variant="outline"
              size="lg"
              style={styles.back}
              disabled={currentIndex === 0}
              onPress={() => goTo(currentIndex - 1)}
            >
              <ButtonText>{tc('back')}</ButtonText>
            </Button>
            {isLast ? (
              <Button size="lg" style={styles.next} disabled={Boolean(blocker)} onPress={requestSubmit}>
                <ButtonText>{t('submitAnswers')}</ButtonText>
              </Button>
            ) : (
              <Button size="lg" style={styles.next} onPress={() => goTo(currentIndex + 1)}>
                <ButtonText>{t('nextQuestion')}</ButtonText>
              </Button>
            )}
          </View>
        </View>
      </KeyboardStickyView>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen} busy={submit.isPending}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('confirmSubmitTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {[
              answeredCount < questions.length
                ? t('confirmAnsweredCount', { count: questions.length, answered: answeredCount })
                : null,
              t(exercise.allowMultipleAttempts ? 'confirmSubmitMultiple' : 'confirmSubmitSingle')
            ]
              .filter(Boolean)
              .join(' ')}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction loading={submit.isPending} onPress={confirmSubmit}>
              {t('submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

function SavedIndicator({ savedAt }: { savedAt: number | null }) {
  const t = useTranslations(exerciseCatalog);
  if (!savedAt) return null;

  return (
    <View style={styles.saved} accessibilityLabel={t('savedAccessibilityLabel')}>
      <Icon icon={Check} size={14} tone="muted" />
      <Text variant="caption" tone="muted">
        {t('saved')}
      </Text>
    </View>
  );
}

type ProgressSegmentsProps = { total: number; current: number; isAnswered: (index: number) => boolean };

function ProgressSegments({ total, current, isAnswered }: ProgressSegmentsProps) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const answered = Array.from({ length: total }, (_, index) => isAnswered(index)).filter(Boolean).length;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t('progressAccessibilityLabel', { current: current + 1, total, answered })}
      style={styles.segments}
    >
      {Array.from({ length: total }, (_, index) => {
        const done = isAnswered(index);
        const isCurrent = index === current;

        return (
          <Animated.View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor: isCurrent ? colors.primary : done ? colors.ring : colors.sandStrong,
                transitionProperty: 'backgroundColor',
                transitionDuration: DURATION.fast
              }
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.sm, gap: SPACING.lg },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 4, borderRadius: RADII.xs },
  footer: {
    gap: SPACING.xs,
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth * 2
  },
  blocker: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  blockerText: { flex: 1 },
  actions: { flexDirection: 'row', gap: SPACING.xs },
  back: { flex: 1 },
  next: { flex: 2 },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 4 }
});
