import { ChatsCircleIcon } from 'phosphor-react-native/src/icons/ChatsCircle';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { NotePencilIcon } from 'phosphor-react-native/src/icons/NotePencil';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { router, Stack } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { HeaderIconButton } from '@/feature/common/components/header-icon-button';
import { OfflineNotice } from '@/feature/common/components/offline-notice';
import { ScreenScrollView } from '@/feature/common/components/screen';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useCommunityForYouQuery } from '@/feature/community/api/community-for-you';
import { useCommunityQuestionsQuery } from '@/feature/community/api/community-questions';
import { coursesWithQuestions } from '@/feature/community/helpers/course-filter';
import { searchQuestions } from '@/feature/community/helpers/question-search';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type {
  CommunityListQuestion,
  CommunityQuestionSummary,
  CommunitySegment
} from '@/feature/community/types/community';
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
          <EmptyMedia icon={ChatsCircleIcon} />
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
  const forYou = useCommunityForYouQuery();
  const offline = useIsOffline();
  const [segment, setSegment] = useState<CommunitySegment>('all');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim());
  const active = segment === 'all' ? questions : forYou;
  const all = questions.data ?? [];
  const followed = forYou.data ?? [];
  const source: CommunityListQuestion[] = active.data ?? [];
  const courses = coursesWithQuestions([...all, ...followed], t('untitledCourse'));
  const activeCourseId = courses.some((course) => course.id === courseId) ? courseId : null;
  const inCourse = activeCourseId ? source.filter((question) => question.courseId === activeCourseId) : source;
  const visible = searchQuestions(inCourse, query, locale);
  const failedWithoutData = active.isError && !active.data;
  const hasQuestions = all.length > 0 || followed.length > 0;

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
              icon={NotePencilIcon}
              accessibilityLabel={offline ? t('askQuestionOffline') : t('askQuestion')}
              disabled={offline}
              onPress={() => router.push('/community/ask')}
            />
          )
        }}
      />
      <QuestionList
        questions={visible}
        loading={active.isPending && !failedWithoutData}
        onRefresh={() => Promise.all([questions.refetch(), forYou.refetch()])}
        onOpen={openQuestion}
        header={
          <View style={styles.header}>
            {offline ? <OfflineNotice description={t('offlineList')} /> : null}
            {active.isError && active.data && !offline ? (
              <Banner tone="danger">
                <BannerIcon icon={WarningCircleIcon} />
                <BannerContent>
                  <BannerTitle>{t('refreshFailed')}</BannerTitle>
                  <BannerDescription>{errorMessage(active.error)}</BannerDescription>
                </BannerContent>
              </Banner>
            ) : null}
            {hasQuestions ? (
              <SegmentedControl value={segment} onValueChange={setSegment}>
                <SegmentedControlItem value="all">{t('segmentAll')}</SegmentedControlItem>
                <SegmentedControlItem value="for-you">{t('segmentForYou')}</SegmentedControlItem>
              </SegmentedControl>
            ) : null}
            {hasQuestions ? (
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
              <EmptyMedia icon={WarningCircleIcon} />
              <EmptyTitle>{t('loadFailed')}</EmptyTitle>
              <EmptyDescription>{errorMessage(active.error)}</EmptyDescription>
              <EmptyContent>
                <Button variant="outline" onPress={() => active.refetch()}>
                  <ButtonText>{tc('retry')}</ButtonText>
                </Button>
              </EmptyContent>
            </Empty>
          ) : query && inCourse.length > 0 ? (
            <Empty>
              <EmptyMedia icon={MagnifyingGlassIcon} />
              <EmptyTitle>{t('searchEmptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('searchEmptyDescription', { query })}</EmptyDescription>
            </Empty>
          ) : (
            <QuestionListEmpty segment={segment} filtered={activeCourseId !== null} />
          )
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: SPACING.sm + 2, paddingBottom: SPACING.sm },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm }
});
