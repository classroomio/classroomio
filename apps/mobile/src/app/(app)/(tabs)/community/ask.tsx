import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { withModalSafeArea } from '@/feature/common/components/modal-safe-area';
import { Skeleton } from '@/feature/common/components/skeleton';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useAskableCoursesQuery } from '@/feature/community/api/askable-courses';
import { useAskQuestionMutation } from '@/feature/community/api/community-mutations';
import { communityCatalog } from '@/feature/community/translations/catalog';
import {
  QuestionForm,
  QuestionFormBody,
  QuestionFormCourse,
  QuestionFormImages,
  QuestionFormSubmit,
  QuestionFormTitle
} from '@/feature/community/components/question-form';
import { QuestionFormLayout } from '@/feature/community/components/question-form-layout';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';

function AskQuestionScreen() {
  const courses = useAskableCoursesQuery();
  const ask = useAskQuestionMutation();
  const offline = useIsOffline();
  const t = useTranslations(communityCatalog);

  return (
    <QuestionFormLayout offlineDescription={t('askOffline')}>
      {courses.isPending ? (
        <View style={styles.skeleton}>
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={190} />
        </View>
      ) : (
        <QuestionForm
          courses={courses.data ?? []}
          submitting={ask.isPending}
          disabled={offline}
          onSubmit={({ title, body, courseId }) =>
            ask.mutate(
              { title, body, courseId },
              {
                onSuccess: (question) => {
                  successHaptic();
                  showToast({ title: t('questionPosted'), tone: 'success' });
                  router.back();
                  if (question.slug) router.push({ pathname: '/community/[slug]', params: { slug: question.slug } });
                },
                onError: (error) =>
                  showToast({ title: t('questionPostFailed'), description: errorMessage(error), tone: 'danger' })
              }
            )
          }
        >
          <QuestionFormCourse />
          <QuestionFormTitle />
          <QuestionFormBody />
          <QuestionFormImages />
          <QuestionFormSubmit>{t('post')}</QuestionFormSubmit>
        </QuestionForm>
      )}
    </QuestionFormLayout>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: SPACING.md }
});

export default withModalSafeArea(AskQuestionScreen);
