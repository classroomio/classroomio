import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { GaugeIcon } from 'phosphor-react-native/src/icons/Gauge';
import { SubtitlesIcon } from 'phosphor-react-native/src/icons/Subtitles';
import { SubtitlesSlashIcon } from 'phosphor-react-native/src/icons/SubtitlesSlash';
import { VideoCameraSlashIcon } from 'phosphor-react-native/src/icons/VideoCameraSlash';
import { useEvent } from 'expo';
import { VideoView, useVideoPlayer, type SubtitleTrack, type VideoPlayer, type VideoSource } from 'expo-video';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetContent,
  OptionSheetItem,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { PLAYBACK_RATES, VIDEO_COLORS } from '@/feature/lesson/constants/playback';
import { activeSegmentIndex } from '@/feature/lesson/helpers/transcript';
import { useWatchEnforcement } from '@/feature/lesson/helpers/use-watch-enforcement';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { LessonWatchProgress, TranscriptSegment } from '@/feature/lesson/types/lesson';

type CaptionChoice = { kind: 'off' } | { kind: 'track'; track: SubtitleTrack } | { kind: 'transcript' };

type NativeVideoContextValue = {
  player: VideoPlayer;
  enforced: boolean;
  segments: TranscriptSegment[];
  captions: CaptionChoice;
  setCaptions: (choice: CaptionChoice) => void;
  subtitleTracks: SubtitleTrack[];
  onRetry?: () => void;
};

const NativeVideoContext = createContext<NativeVideoContextValue | null>(null);

function useNativeVideo() {
  const context = use(NativeVideoContext);
  if (!context) throw new Error('NativeVideo parts must be used inside NativeVideo');

  return context;
}

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
  const player = useVideoPlayer(source, (instance) => {
    instance.timeUpdateEventInterval = 0.5;
    instance.staysActiveInBackground = true;
    instance.showNowPlayingNotification = true;
  });
  const { enforced } = useWatchEnforcement(player, watch);
  const [captions, setCaptions] = useState<CaptionChoice>({ kind: 'off' });
  const { availableSubtitleTracks } = useEvent(player, 'availableSubtitleTracksChange', {
    availableSubtitleTracks: player.availableSubtitleTracks
  });

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

  return (
    <View style={[styles.surface, { borderColor: colors.border }]}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        allowsPictureInPicture
        startsPictureInPictureAutomatically
        requiresLinearPlayback={enforced}
        fullscreenOptions={{ enable: true, orientation: 'landscape' }}
        style={StyleSheet.absoluteFill}
      />
      <CaptionOverlay />
      {status === 'loading' ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
          <Spinner tone="onPrimary" />
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
      ) : null}
    </View>
  );
}

function CaptionOverlay() {
  const { player, captions, segments } = useNativeVideo();
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0
  });
  if (captions.kind !== 'transcript') return null;

  const segment = segments[activeSegmentIndex(segments, currentTime)];
  if (!segment) return null;

  return (
    <View pointerEvents="none" style={styles.captionAnchor}>
      <Text variant="captionStrong" style={styles.caption} accessibilityLiveRegion="polite">
        {segment.text.trim()}
      </Text>
    </View>
  );
}

export function NativeVideoControls({ children }: { children: ReactNode }) {
  return <View style={styles.controls}>{children}</View>;
}

export function NativeVideoSpeed() {
  const { player, enforced } = useNativeVideo();
  const { playbackRate } = useEvent(player, 'playbackRateChange', { playbackRate: player.playbackRate });
  const [open, setOpen] = useState(false);
  const t = useTranslations(lessonCatalog);
  const format = useFormatters();
  const rateLabel = (rate: number) => `${format.number(rate)}×`;

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        disabled={enforced}
        accessibilityLabel={
          enforced ? t('playbackSpeedFixed') : t('playbackSpeedValue', { rate: rateLabel(playbackRate) })
        }
        onPress={() => setOpen(true)}
      >
        <ButtonIcon icon={GaugeIcon} />
        <ButtonText>{rateLabel(playbackRate)}</ButtonText>
      </Button>
      <OptionSheet open={open} onOpenChange={setOpen}>
        <OptionSheetContent>
          <OptionSheetTitle>{t('playbackSpeed')}</OptionSheetTitle>
          {PLAYBACK_RATES.map((rate) => (
            <OptionSheetItem
              key={rate}
              selected={rate === playbackRate}
              onSelect={() => {
                player.playbackRate = rate;
              }}
            >
              {rate === 1 ? t('speedNormal') : rateLabel(rate)}
            </OptionSheetItem>
          ))}
          <OptionSheetCancel />
        </OptionSheetContent>
      </OptionSheet>
    </>
  );
}

export function NativeVideoCaptions() {
  const { captions, setCaptions, subtitleTracks, segments } = useNativeVideo();
  const [open, setOpen] = useState(false);
  const t = useTranslations(lessonCatalog);
  if (subtitleTracks.length === 0 && segments.length === 0) return null;

  const on = captions.kind !== 'off';

  return (
    <>
      <Button
        size="sm"
        variant={on ? 'primary' : 'secondary'}
        accessibilityState={{ selected: on }}
        onPress={() => {
          if (subtitleTracks.length === 0) setCaptions(on ? { kind: 'off' } : { kind: 'transcript' });
          else setOpen(true);
        }}
      >
        <ButtonIcon icon={on ? SubtitlesIcon : SubtitlesSlashIcon} />
        <ButtonText>{t('captions')}</ButtonText>
      </Button>
      <OptionSheet open={open} onOpenChange={setOpen}>
        <OptionSheetContent>
          <OptionSheetTitle>{t('captions')}</OptionSheetTitle>
          <OptionSheetItem selected={captions.kind === 'off'} onSelect={() => setCaptions({ kind: 'off' })}>
            {t('captionsOff')}
          </OptionSheetItem>
          {subtitleTracks.map((track, index) => (
            <OptionSheetItem
              key={track.id ?? `${track.language}-${index}`}
              selected={captions.kind === 'track' && captions.track === track}
              onSelect={() => setCaptions({ kind: 'track', track })}
            >
              {track.label || track.name || track.language || t('trackNumbered', { number: index + 1 })}
            </OptionSheetItem>
          ))}
          {segments.length > 0 ? (
            <OptionSheetItem
              selected={captions.kind === 'transcript'}
              onSelect={() => setCaptions({ kind: 'transcript' })}
            >
              {t('captionsFromTranscript')}
            </OptionSheetItem>
          ) : null}
          <OptionSheetCancel />
        </OptionSheetContent>
      </OptionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.sm },
  surface: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    backgroundColor: VIDEO_COLORS.letterbox,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  unavailable: { gap: SPACING.xs, padding: SPACING.lg },
  centerText: { textAlign: 'center', maxWidth: 280 },
  captionAnchor: { position: 'absolute', left: SPACING.md, right: SPACING.md, bottom: 56, alignItems: 'center' },
  caption: {
    color: VIDEO_COLORS.captionText,
    textAlign: 'center',
    backgroundColor: VIDEO_COLORS.captionBackground,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    borderRadius: RADII.xs,
    overflow: 'hidden'
  },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }
});
