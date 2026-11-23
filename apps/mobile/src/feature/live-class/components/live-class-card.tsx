import { CalendarPlusIcon } from 'phosphor-react-native/src/icons/CalendarPlus';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { VideoCameraIcon } from 'phosphor-react-native/src/icons/VideoCamera';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Card } from '@/feature/common/components/card';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useOpenLink } from '@/feature/lesson/helpers/open-external';
import { useLiveClassRegistrationMutation } from '@/feature/live-class/api/live-classes';
import { addLiveClassToCalendar } from '@/feature/live-class/helpers/add-to-calendar';
import { liveClassCatalog } from '@/feature/live-class/translations/catalog';
import type { LiveClass } from '@/feature/live-class/types/live-class';
import { showToast } from '@/feature/toast/helpers/toast-store';

/** A live class: when it is, who hosts it, and Register, Join now or Add to calendar. */
export function LiveClassCard({ liveClass }: { liveClass: LiveClass }) {
  const t = useTranslations(liveClassCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const { openInSystem } = useOpenLink();
  const registration = useLiveClassRegistrationMutation();
  const startsAt = new Date(parseTimestamp(liveClass.startsAt));
  const endTime = liveClass.endsAt ? parseTimestamp(liveClass.endsAt) : Number.NaN;
  const when = Number.isFinite(endTime)
    ? t('timeRange', {
        day: format.shortDate(startsAt),
        start: format.time(startsAt),
        end: format.time(new Date(endTime))
      })
    : t('timeAt', { day: format.shortDate(startsAt), start: format.time(startsAt) });
  const pending = registration.isPending && registration.variables?.lessonId === liveClass.lessonId;
  const callUrl = liveClass.canJoin ? liveClass.callUrl : null;

  const register = (next: boolean) =>
    registration.mutate(
      { lessonId: liveClass.lessonId, register: next },
      {
        onSuccess: () => {
          if (!next) return;

          successHaptic();
          showToast({ tone: 'success', title: t('registered'), description: liveClass.title });
        },
        onError: (error) =>
          showToast({
            tone: 'danger',
            title: next ? t('registerFailed') : t('unregisterFailed'),
            description: errorMessage(error)
          })
      }
    );

  const addToCalendar = () =>
    addLiveClassToCalendar(liveClass).catch((error: unknown) =>
      showToast({ tone: 'danger', title: t('calendarFailed'), description: errorMessage(error) })
    );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.date, { backgroundColor: liveClass.isLive ? colors.primary : colors.primaryTint }]}>
          <Text variant="micro" tone={liveClass.isLive ? 'onPrimary' : 'primary'}>
            {format.monthShort(startsAt)}
          </Text>
          <Text variant="title" tone={liveClass.isLive ? 'onPrimary' : 'primary'}>
            {format.dayOfMonth(startsAt)}
          </Text>
        </View>
        <View style={styles.copy}>
          <Text variant="captionStrong" tone={liveClass.isLive ? 'primary' : 'muted'} numberOfLines={1}>
            {liveClass.isLive ? t('liveNow') : when}
          </Text>
          <Text variant="bodyStrong" numberOfLines={2}>
            {liveClass.title}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {liveClass.hostName
              ? t('courseWithHost', { course: liveClass.course.title, host: liveClass.hostName })
              : liveClass.course.title}
          </Text>
        </View>
      </View>

      {liveClass.isRegistered && !callUrl ? (
        <View style={styles.status}>
          <Icon icon={CheckCircleIcon} size={15} tone="success" weight="fill" />
          <Text variant="captionStrong" tone="success">
            {t('registered')}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {callUrl ? (
          <Button size="sm" onPress={() => openInSystem(callUrl)}>
            <ButtonIcon icon={VideoCameraIcon} />
            <ButtonText>{t('joinNow')}</ButtonText>
          </Button>
        ) : liveClass.isRegistered ? (
          <Button size="sm" variant="ghost" disabled={pending} onPress={() => register(false)}>
            {pending ? <ButtonSpinner /> : <ButtonText>{t('cancelRegistration')}</ButtonText>}
          </Button>
        ) : liveClass.canRegister ? (
          <Button size="sm" disabled={pending} onPress={() => register(true)}>
            {pending ? <ButtonSpinner /> : <ButtonText>{t('register')}</ButtonText>}
          </Button>
        ) : liveClass.requiresPayment ? (
          <Text variant="caption" tone="muted" style={styles.note}>
            {t('paidCourse')}
          </Text>
        ) : null}
        {liveClass.isLive ? null : (
          <Button size="sm" variant="outline" onPress={addToCalendar}>
            <ButtonIcon icon={CalendarPlusIcon} />
            <ButtonText>{t('addToCalendar')}</ButtonText>
          </Button>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.sm, padding: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  date: { width: 52, height: 56, borderRadius: RADII.lg, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  note: { alignSelf: 'center' }
});
