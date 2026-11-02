import { router, useLocalSearchParams } from 'expo-router';
import { PlayCircleIcon } from 'phosphor-react-native/src/icons/PlayCircle';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { VideoCameraIcon } from 'phosphor-react-native/src/icons/VideoCamera';
import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Card } from '@/feature/common/components/card';
import { Icon } from '@/feature/common/components/icon';
import { IconTile } from '@/feature/common/components/icon-tile';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { isCheckInWindowOpen } from '@/feature/check-in/helpers/check-in-window';
import { useNow } from '@/feature/check-in/helpers/use-now';
import { checkInCatalog } from '@/feature/check-in/translations/catalog';
import { liveSessionPhaseOf } from '@/feature/course/helpers/content-copy';
import { formatSessionTime } from '@/feature/course/helpers/format-date';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useOpenLink } from '@/feature/lesson/helpers/open-external';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';

const CHECK_IN_REFRESH_MS = 30 * 1000;

type LiveSessionCardProps = {
  callUrl: string | null;
  lessonAt: string | null;
  sessionDurationMinutes: number | null;
  recordingUrl: string | null;
  offline?: boolean;
};

export function LiveSessionCard({
  callUrl,
  lessonAt,
  sessionDurationMinutes,
  recordingUrl,
  offline = false
}: LiveSessionCardProps) {
  const { colors } = useTheme();
  const t = useTranslations(lessonCatalog);
  const tc = useTranslations(checkInCatalog);
  const locale = useLocale();
  const { openExternal, openInSystem } = useOpenLink();
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const now = useNow(CHECK_IN_REFRESH_MS);
  const phase = liveSessionPhaseOf({ callUrl, lessonAt, sessionDurationMinutes });
  const canCheckIn = Boolean(lessonId) && isCheckInWindowOpen(lessonAt, sessionDurationMinutes, now);
  if (!phase && !recordingUrl) return null;

  const title = phase === 'live' ? t('liveNow') : phase === 'upcoming' ? t('upcomingSession') : t('sessionEnded');
  const duration = sessionDurationMinutes ? ` · ${t('durationMinutes', { minutes: sessionDurationMinutes })}` : '';

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <IconTile
          icon={VideoCameraIcon}
          tone={phase === 'live' || phase === 'upcoming' ? 'primary' : 'neutral'}
          size={40}
        />
        <View style={styles.copy}>
          <Text variant="bodyStrong" tone={phase === 'live' ? 'primary' : 'ink'}>
            {title}
          </Text>
          {lessonAt ? (
            <Text variant="caption" tone="muted">
              {formatSessionTime(lessonAt, locale)}
              {duration}
            </Text>
          ) : null}
        </View>
      </View>
      {callUrl && (phase === 'live' || phase === 'upcoming') ? (
        <Button
          variant={phase === 'live' ? 'primary' : 'outline'}
          disabled={offline}
          onPress={() => openInSystem(callUrl)}
        >
          <ButtonText>{t('joinSession')}</ButtonText>
        </Button>
      ) : null}
      {canCheckIn ? (
        <Button
          variant="outline"
          disabled={offline}
          onPress={() => router.push({ pathname: '/check-in/scan', params: { lesson: lessonId, source: 'lesson' } })}
        >
          <ButtonIcon icon={QrCodeIcon} />
          <ButtonText>{tc('checkIn')}</ButtonText>
        </Button>
      ) : null}
      {recordingUrl ? (
        <Button variant="outline" disabled={offline} onPress={() => openExternal(recordingUrl)}>
          <ButtonIcon icon={PlayCircleIcon} />
          <ButtonText>{t('watchRecording')}</ButtonText>
        </Button>
      ) : null}
      {offline && ((callUrl && (phase === 'live' || phase === 'upcoming')) || recordingUrl || canCheckIn) ? (
        <View style={styles.offline}>
          <Icon icon={WifiSlashIcon} size={14} tone="muted" />
          <Text variant="caption" tone="muted">
            {t('needsConnection')}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: SPACING.md, gap: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  copy: { flex: 1, gap: 2 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs }
});
