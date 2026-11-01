import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Skeleton } from '@/feature/common/components/skeleton';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useAskableCoursesQuery } from '@/feature/community/api/askable-courses';
import { useCommunityQuestionQuery } from '@/feature/community/api/community-question';
import { useUpdateQuestionMutation } from '@/feature/community/api/community-mutations';
import { communityCatalog } from '@/feature/community/translations/catalog';
import {
  QuestionForm,
  QuestionFormBody,
  QuestionFormCourse,
  QuestionFormFormattingNotice,
  QuestionFormImages,
  QuestionFormSubmit,
  QuestionFormTitle
} from '@/feature/community/components/question-form';
import { QuestionFormLayout } from '@/feature/community/components/question-form-layout';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';

export default function EditQuestionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const question = useCommunityQuestionQuery(slug);
  const courses = useAskableCoursesQuery();
  const update = useUpdateQuestionMutation(question.data);
  const offline = useIsOffline();
  const t = useTranslations(communityCatalog);
  const tc = useTranslations(commonCatalog);
  const data = question.data;
  const courseOptions = courses.data ?? [];
  const options =
    data && !courseOptions.some((course) => course.id === data.courseId)
      ? [{ id: data.courseId, title: data.courseTitle ?? t('currentCourse') }, ...courseOptions]
      : courseOptions;

  return (
    <QuestionFormLayout offlineDescription={t('editOffline')}>
      {!data && question.isError ? (
        <Empty>
          <EmptyMedia icon={WarningCircleIcon} />
          <EmptyTitle>{t('questionLoadFailed')}</EmptyTitle>
          <EmptyDescription>{errorMessage(question.error)}</EmptyDescription>
        </Empty>
      ) : !data || courses.isPending ? (
        <View style={styles.skeleton}>
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={190} />
        </View>
      ) : (
        <QuestionForm
          initial={{ title: data.title, body: data.body, courseId: data.courseId }}
          courses={options}
          submitting={update.isPending}
          disabled={offline}
          onSubmit={(values) =>
            update.mutate(values, {
              onSuccess: () => {
                successHaptic();
                showToast({ title: t('questionUpdated'), tone: 'success' });
                router.back();
              },
              onError: (error) =>
                showToast({ title: t('changesNotSaved'), description: errorMessage(error), tone: 'danger' })
            })
          }
        >
          <QuestionFormFormattingNotice />
          <QuestionFormCourse />
          <QuestionFormTitle />
          <QuestionFormBody />
          <QuestionFormImages />
          <QuestionFormSubmit>{tc('save')}</QuestionFormSubmit>
        </QuestionForm>
      )}
    </QuestionFormLayout>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: SPACING.md }
});
