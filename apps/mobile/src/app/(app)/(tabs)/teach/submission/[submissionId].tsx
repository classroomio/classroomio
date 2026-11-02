import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { FileXIcon } from 'phosphor-react-native/src/icons/FileX';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { withModalSafeArea } from '@/feature/common/components/modal-safe-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Skeleton } from '@/feature/common/components/skeleton';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';
import {
  useDeleteSubmissionMutation,
  useGradingQueueQuery,
  useGradingSubmissionQuery,
  useSaveGradesMutation
} from '@/feature/teach/api/grading-queue';
import {
  GradingFeedbackField,
  GradingForm,
  GradingQuestion,
  GradingQuestionAnswer,
  GradingQuestionHeader,
  GradingQuestionScore,
  GradingSaveBar
} from '@/feature/teach/components/grading-form';
import { SubmissionHeader } from '@/feature/teach/components/submission-header';
import type { GradingFormState } from '@/feature/teach/helpers/use-grading-form';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { GradingSubmission } from '@/feature/teach/types/teach';

const SAVE_BAR_HEIGHT = 84;

function SubmissionReview({ submission }: { submission: GradingSubmission }) {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const queue = useGradingQueueQuery();
  const saveGrades = useSaveGradesMutation();
  const deleteSubmission = useDeleteSubmissionMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const learner = submission.student?.fullname || null;
  const next = queue.data?.find((item) => item.id !== submission.id) ?? null;

  const goToNextOrBack = () => {
    if (next) {
      router.replace({ pathname: '/teach/submission/[submissionId]', params: { submissionId: next.id } });
      return;
    }

    router.back();
  };

  const save = (form: GradingFormState) => {
    if (form.firstInvalid) {
      form.setShowErrors(true);
      showToast({
        tone: 'warning',
        title: t('scoreEveryQuestionTitle'),
        description: t('scoreEveryQuestionDescription')
      });
      return;
    }

    const grades = form.toGrades();
    saveGrades.mutate(
      { submission, grades },
      {
        onSuccess: () => {
          const score = { total: grades.total, max: form.maxPoints };
          showToast({
            tone: 'success',
            title: t('gradeSaved'),
            description: learner
              ? t('gradeSavedDescription', { learner, ...score })
              : t('gradeSavedDescriptionNoName', score)
          });
          goToNextOrBack();
        },
        onError: (error) => showToast({ tone: 'danger', title: t('gradeNotSaved'), description: errorMessage(error) })
      }
    );
  };

  const confirmDelete = () => {
    deleteSubmission.mutate(submission, {
      onSuccess: () => {
        setConfirmingDelete(false);
        showToast({ tone: 'success', title: t('submissionDeleted') });
        goToNextOrBack();
      },
      onError: (error) => {
        setConfirmingDelete(false);
        showToast({ tone: 'danger', title: t('submissionNotDeleted'), description: errorMessage(error) });
      }
    });
  };

  const questions = [...submission.questions].sort((first, second) => first.order - second.order);

  return (
    <GradingForm key={submission.id} submission={submission}>
      <Stack.Screen options={{ title: learner ?? common('titleSubmission') }} />
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <KeyboardAwareScrollView
          bottomOffset={SAVE_BAR_HEIGHT + SPACING.md}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.content}
        >
          <SubmissionHeader submission={submission} />

          {questions.map((question, index) => (
            <GradingQuestion key={question.id} question={question} number={index + 1}>
              <GradingQuestionHeader />
              <GradingQuestionAnswer />
              <GradingQuestionScore />
            </GradingQuestion>
          ))}

          <GradingFeedbackField />

          <Button variant="ghost" onPress={() => setConfirmingDelete(true)} style={styles.delete}>
            <ButtonIcon icon={TrashIcon} />
            <ButtonText>{t('deleteSubmission')}</ButtonText>
          </Button>
        </KeyboardAwareScrollView>

        <GradingSaveBar label={next ? t('saveAndNext') : t('saveGrade')} saving={saveGrades.isPending} onSave={save} />
      </View>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete} busy={deleteSubmission.isPending}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('deleteSubmissionTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {learner
              ? t('deleteSubmissionDescription', { learner, exercise: submission.exerciseTitle })
              : t('deleteSubmissionDescriptionNoName', { exercise: submission.exerciseTitle })}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant="destructive" loading={deleteSubmission.isPending} onPress={confirmDelete}>
              {common('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GradingForm>
  );
}

function SubmissionScreen() {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const submission = useGradingSubmissionQuery(submissionId ?? '');

  if (submission.isPending) {
    return (
      <View style={[styles.fill, styles.loading, { backgroundColor: colors.background }]}>
        <Skeleton height={56} />
        <Skeleton height={220} radius={14} />
        <Skeleton height={180} radius={14} />
      </View>
    );
  }

  if (submission.isError) {
    return (
      <View style={[styles.fill, styles.centered, { backgroundColor: colors.background }]}>
        <Empty>
          <EmptyMedia icon={FileXIcon} />
          <EmptyTitle>{t('submissionLoadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(submission.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={() => submission.refetch()}>
              <ButtonIcon icon={ArrowsClockwiseIcon} />
              <ButtonText>{common('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      </View>
    );
  }

  return <SubmissionReview submission={submission.data} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loading: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, gap: SPACING.md },
  centered: { justifyContent: 'center' },
  content: {
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.lg,
    paddingBottom: SAVE_BAR_HEIGHT + SPACING.xl,
    gap: SPACING.lg
  },
  delete: { alignSelf: 'center' }
});

export default withModalSafeArea(SubmissionScreen);
