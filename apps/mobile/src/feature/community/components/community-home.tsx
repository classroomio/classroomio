import { router, Stack } from 'expo-router';
import { CircleAlert, MessagesSquare, Search, SquarePen } from 'lucide-react-native';
import { useDeferredValue, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { HeaderIconButton } from '@/feature/common/components/header-icon-button';
import { OfflineNotice } from '@/feature/common/components/offline-notice';
import { ScreenScrollView } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useCommunityQuestionsQuery } from '@/feature/community/api/community-questions';
import { coursesWithQuestions } from '@/feature/community/helpers/course-filter';
import { searchQuestions } from '@/feature/community/helpers/question-search';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityQuestionSummary } from '@/feature/community/types/community';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';

import { CourseFilter, CourseFilterSheet, CourseFilterTrigger } from './course-filter';
import { QuestionActions } from './question-actions';
import { QuestionList, QuestionListEmpty } from './question-list';

function openQuestion(question: CommunityQuestionSummary) {
  if (!question.slug) return;

  router.push({ pathname: '/community/[slug]', params: { slug: question.slug } });
}

export function CommunityHome() {
  const { org, isStaff } = useActiveOrg();
  const t = useTranslations(communityCatalog);
  if (!isStaff && org?.customization?.dashboard?.community === false) {
    return (
      <ScreenScrollView>
        <Empty>
          <EmptyMedia icon={MessagesSquare} />
          <EmptyTitle>{t('turnedOffTitle')}</EmptyTitle>
          <EmptyDescription>{t('turnedOffDescription')}</EmptyDescription>
        </Empty>
      </ScreenScrollView>
    );
  }

  return (
    <QuestionActions>
      <CommunityQuestions />
    </QuestionActions>
  );
}

function CommunityQuestions() {
  const t = useTranslations(communityCatalog);
  const tc = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const locale = useLocale();
  const questions = useCommunityQuestionsQuery();
  const offline = useIsOffline();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim());
  const all = questions.data ?? [];
  const courses = coursesWithQuestions(all, t('untitledCourse'));
  const activeCourseId = courses.some((course) => course.id === courseId) ? courseId : null;
  const inCourse = activeCourseId ? all.filter((question) => question.courseId === activeCourseId) : all;
  const visible = searchQuestions(inCourse, query, locale);
  const failedWithoutData = questions.isError && !questions.data;

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: t('searchPlaceholder'),
            tintColor: colors.primary,
            textColor: colors.ink,
            hintTextColor: colors.inkSubtle,
            headerIconColor: colors.inkMuted,
            autoCapitalize: 'none',
            onChangeText: (event) => setSearch(event.nativeEvent.text),
            onCancelButtonPress: () => setSearch('')
          },
          headerRight: () => (
            <HeaderIconButton
              icon={SquarePen}
              accessibilityLabel={offline ? t('askQuestionOffline') : t('askQuestion')}
              disabled={offline}
              onPress={() => router.push('/community/ask')}
            />
          )
        }}
      />
      <QuestionList
        questions={visible}
        loading={questions.isPending && !failedWithoutData}
        refreshing={questions.isRefetching}
        onRefresh={() => void questions.refetch()}
        onOpen={openQuestion}
        header={
          <View style={styles.header}>
            {offline ? <OfflineNotice description={t('offlineList')} /> : null}
            {questions.isError && questions.data && !offline ? (
              <Banner tone="danger">
                <BannerIcon icon={CircleAlert} />
                <BannerContent>
                  <BannerTitle>{t('refreshFailed')}</BannerTitle>
                  <BannerDescription>{errorMessage(questions.error)}</BannerDescription>
                </BannerContent>
              </Banner>
            ) : null}
            {all.length > 0 ? (
              <CourseFilter courseId={activeCourseId} onCourseChange={setCourseId} courses={courses}>
                <View style={styles.filterRow}>
                  <CourseFilterTrigger />
                  <Text variant="caption" tone="muted">
                    {t('questionCount', { count: visible.length })}
                  </Text>
                </View>
                <CourseFilterSheet />
              </CourseFilter>
            ) : null}
          </View>
        }
        empty={
          failedWithoutData ? (
            <Empty>
              <EmptyMedia icon={CircleAlert} />
              <EmptyTitle>{t('loadFailed')}</EmptyTitle>
              <EmptyDescription>{errorMessage(questions.error)}</EmptyDescription>
              <EmptyContent>
                <Button variant="outline" onPress={() => void questions.refetch()}>
                  <ButtonText>{tc('retry')}</ButtonText>
                </Button>
              </EmptyContent>
            </Empty>
          ) : query && inCourse.length > 0 ? (
            <Empty>
              <EmptyMedia icon={Search} />
              <EmptyTitle>{t('searchEmptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('searchEmptyDescription', { query })}</EmptyDescription>
            </Empty>
          ) : (
            <QuestionListEmpty filtered={activeCourseId !== null} />
          )
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: SPACING.sm, paddingBottom: SPACING.sm },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm }
});
