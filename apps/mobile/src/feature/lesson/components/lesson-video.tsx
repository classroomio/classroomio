import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { VideoCameraSlashIcon } from 'phosphor-react-native/src/icons/VideoCameraSlash';
import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import type { VideoPlayer } from 'expo-video';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useHlsPlaybackUrlQuery } from '@/feature/lesson/api/media';
import { EMBED_PROVIDERS } from '@/feature/lesson/constants/media-providers';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { LessonVideoSource, LessonWatchProgress, TranscriptSegment } from '@/feature/lesson/types/lesson';

import { EmbedFrame } from './embed-frame';
import { EmbedSource } from './embed-source';
import { NativeVideo, NativeVideoSurface } from './native-video';

type LessonVideoProps = {
  source: LessonVideoSource;
  courseId: string;
  lessonId: string;
  lessonTitle?: string;
  courseTitle?: string;
  /** A downloaded copy of this video on the device; it plays instead of the online source. */
  localUri?: string | null;
  offline?: boolean;
  watchProgress: LessonWatchProgress | null | undefined;
  segments?: TranscriptSegment[];
  onPlayerChange?: (player: VideoPlayer | null) => void;
};

export function LessonVideo({
  source,
  courseId,
  lessonId,
  lessonTitle,
  courseTitle,
  localUri,
  offline = false,
  watchProgress,
  segments,
  onPlayerChange
}: LessonVideoProps) {
  const t = useTranslations(lessonCatalog);

  if (localUri && source.kind !== 'embed') {
    return (
      <NativeVideo
        key={localUri}
        uri={localUri}
        contentType="auto"
        title={source.title}
        artist={courseTitle}
        poster={null}
        segments={segments}
        watch={{ courseId, lessonId, assetId: source.assetId, watchProgress, lessonTitle, courseTitle }}
        onPlayerChange={onPlayerChange}
      >
        <NativeVideoSurface />
      </NativeVideo>
    );
  }

  if (offline) {
    return (
      <VideoNeedsConnection
        description={
          source.kind === 'embed'
            ? t('videoPlaysFrom', { provider: EMBED_PROVIDERS[source.provider].name })
            : t('videoDownloadToWatch')
        }
      />
    );
  }

  if (source.kind === 'embed') {
    return (
      <View style={styles.embed}>
        <EmbedFrame uri={source.uri} title={source.title} framed={source.provider === 'youtube'} edgeToEdge />
        <View style={styles.embedSource}>
          <EmbedSource provider={source.provider} link={source.link} />
        </View>
      </View>
    );
  }

  if (source.kind === 'hls') {
    return (
      <HlsVideo
        source={source}
        courseId={courseId}
        lessonId={lessonId}
        lessonTitle={lessonTitle}
        courseTitle={courseTitle}
        watchProgress={watchProgress}
        segments={segments}
        onPlayerChange={onPlayerChange}
      />
    );
  }

  return (
    <NativeVideo
      key={source.uri}
      uri={source.uri}
      contentType="auto"
      title={source.title}
      artist={courseTitle}
      poster={source.poster}
      segments={segments}
      watch={{ courseId, lessonId, assetId: source.assetId, watchProgress, lessonTitle, courseTitle }}
      onPlayerChange={onPlayerChange}
    >
      <NativeVideoSurface />
    </NativeVideo>
  );
}

type HlsVideoProps = Omit<LessonVideoProps, 'source' | 'localUri' | 'offline'> & {
  source: Extract<LessonVideoSource, { kind: 'hls' }>;
};

function HlsVideo({
  source,
  courseId,
  lessonId,
  lessonTitle,
  courseTitle,
  watchProgress,
  segments,
  onPlayerChange
}: HlsVideoProps) {
  const playback = useHlsPlaybackUrlQuery(source.assetId);
  const { width } = useWindowDimensions();

  if (playback.isPending) return <Skeleton height={(width * 9) / 16} radius={0} />;

  if (!playback.data) return <VideoUnavailable onRetry={() => playback.refetch()} />;

  return (
    <NativeVideo
      key={playback.data.uri}
      uri={playback.data.uri}
      contentType="hls"
      title={source.title}
      artist={courseTitle}
      poster={source.poster}
      segments={segments}
      watch={{ courseId, lessonId, assetId: source.assetId, watchProgress, lessonTitle, courseTitle }}
      onPlayerChange={onPlayerChange}
      onRetry={() => playback.refetch()}
    >
      <NativeVideoSurface />
    </NativeVideo>
  );
}

function VideoUnavailable({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  const t = useTranslations(lessonCatalog);
  const common = useTranslations(commonCatalog);

  return (
    <View style={[styles.unavailable, { backgroundColor: colors.muted }]}>
      <Icon icon={VideoCameraSlashIcon} size={24} tone="muted" />
      <Text variant="captionStrong">{t('videoUnavailable')}</Text>
      <Text variant="caption" tone="muted" style={styles.centerText}>
        {t('videoPrepareError')}
      </Text>
      <Button size="sm" variant="outline" onPress={onRetry}>
        <ButtonIcon icon={ArrowCounterClockwiseIcon} />
        <ButtonText>{common('retry')}</ButtonText>
      </Button>
    </View>
  );
}

function VideoNeedsConnection({ description }: { description: string }) {
  const { colors } = useTheme();
  const t = useTranslations(lessonCatalog);
  const title = t('videoNeedsConnection');

  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${description}`}
      style={[styles.unavailable, { backgroundColor: colors.muted }]}
    >
      <Icon icon={WifiSlashIcon} size={24} tone="muted" />
      <Text variant="captionStrong">{title}</Text>
      <Text variant="caption" tone="muted" style={styles.centerText}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  embed: { gap: SPACING.xs },
  embedSource: { paddingHorizontal: GUTTER },
  unavailable: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.lg
  },
  centerText: { textAlign: 'center', maxWidth: 280 }
});
