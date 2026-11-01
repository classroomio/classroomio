import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { VideoCameraSlashIcon } from 'phosphor-react-native/src/icons/VideoCameraSlash';
import { useEvent } from 'expo';
import { VideoView, useVideoPlayer, type VideoSource, type VideoPlayer } from 'expo-video';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { VIDEO_COLORS } from '@/feature/lesson/constants/playback';
import { enterLandscape, restorePortrait } from '@/feature/lesson/helpers/fullscreen-orientation';
import { useWatchEnforcement } from '@/feature/lesson/helpers/use-watch-enforcement';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { LessonWatchProgress, TranscriptSegment } from '@/feature/lesson/types/lesson';
import { maxResolutionOf, useVideoQuality } from '@/feature/settings/helpers/video-quality-store';

import { NativeVideoContext, useNativeVideo, type CaptionChoice } from './native-video-context';
import { VideoCaptions } from './video-captions';
import { VideoControls } from './video-controls';
import { VideoFullscreen } from './video-fullscreen';

type NativeVideoProps = {
  uri: string;
  contentType: 'hls' | 'auto';
  title: string;
  artist?: string;
  poster?: string | null;
  segments?: TranscriptSegment[];
  watch: {
    courseId: string;
    lessonId: string;
    assetId: string | null;
    watchProgress: LessonWatchProgress | null | undefined;
    lessonTitle?: string | null;
    courseTitle?: string | null;
  };
  /** Reports the player so the transcript sheet can follow and seek it. */
  onPlayerChange?: (player: VideoPlayer | null) => void;
  onRetry?: () => void;
  children: ReactNode;
};

export function NativeVideo({
  uri,
  contentType,
  title,
  artist,
  poster,
  segments = [],
  watch,
  onPlayerChange,
  onRetry,
  children
}: NativeVideoProps) {
  const source: VideoSource = { uri, contentType, metadata: { title, artist, artwork: poster ?? undefined } };
  const videoQuality = useVideoQuality();
  const player = useVideoPlayer(source, (instance) => {
    instance.timeUpdateEventInterval = 0.5;
    instance.staysActiveInBackground = true;
    instance.showNowPlayingNotification = true;
    instance.maxResolution = maxResolutionOf(videoQuality);
  });
  const { enforced } = useWatchEnforcement(player, watch);
  const [captions, setCaptions] = useState<CaptionChoice>({ kind: 'off' });
  const { availableSubtitleTracks } = useEvent(player, 'availableSubtitleTracksChange', {
    availableSubtitleTracks: player.availableSubtitleTracks
  });

  useEffect(() => {
    player.maxResolution = maxResolutionOf(videoQuality);
  }, [player, videoQuality]);

  useEffect(() => {
    onPlayerChange?.(player);

    return () => onPlayerChange?.(null);
  }, [player, onPlayerChange]);

  const chooseCaptions = (choice: CaptionChoice) => {
    player.subtitleTrack = choice.kind === 'track' ? choice.track : null;
    setCaptions(choice);
  };

  return (
    <NativeVideoContext
      value={{
        player,
        enforced,
        segments,
        captions,
        setCaptions: chooseCaptions,
        subtitleTracks: availableSubtitleTracks,
        onRetry
      }}
    >
      <View style={styles.root}>{children}</View>
    </NativeVideoContext>
  );
}

export function NativeVideoSurface() {
  const { colors } = useTheme();
  const { player, enforced, onRetry } = useNativeVideo();
  const t = useTranslations(lessonCatalog);
  const common = useTranslations(commonCatalog);
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const [fullscreen, setFullscreen] = useState(false);

  const enterFullscreen = async () => {
    await enterLandscape().catch(() => {});
    setFullscreen(true);
  };

  const exitFullscreen = () => {
    setFullscreen(false);
    void restorePortrait().catch(() => {});
  };

  return (
    <View style={styles.surface}>
      {fullscreen ? null : (
        <VideoView
          player={player}
          nativeControls={false}
          contentFit="contain"
          allowsPictureInPicture
          allowsVideoFrameAnalysis={false}
          startsPictureInPictureAutomatically
          requiresLinearPlayback={enforced}
          style={StyleSheet.absoluteFill}
        />
      )}
      <VideoCaptions />
      {status === 'loading' ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
          <Spinner color={VIDEO_COLORS.control} size="large" />
        </View>
      ) : null}
      {status === 'error' ? (
        <View
          style={[StyleSheet.absoluteFill, styles.center, styles.unavailable, { backgroundColor: colors.mutedStrong }]}
        >
          <Icon icon={VideoCameraSlashIcon} size={24} tone="muted" />
          <Text variant="captionStrong">{t('videoUnavailable')}</Text>
          <Text variant="caption" tone="muted" style={styles.centerText}>
            {t('videoLoadError')}
          </Text>
          {onRetry ? (
            <Button size="sm" variant="outline" onPress={onRetry}>
              <ButtonIcon icon={ArrowCounterClockwiseIcon} />
              <ButtonText>{common('retry')}</ButtonText>
            </Button>
          ) : null}
        </View>
      ) : (
        <VideoControls onFullscreen={() => void enterFullscreen()} />
      )}
      {fullscreen ? <VideoFullscreen onExit={exitFullscreen} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.sm },
  surface: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    backgroundColor: VIDEO_COLORS.letterbox
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  unavailable: { gap: SPACING.xs, padding: SPACING.lg },
  centerText: { textAlign: 'center', maxWidth: 280 }
});
