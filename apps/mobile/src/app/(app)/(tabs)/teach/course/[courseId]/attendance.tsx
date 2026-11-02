import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CalendarXIcon } from 'phosphor-react-native/src/icons/CalendarX';
import { UserMinusIcon } from 'phosphor-react-native/src/icons/UserMinus';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { withModalSafeArea } from '@/feature/common/components/modal-safe-area';
import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useTeachCourseQuery } from '@/feature/teach/api/teach-course';
import {
  AttendanceBulkActions,
  AttendanceCheckInItem,
  AttendanceRoster,
  AttendanceRows,
  AttendanceSearch,
  AttendanceSessionPicker,
  AttendanceSummary
} from '@/feature/teach/components/attendance-roster';
import { defaultSessionOf, learnerName, sessionsOf } from '@/feature/teach/helpers/use-attendance-roster';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { TeachCourse } from '@/feature/teach/types/teach';

const SEARCH_THRESHOLD = 8;

function AttendanceSheet({ course, initialSessionId }: { course: TeachCourse; initialSessionId?: string }) {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const sessions = sessionsOf(course);
  const [sessionId, setSessionId] = useState(
    () => sessions.find((session) => session.id === initialSessionId)?.id ?? defaultSessionOf(sessions)?.id ?? null
  );
  const [search, setSearch] = useState('');
  const session = sessions.find((candidate) => candidate.id === sessionId) ?? null;

  if (sessions.length === 0) {
    return (
      <View style={[styles.fill, styles.centered, { backgroundColor: colors.background }]}>
        <Empty>
          <EmptyMedia icon={CalendarXIcon} />
          <EmptyTitle>{t('noSessionsTitle')}</EmptyTitle>
          <EmptyDescription>{t('noSessionsDescription')}</EmptyDescription>
        </Empty>
      </View>
    );
  }

  const reportSaveError = (error: unknown, marks: unknown[], retry: () => void) =>
    showToast({
      tone: 'danger',
      title: t('marksNotSaved', { count: marks.length }),
      description: errorMessage(error),
      action: { label: common('retry'), onPress: retry }
    });

  return (
    <AttendanceRoster course={course} session={session} onSaveError={reportSaveError}>
      {(roster) => {
        const query = search.trim().toLowerCase();
        const visible = query
          ? roster.learners.filter((learner) => (learnerName(learner) ?? '').toLowerCase().includes(query))
          : roster.learners;

        return (
          <KeyboardAwareScrollView
            bottomOffset={SPACING.xl}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.content}
          >
            <View style={styles.section}>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {course.title}
              </Text>
              <ItemGroup>
                <AttendanceSessionPicker sessions={sessions} onSelect={(next) => setSessionId(next.id)} />
                <AttendanceCheckInItem />
              </ItemGroup>
            </View>

            {roster.learners.length === 0 ? (
              <Empty>
                <EmptyMedia icon={UserMinusIcon} />
                <EmptyTitle>{t('noLearnersEnrolledTitle')}</EmptyTitle>
                <EmptyDescription>{t('noLearnersEnrolledDescription')}</EmptyDescription>
              </Empty>
            ) : (
              <>
                <AttendanceSummary />
                <View style={styles.section}>
                  <AttendanceBulkActions />
                  {roster.learners.length > SEARCH_THRESHOLD && (
                    <AttendanceSearch value={search} onChangeText={setSearch} />
                  )}
                  {visible.length === 0 ? (
                    <Text variant="caption" tone="muted">
                      {t('noLearnerMatches', { query: search.trim() })}
                    </Text>
                  ) : (
                    <AttendanceRows learners={visible} />
                  )}
                  <Text variant="caption" tone="muted">
                    {t('attendanceHint')}
                  </Text>
                </View>
              </>
            )}
          </KeyboardAwareScrollView>
        );
      }}
    </AttendanceRoster>
  );
}

function AttendanceScreen() {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const { courseId = '', lessonId } = useLocalSearchParams<{ courseId: string; lessonId?: string }>();
  const course = useTeachCourseQuery(courseId);

  if (course.isPending) {
    return (
      <View style={[styles.fill, styles.loading, { backgroundColor: colors.background }]}>
        <Skeleton height={128} radius={RADII.xl} />
        <Skeleton height={124} radius={RADII.xl} />
        <Skeleton height={320} radius={RADII.xl} />
      </View>
    );
  }

  if (course.isError) {
    return (
      <View style={[styles.fill, styles.centered, { backgroundColor: colors.background }]}>
        <Empty>
          <EmptyMedia icon={CalendarXIcon} />
          <EmptyTitle>{t('rosterLoadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(course.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={() => course.refetch()}>
              <ButtonIcon icon={ArrowsClockwiseIcon} />
              <ButtonText>{common('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      </View>
    );
  }

  return (
    // The native modal covers the root sheet host, so this screen hosts its own sheets.
    <BottomSheetModalProvider>
      <AttendanceSheet course={course.data} initialSessionId={lessonId} />
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { justifyContent: 'center' },
  loading: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, gap: SPACING.md },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  section: { gap: SPACING.sm }
});

export default withModalSafeArea(AttendanceScreen);
