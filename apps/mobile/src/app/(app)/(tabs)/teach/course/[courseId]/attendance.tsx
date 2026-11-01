import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CalendarXIcon } from 'phosphor-react-native/src/icons/CalendarX';
import { UserMinusIcon } from 'phosphor-react-native/src/icons/UserMinus';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useSaveAttendanceMutation } from '@/feature/teach/api/attendance';
import { useTeachCourseQuery } from '@/feature/teach/api/teach-course';
import {
  AttendanceBulkActions,
  AttendanceRoster,
  AttendanceRow,
  AttendanceSaveBar,
  AttendanceSearch,
  AttendanceSessionPicker,
  AttendanceSummary
} from '@/feature/teach/components/attendance-roster';
import { defaultSessionOf, learnerName, sessionsOf } from '@/feature/teach/helpers/use-attendance-roster';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { TeachCourse } from '@/feature/teach/types/teach';

const SAVE_BAR_HEIGHT = 84;

function AttendanceSheet({ course }: { course: TeachCourse }) {
  const t = useTranslations(teachCatalog);
  const { colors } = useTheme();
  const sessions = sessionsOf(course);
  const [sessionId, setSessionId] = useState(() => defaultSessionOf(sessions)?.id ?? null);
  const [search, setSearch] = useState('');
  const saveAttendance = useSaveAttendanceMutation();
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

  return (
    <AttendanceRoster course={course} session={session}>
      {(roster) => {
        const query = search.trim().toLowerCase();
        const visible = query
          ? roster.learners.filter((learner) => (learnerName(learner) ?? '').toLowerCase().includes(query))
          : roster.learners;

        const save = () => {
          if (!session) return;

          saveAttendance.mutate(
            { courseId: course.id, lessonId: session.id, changes: roster.changes },
            {
              onSuccess: ({ saved, failedCount, firstError }) => {
                roster.clearSaved(saved.flatMap((record) => (record.studentId ? [record.studentId] : [])));
                if (failedCount > 0) {
                  showToast({
                    tone: 'warning',
                    title: t('marksNotSaved', { count: failedCount }),
                    description: errorMessage(firstError)
                  });
                  return;
                }

                showToast({ tone: 'success', title: t('attendanceSaved'), description: session.title });
              },
              onError: (error) =>
                showToast({ tone: 'danger', title: t('attendanceNotSaved'), description: errorMessage(error) })
            }
          );
        };

        return (
          <View style={[styles.fill, { backgroundColor: colors.background }]}>
            <KeyboardAwareScrollView
              bottomOffset={SAVE_BAR_HEIGHT + SPACING.md}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              style={{ backgroundColor: colors.background }}
              contentContainerStyle={styles.content}
            >
              <View style={styles.section}>
                <Text variant="caption" tone="muted">
                  {course.title}
                </Text>
                <AttendanceSessionPicker sessions={sessions} onSelect={(next) => setSessionId(next.id)} />
              </View>

              <AttendanceSummary />

              {roster.learners.length === 0 ? (
                <Empty>
                  <EmptyMedia icon={UserMinusIcon} />
                  <EmptyTitle>{t('noLearnersEnrolledTitle')}</EmptyTitle>
                  <EmptyDescription>{t('noLearnersEnrolledDescription')}</EmptyDescription>
                </Empty>
              ) : (
                <View style={styles.section}>
                  <AttendanceBulkActions />
                  {roster.learners.length > 8 && <AttendanceSearch value={search} onChangeText={setSearch} />}
                  {visible.length === 0 ? (
                    <Text variant="caption" tone="muted">
                      {t('noLearnerMatches', { query: search.trim() })}
                    </Text>
                  ) : (
                    <ItemGroup>
                      {visible.map((learner) => (
                        <AttendanceRow key={learner.id} learner={learner} />
                      ))}
                    </ItemGroup>
                  )}
                </View>
              )}
            </KeyboardAwareScrollView>
            <AttendanceSaveBar saving={saveAttendance.isPending} onSave={save} />
          </View>
        );
      }}
    </AttendanceRoster>
  );
}

export default function AttendanceScreen() {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const { courseId = '' } = useLocalSearchParams<{ courseId: string }>();
  const course = useTeachCourseQuery(courseId);

  if (course.isPending) {
    return (
      <View style={[styles.fill, styles.loading, { backgroundColor: colors.background }]}>
        <Skeleton height={64} radius={14} />
        <Skeleton height={76} radius={12} />
        <Skeleton height={320} radius={14} />
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

  return <AttendanceSheet course={course.data} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { justifyContent: 'center' },
  loading: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, gap: SPACING.md },
  content: {
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.lg,
    paddingBottom: SAVE_BAR_HEIGHT + SPACING.xl,
    gap: SPACING.lg
  },
  section: { gap: SPACING.sm }
});
