import { router } from 'expo-router';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { VideoCameraIcon } from 'phosphor-react-native/src/icons/VideoCamera';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Card } from '@/feature/common/components/card';
import { IconTile } from '@/feature/common/components/icon-tile';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { countdownOf } from '@/feature/check-in/helpers/check-in-window';
import { useNow } from '@/feature/check-in/helpers/use-now';
import { formatSessionTime } from '@/feature/course/helpers/format-date';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useCheckInCodeQuery } from '@/feature/teach/api/check-in-code';
import { useTeachCourseQuery } from '@/feature/teach/api/teach-course';
import { currentSessionOf, sessionsOf } from '@/feature/teach/helpers/use-attendance-roster';
import { teachCatalog } from '@/feature/teach/translations/catalog';

const REFRESH_MS = 30 * 1000;

/** The live or next session of a live class, with its check-in and attendance actions. */
export function TeachSessionCard({ courseId }: { courseId: string }) {
  const t = useTranslations(teachCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const now = useNow(REFRESH_MS);
  const course = useTeachCourseQuery(courseId);
  const current = course.data ? currentSessionOf(sessionsOf(course.data), now) : null;
  const code = useCheckInCodeQuery(courseId, current?.session.id ?? null);
  if (!current) return null;

  const { session, live } = current;
  const checkInOpen = code.data ? countdownOf(code.data.expiresAt, now) !== null : false;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <IconTile icon={VideoCameraIcon} tone={live ? 'danger' : 'primary'} size={40} />
        <View style={styles.copy}>
          <Text variant="captionStrong" tone={live ? 'danger' : 'muted'}>
            {live ? t('sessionLiveNow') : t('nextSession')}
          </Text>
          <Text variant="bodyStrong" numberOfLines={2}>
            {session.title}
          </Text>
          {session.lessonAt ? (
            <Text variant="caption" tone="muted">
              {formatSessionTime(session.lessonAt, locale)}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          variant={live ? 'primary' : 'outline'}
          style={styles.action}
          onPress={() =>
            router.push({ pathname: '/teach/course/[courseId]/check-in', params: { courseId, lessonId: session.id } })
          }
        >
          <ButtonIcon icon={QrCodeIcon} />
          <ButtonText>{checkInOpen ? t('showCode') : t('startCheckIn')}</ButtonText>
        </Button>
        <Button
          variant="outline"
          style={styles.action}
          onPress={() =>
            router.push({ pathname: '/teach/course/[courseId]/attendance', params: { courseId, lessonId: session.id } })
          }
        >
          <ButtonIcon icon={CalendarCheckIcon} />
          <ButtonText>{t('attendance')}</ButtonText>
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: SPACING.md, gap: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  copy: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: SPACING.xs },
  action: { flex: 1 }
});
