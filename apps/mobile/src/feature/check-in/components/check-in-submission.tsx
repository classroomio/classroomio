import { router } from 'expo-router';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { LinkBreakIcon } from 'phosphor-react-native/src/icons/LinkBreak';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { XCircleIcon } from 'phosphor-react-native/src/icons/XCircle';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { errorHaptic, successHaptic } from '@/feature/common/helpers/haptics';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useCheckInMutation } from '@/feature/check-in/api/check-in';
import type { CheckInTarget } from '@/feature/check-in/helpers/check-in-code';
import { checkInErrorCopy } from '@/feature/check-in/helpers/check-in-error';
import { leaveCheckIn } from '@/feature/check-in/helpers/leave-check-in';
import { checkInCatalog } from '@/feature/check-in/translations/catalog';
import type { CheckInResult } from '@/feature/check-in/types/check-in';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import {
  CheckInOutcome,
  CheckInOutcomeActions,
  CheckInOutcomeDetails,
  CheckInOutcomeMedia,
  CheckInOutcomeTitle
} from './check-in-outcome';

type CheckInSubmissionProps = {
  target: CheckInTarget | null;
  /** True when the learner arrived from the lesson itself, so the result offers no way back into it. */
  fromLesson?: boolean;
};

/** Submits a check-in once for the given lesson and code, then shows the result. */
export function CheckInSubmission({ target, fromLesson = false }: CheckInSubmissionProps) {
  const { colors } = useTheme();
  const checkIn = useCheckInMutation();
  const submitted = useRef<string | null>(null);
  const targetKey = target ? `${target.lessonId}:${target.code}` : null;

  useEffect(() => {
    if (!target || !targetKey || submitted.current === targetKey) return;

    submitted.current = targetKey;
    checkIn.mutate(target, { onSuccess: successHaptic, onError: errorHaptic });
  }, [target, targetKey, checkIn]);

  const scanAgain = () =>
    router.replace({
      pathname: '/check-in/scan',
      params: target ? { lesson: target.lessonId, ...(fromLesson ? { source: 'lesson' } : {}) } : {}
    });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      {!target ? (
        <LinkError onScan={scanAgain} />
      ) : checkIn.isSuccess ? (
        <CheckedIn result={checkIn.data} fromLesson={fromLesson} />
      ) : checkIn.isError ? (
        <CheckInError error={checkIn.error} onScan={scanAgain} />
      ) : (
        <View style={styles.pending} accessible accessibilityLiveRegion="polite">
          <Spinner size="large" />
          <CheckingInLabel />
        </View>
      )}
    </ScrollView>
  );
}

function CheckingInLabel() {
  const t = useTranslations(checkInCatalog);

  return (
    <Text variant="bodyStrong" tone="muted">
      {t('checkingIn')}
    </Text>
  );
}

function CheckedIn({ result, fromLesson }: { result: CheckInResult; fromLesson: boolean }) {
  const t = useTranslations(checkInCatalog);
  const common = useTranslations(commonCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const late = result.status === 'late';
  const checkedAt = result.checkedInAt ? parseTimestamp(result.checkedInAt) : Number.NaN;

  return (
    <CheckInOutcome>
      <CheckInOutcomeMedia icon={late ? ClockIcon : CheckCircleIcon} tone={late ? 'warning' : 'success'} />
      <CheckInOutcomeTitle>{late ? t('checkedInLateTitle') : t('checkedInTitle')}</CheckInOutcomeTitle>
      <CheckInOutcomeDetails>
        <Text variant="heading" style={styles.centered}>
          {result.lessonTitle}
        </Text>
        <Text variant="caption" tone="muted" style={styles.centered}>
          {result.courseTitle}
        </Text>
        {Number.isFinite(checkedAt) ? (
          <Text variant="caption" tone="muted" style={styles.centered}>
            {t('checkedInAt', { time: format.time(new Date(checkedAt)) })}
          </Text>
        ) : null}
      </CheckInOutcomeDetails>
      <CheckInOutcomeActions>
        {!fromLesson ? (
          <Button
            size="lg"
            onPress={() =>
              router.replace({
                pathname: '/course/[courseId]/lesson/[lessonId]',
                params: { courseId: result.courseId, lessonId: result.lessonId }
              })
            }
          >
            <ButtonText>{t('openLesson')}</ButtonText>
          </Button>
        ) : null}
        <Button size="lg" variant={fromLesson ? 'primary' : 'ghost'} onPress={leaveCheckIn}>
          <ButtonText>{common('done')}</ButtonText>
        </Button>
      </CheckInOutcomeActions>
    </CheckInOutcome>
  );
}

function CheckInError({ error, onScan }: { error: unknown; onScan: () => void }) {
  const t = useTranslations(checkInCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const copy = checkInErrorCopy(error);

  return (
    <CheckInOutcome>
      <CheckInOutcomeMedia icon={XCircleIcon} tone="danger" />
      <CheckInOutcomeTitle>{t(copy.title)}</CheckInOutcomeTitle>
      <CheckInOutcomeDetails>
        <Text tone="muted" style={styles.centered}>
          {copy.description ? t(copy.description) : errorMessage(error)}
        </Text>
      </CheckInOutcomeDetails>
      <CheckInOutcomeActions>
        <Button size="lg" onPress={onScan}>
          <ButtonIcon icon={QrCodeIcon} />
          <ButtonText>{t('scanAgain')}</ButtonText>
        </Button>
        <Button size="lg" variant="ghost" onPress={leaveCheckIn}>
          <ButtonText>{common('close')}</ButtonText>
        </Button>
      </CheckInOutcomeActions>
    </CheckInOutcome>
  );
}

function LinkError({ onScan }: { onScan: () => void }) {
  const t = useTranslations(checkInCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();

  return (
    <CheckInOutcome>
      <CheckInOutcomeMedia icon={LinkBreakIcon} tone="neutral" />
      <CheckInOutcomeTitle>{t('errorLinkTitle')}</CheckInOutcomeTitle>
      <CheckInOutcomeDetails>
        <Text tone="muted" style={styles.centered}>
          {t('errorLink')}
        </Text>
      </CheckInOutcomeDetails>
      <CheckInOutcomeActions>
        <Button size="lg" onPress={onScan}>
          <ButtonIcon icon={QrCodeIcon} />
          <ButtonText>{t('scanAgain')}</ButtonText>
        </Button>
        <Button size="lg" variant="ghost" onPress={leaveCheckIn}>
          <ButtonText>{common('close')}</ButtonText>
        </Button>
      </CheckInOutcomeActions>
    </CheckInOutcome>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl
  },
  pending: { alignItems: 'center', gap: SPACING.md },
  centered: { textAlign: 'center' }
});
