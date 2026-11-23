import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { PathIcon } from 'phosphor-react-native/src/icons/Path';
import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { Progress } from '@/feature/common/components/progress';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { CourseActionBar } from '@/feature/course/components/course-action-bar';
import { CourseBanner } from '@/feature/course/components/course-banner';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useEnrollPathMutation, useLearnerPathQuery } from '@/feature/learning-path/api/learning-paths';
import { PathCourseRow } from '@/feature/learning-path/components/path-course-row';
import { pathProgressLabel } from '@/feature/learning-path/helpers/path-copy';
import { learningPathCatalog } from '@/feature/learning-path/translations/catalog';
import { showToast } from '@/feature/toast/helpers/toast-store';

/** A learning path: its courses in order with each one's state, and Join or Continue. */
export function PathDetail({ pathId }: { pathId: string }) {
  const t = useTranslations(learningPathCatalog);
  const tc = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const path = useLearnerPathQuery(pathId);
  const enroll = useEnrollPathMutation(pathId);
  const data = path.data;

  if (path.isPending) {
    return (
      <ScreenScrollView scrollEnabled={false}>
        <Skeleton height={200} radius={RADII.xl} />
        <Skeleton height={28} radius={RADII.sm} />
        <Skeleton height={240} radius={RADII.lg} />
      </ScreenScrollView>
    );
  }

  if (!data) {
    return (
      <ScreenScrollView onRefresh={() => path.refetch()}>
        <Empty>
          <EmptyMedia icon={PathIcon} />
          <EmptyTitle>{t('loadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(path.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={() => path.refetch()}>
              <ButtonText>{common('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      </ScreenScrollView>
    );
  }

  const lessons = data.courses.reduce((total, course) => total + course.lessonCount, 0);
  const meta = [t('courseCount', { count: data.courseCount }), tc('lessonCount', { count: lessons })].join(' · ');
  const next = data.nextCourse;

  const join = () =>
    enroll.mutate(undefined, {
      onSuccess: () => {
        successHaptic();
        showToast({ tone: 'success', title: t('joined', { name: data.name }) });
      },
      onError: (error) => showToast({ tone: 'danger', title: t('joinFailed'), description: errorMessage(error) })
    });

  const action = data.isMember ? (
    next ? (
      <Button
        size="lg"
        onPress={() => router.push({ pathname: '/course/[courseId]', params: { courseId: next.courseId } })}
      >
        <ButtonText>{data.progressPercent > 0 ? common('continue') : t('start')}</ButtonText>
        <ButtonIcon icon={ArrowRightIcon} />
      </Button>
    ) : null
  ) : data.canEnrollInApp ? (
    <Button size="lg" disabled={enroll.isPending} onPress={join}>
      {enroll.isPending ? <ButtonSpinner /> : <ButtonText>{t('join')}</ButtonText>}
    </Button>
  ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: data.name }} />
      <ScreenScrollView onRefresh={() => path.refetch()}>
        <View style={[styles.cover, { borderColor: colors.border }]}>
          <CourseBanner uri={data.coverImage} recyclingKey={data.id} style={StyleSheet.absoluteFill} />
        </View>

        <View style={styles.heading}>
          <Text variant="caption" tone="muted">
            {`${t('pathLabel')} · ${meta}`}
          </Text>
          <Text variant="title" accessibilityRole="header">
            {data.name}
          </Text>
          {data.description ? (
            <Text variant="body" tone="muted">
              {data.description}
            </Text>
          ) : null}
        </View>

        {data.isMember ? (
          <View style={styles.progress}>
            <Text variant="captionStrong">{pathProgressLabel(data, t)}</Text>
            <Progress value={data.progressPercent} />
            {next && !data.completedAt ? (
              <Text variant="caption" tone="muted">
                {t('nextUp', { title: next.title })}
              </Text>
            ) : null}
          </View>
        ) : !data.canEnrollInApp ? (
          <Text variant="caption" tone="muted">
            {t('notJoinableInApp')}
          </Text>
        ) : null}

        <ScreenSection>
          <ScreenSectionHeader title={t('courses')} />
          <Text variant="caption" tone="muted">
            {data.sequentialUnlock ? t('inOrder') : t('anyOrder')}
          </Text>
          <ItemGroup>
            {data.courses.map((course, index) => (
              <PathCourseRow key={course.courseId} course={course} position={index + 1} isMember={data.isMember} />
            ))}
          </ItemGroup>
        </ScreenSection>
      </ScreenScrollView>
      {action ? <CourseActionBar>{action}</CourseActionBar> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: RADII.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden'
  },
  heading: { gap: SPACING.xs },
  progress: { gap: SPACING.xs }
});
