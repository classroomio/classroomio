import { CHECK_IN_LATE_AFTER_MINUTES } from '@cio/utils/constants/attendance';
import { router } from 'expo-router';
import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { StopCircleIcon } from 'phosphor-react-native/src/icons/StopCircle';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { countdownOf } from '@/feature/check-in/helpers/check-in-window';
import { useNow } from '@/feature/check-in/helpers/use-now';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useCheckInCodeQuery, useEndCheckInMutation, useStartCheckInMutation } from '@/feature/teach/api/check-in-code';
import { ROSTER_POLL_MS, useTeachCourseQuery } from '@/feature/teach/api/teach-course';
import { sessionsOf } from '@/feature/teach/helpers/use-attendance-roster';
import { teachCatalog } from '@/feature/teach/translations/catalog';

import { sessionLabel } from './attendance-roster';
import { CheckInCodeCard, CheckInCodeText, CheckInCountdown, CheckInQr } from './check-in-code-card';
import { CheckInProgress } from './check-in-progress';

type TeachCheckInProps = { courseId: string; lessonId: string };

/** Opens check-in for a session (or resumes the open one) and shows the code while the roster refreshes. */
export function TeachCheckIn({ courseId, lessonId }: TeachCheckInProps) {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const course = useTeachCourseQuery(courseId, { pollMs: ROSTER_POLL_MS });
  const code = useCheckInCodeQuery(courseId, lessonId);
  const start = useStartCheckInMutation(courseId, lessonId);
  const end = useEndCheckInMutation(courseId, lessonId);
  const autoStarted = useRef(false);
  const now = useNow(1000);
  const active = code.data ?? null;
  const expired = active ? countdownOf(active.expiresAt, now) === null : false;
  const session = course.data ? (sessionsOf(course.data).find((item) => item.id === lessonId) ?? null) : null;

  const issueCode = () =>
    start.mutate(undefined, {
      onSuccess: successHaptic,
      onError: (error) => showToast({ tone: 'danger', title: t('checkInNotStarted'), description: errorMessage(error) })
    });

  useEffect(() => {
    if (autoStarted.current || !code.isSuccess || code.data) return;

    autoStarted.current = true;
    issueCode();
  });

  const finish = () =>
    end.mutate(undefined, {
      onSuccess: () => {
        showToast({ tone: 'success', title: t('checkInEnded'), description: session?.title });
        router.back();
      },
      onError: (error) => showToast({ tone: 'danger', title: t('checkInNotEnded'), description: errorMessage(error) })
    });

  if (code.isError || (start.isError && !active)) {
    return (
      <View style={[styles.fill, styles.empty, { backgroundColor: colors.background }]}>
        <Empty>
          <EmptyMedia icon={QrCodeIcon} />
          <EmptyTitle>{t('checkInNotStarted')}</EmptyTitle>
          <EmptyDescription>{errorMessage(code.error ?? start.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={() => (code.isError ? code.refetch() : issueCode())}>
              <ButtonIcon icon={ArrowsClockwiseIcon} />
              <ButtonText>{common('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.fill} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.heading}>
          {session ? (
            <>
              <Text variant="title" accessibilityRole="header" style={styles.centered} numberOfLines={2}>
                {session.title}
              </Text>
              <Text variant="caption" tone="muted" style={styles.centered} numberOfLines={1}>
                {[course.data?.title, sessionLabel(session, t, locale)].filter(Boolean).join(' · ')}
              </Text>
            </>
          ) : (
            <>
              <Skeleton width="70%" height={26} radius={RADII.xs} />
              <Skeleton width="50%" height={14} radius={RADII.xs} />
            </>
          )}
        </View>

        <CheckInCodeCard>
          {active ? (
            <>
              <CheckInQr
                payload={active.qrPayload}
                label={t('qrA11y', { title: session?.title ?? '' })}
                dimmed={expired}
              />
              <CheckInCodeText code={active.code} dimmed={expired} />
              <CheckInCountdown expiresAt={active.expiresAt} />
            </>
          ) : (
            <>
              <Skeleton width={216} height={216} radius={RADII.lg} />
              <Text variant="captionStrong" tone="muted">
                {t('startingCheckIn')}
              </Text>
            </>
          )}
        </CheckInCodeCard>

        <Text variant="caption" tone="muted" style={styles.centered}>
          {t('checkInInstructions', { minutes: CHECK_IN_LATE_AFTER_MINUTES })}
        </Text>

        {course.data ? <CheckInProgress course={course.data} lessonId={lessonId} /> : null}
      </ScrollView>

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
        <Button
          variant={expired ? 'primary' : 'outline'}
          disabled={start.isPending || end.isPending}
          onPress={issueCode}
          style={styles.footerButton}
        >
          {start.isPending ? <ButtonSpinner /> : <ButtonIcon icon={ArrowsClockwiseIcon} />}
          <ButtonText>{t('newCode')}</ButtonText>
        </Button>
        <Button
          variant="destructive"
          disabled={!active || end.isPending || start.isPending}
          onPress={finish}
          style={styles.footerButton}
        >
          {end.isPending ? <ButtonSpinner /> : <ButtonIcon icon={StopCircleIcon} />}
          <ButtonText>{t('endCheckIn')}</ButtonText>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { textAlign: 'center' },
  empty: { justifyContent: 'center' },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  heading: { alignItems: 'center', gap: SPACING.xxs },
  footer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth * 2
  },
  footerButton: { flex: 1 }
});
