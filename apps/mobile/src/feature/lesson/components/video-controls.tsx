import { ArrowClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowClockwise';
import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { CornersInIcon } from 'phosphor-react-native/src/icons/CornersIn';
import { CornersOutIcon } from 'phosphor-react-native/src/icons/CornersOut';
import { PauseIcon } from 'phosphor-react-native/src/icons/Pause';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { SubtitlesIcon } from 'phosphor-react-native/src/icons/Subtitles';
import { SubtitlesSlashIcon } from 'phosphor-react-native/src/icons/SubtitlesSlash';
import { useEvent } from 'expo';
import { VideoAirPlayButton } from 'expo-video';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, useExclusiveGestures, useTapGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { Icon, type AppIcon } from '@/feature/common/components/icon';
import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetItem,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useScreenReaderEnabled } from '@/feature/common/helpers/use-screen-reader-enabled';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { PLAYBACK_RATES, SKIP_SECONDS, VIDEO_COLORS } from '@/feature/lesson/constants/playback';
import { formatTimestamp } from '@/feature/lesson/helpers/transcript';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';

import { useNativeVideo } from './native-video-context';
import { VideoScrubber } from './video-scrubber';

const HIDE_AFTER_MS = 3000;
const NUDGE_MS = 650;
const FADE_MS = 200;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENDED_TOLERANCE_SECONDS = 0.5;

type Nudge = { direction: 1 | -1; key: number };

function usePlaybackTime() {
  const { player } = useNativeVideo();
  const time = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: player.bufferedPosition
  });

  return { currentTime: time.currentTime, bufferedPosition: time.bufferedPosition, duration: player.duration };
}

/** Custom inline controls over the video: tap to show or hide, double-tap a side to skip, drag the bar to seek. */
type VideoControlsProps = {
  /** Shows the exit button instead of the enter button. */
  fullscreen?: boolean;
  onFullscreen: () => void;
};

export function VideoControls({ fullscreen = false, onFullscreen }: VideoControlsProps) {
  const { player, enforced } = useNativeVideo();
  const t = useTranslations(lessonCatalog);
  const screenReader = useScreenReaderEnabled();
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { currentTime, bufferedPosition, duration } = usePlaybackTime();
  const [visible, setVisible] = useState(true);
  const [interactedAt, setInteractedAt] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState<number | null>(null);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [width, setWidth] = useState(0);
  const ended = !isPlaying && duration > 0 && currentTime >= duration - ENDED_TOLERANCE_SECONDS;
  const loading = status === 'loading';
  const shown = visible || !isPlaying || scrubbing || screenReader;
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.set(withTiming(shown ? 1 : 0, { duration: FADE_MS, easing: EASE_OUT }));
  }, [opacity, shown]);

  const chromeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (!visible || !isPlaying || scrubbing || screenReader) return;

    const timer = setTimeout(() => setVisible(false), HIDE_AFTER_MS);

    return () => clearTimeout(timer);
  }, [visible, isPlaying, scrubbing, screenReader, interactedAt]);

  useEffect(() => {
    if (!nudge) return;

    const timer = setTimeout(() => setNudge(null), NUDGE_MS);

    return () => clearTimeout(timer);
  }, [nudge]);

  const keepVisible = () => {
    setVisible(true);
    setInteractedAt(Date.now());
  };

  const togglePlayback = () => {
    selectionHaptic();
    keepVisible();
    if (ended) {
      player.currentTime = 0;
      player.play();
      return;
    }

    if (isPlaying) player.pause();
    else player.play();
  };

  const skip = (direction: 1 | -1) => {
    if (direction === 1 && enforced) return;

    player.seekBy(direction * SKIP_SECONDS);
    setNudge({ direction, key: Date.now() });
  };

  const singleTap = useTapGesture({
    runOnJS: true,
    onActivate: () => {
      if (shown && isPlaying) setVisible(false);
      else keepVisible();
    }
  });
  const doubleTap = useTapGesture({
    runOnJS: true,
    numberOfTaps: 2,
    onActivate: (event) => skip(event.x < width / 2 ? -1 : 1)
  });
  const taps = useExclusiveGestures(doubleTap, singleTap);

  const elapsed = formatTimestamp(previewSeconds ?? currentTime);
  const total = formatTimestamp(duration);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <GestureDetector gesture={taps}>
        <View collapsable={false} style={StyleSheet.absoluteFill} />
      </GestureDetector>

      {nudge ? <SkipNudge key={nudge.key} direction={nudge.direction} /> : null}

      <Animated.View
        pointerEvents={shown ? 'box-none' : 'none'}
        accessibilityElementsHidden={!shown}
        importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
        style={[StyleSheet.absoluteFill, chromeStyle]}
      >
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: VIDEO_COLORS.scrim }]} />

        <View pointerEvents="box-none" style={styles.center}>
          <ControlButton
            icon={ArrowCounterClockwiseIcon}
            label={t('skipBack', { seconds: SKIP_SECONDS })}
            centerLabel={String(SKIP_SECONDS)}
            onPress={() => {
              keepVisible();
              skip(-1);
            }}
          />
          {loading ? (
            <View style={styles.primarySlot} />
          ) : (
            <ControlButton
              icon={ended ? ArrowCounterClockwiseIcon : isPlaying ? PauseIcon : PlayIcon}
              label={ended ? t('replay') : isPlaying ? t('pause') : t('play')}
              size="primary"
              onPress={togglePlayback}
            />
          )}
          <ControlButton
            icon={ArrowClockwiseIcon}
            label={t('skipForward', { seconds: SKIP_SECONDS })}
            centerLabel={String(SKIP_SECONDS)}
            disabled={enforced}
            onPress={() => {
              keepVisible();
              skip(1);
            }}
          />
        </View>

        <View pointerEvents="box-none" style={styles.bottom}>
          <View pointerEvents="box-none" style={styles.bottomRow}>
            <Text variant="captionStrong" color={VIDEO_COLORS.control} style={styles.time}>
              {`${elapsed} / ${total}`}
            </Text>
            <View style={styles.actions}>
              <VideoAirPlayButton
                tint={VIDEO_COLORS.control}
                activeTint={VIDEO_COLORS.control}
                prioritizeVideoDevices
                style={styles.airPlay}
              />
              <SpeedControl onOpen={keepVisible} />
              <CaptionsControl onOpen={keepVisible} />
              <ControlButton
                icon={fullscreen ? CornersInIcon : CornersOutIcon}
                label={fullscreen ? t('exitFullscreen') : t('fullscreen')}
                size="compact"
                onPress={onFullscreen}
              />
            </View>
          </View>
          <VideoScrubber
            currentTime={currentTime}
            duration={duration}
            bufferedPosition={bufferedPosition}
            enabled={!enforced}
            accessibilityLabel={t('videoPosition')}
            accessibilityValue={t('videoTimeOf', { current: elapsed, duration: total })}
            onScrubStart={() => {
              setScrubbing(true);
              keepVisible();
            }}
            onScrubPreview={setPreviewSeconds}
            onScrubEnd={(seconds) => {
              player.currentTime = seconds;
              setPreviewSeconds(null);
              setScrubbing(false);
              keepVisible();
            }}
            onAccessibilityStep={skip}
          />
        </View>
      </Animated.View>
    </View>
  );
}

type ControlButtonProps = {
  icon: AppIcon;
  label: string;
  onPress: () => void;
  size?: 'primary' | 'secondary' | 'compact';
  centerLabel?: string;
  disabled?: boolean;
  selected?: boolean;
  children?: ReactNode;
};

function ControlButton({
  icon,
  label,
  onPress,
  size = 'secondary',
  centerLabel,
  disabled = false,
  selected,
  children
}: ControlButtonProps) {
  const iconSize = size === 'primary' ? 30 : size === 'compact' ? 20 : 26;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'primary' && styles.primary,
        size === 'compact' && styles.compact,
        pressed && { backgroundColor: VIDEO_COLORS.controlPressed },
        disabled && styles.disabled
      ]}
    >
      {children ?? <Icon icon={icon} size={iconSize} color={VIDEO_COLORS.control} weight="fill" />}
      {centerLabel ? (
        <Text variant="caption" color={VIDEO_COLORS.control} style={styles.centerLabel}>
          {centerLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

function SkipNudge({ direction }: { direction: 1 | -1 }) {
  const t = useTranslations(lessonCatalog);

  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(250)}
      pointerEvents="none"
      style={[styles.nudge, direction === -1 ? styles.nudgeLeft : styles.nudgeRight]}
    >
      <Icon
        icon={direction === -1 ? ArrowCounterClockwiseIcon : ArrowClockwiseIcon}
        size={22}
        color={VIDEO_COLORS.control}
        weight="bold"
      />
      <Text variant="captionStrong" color={VIDEO_COLORS.control}>
        {direction === -1
          ? t('skippedBack', { seconds: SKIP_SECONDS })
          : t('skippedForward', { seconds: SKIP_SECONDS })}
      </Text>
    </Animated.View>
  );
}

function SpeedControl({ onOpen }: { onOpen: () => void }) {
  const { player, enforced } = useNativeVideo();
  const { playbackRate } = useEvent(player, 'playbackRateChange', { playbackRate: player.playbackRate });
  const sheet = useRef<SheetRef>(null);
  const t = useTranslations(lessonCatalog);
  const format = useFormatters();
  const rateLabel = (rate: number) => `${format.number(rate)}×`;

  return (
    <>
      <ControlButton
        icon={PlayIcon}
        size="compact"
        disabled={enforced}
        label={enforced ? t('playbackSpeedFixed') : t('playbackSpeedValue', { rate: rateLabel(playbackRate) })}
        onPress={() => {
          onOpen();
          sheet.current?.present();
        }}
      >
        <Text variant="captionStrong" color={VIDEO_COLORS.control}>
          {rateLabel(playbackRate)}
        </Text>
      </ControlButton>
      <OptionSheet ref={sheet}>
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
      </OptionSheet>
    </>
  );
}

function CaptionsControl({ onOpen }: { onOpen: () => void }) {
  const { captions, setCaptions, subtitleTracks, segments } = useNativeVideo();
  const sheet = useRef<SheetRef>(null);
  const t = useTranslations(lessonCatalog);
  if (subtitleTracks.length === 0 && segments.length === 0) return null;

  const on = captions.kind !== 'off';

  return (
    <>
      <ControlButton
        icon={on ? SubtitlesIcon : SubtitlesSlashIcon}
        size="compact"
        selected={on}
        label={t('captions')}
        onPress={() => {
          onOpen();
          if (subtitleTracks.length === 0) setCaptions(on ? { kind: 'off' } : { kind: 'transcript' });
          else sheet.current?.present();
        }}
      />
      <OptionSheet ref={sheet}>
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
      </OptionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VIDEO_COLORS.controlBackground
  },
  primarySlot: { width: 64, height: 64 },
  airPlay: { width: 36, height: 36 },
  compact: { width: 'auto', minWidth: 36, height: 36, borderRadius: 18, paddingHorizontal: SPACING.xs },
  disabled: { opacity: 0.35 },
  centerLabel: { position: 'absolute', fontSize: 9, lineHeight: 11, fontWeight: '700' },
  bottom: { position: 'absolute', left: SPACING.sm, right: SPACING.sm, bottom: SPACING.xxs },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs },
  nudge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '34%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxs,
    backgroundColor: VIDEO_COLORS.controlBackground
  },
  nudgeLeft: { left: 0, borderTopRightRadius: 999, borderBottomRightRadius: 999 },
  nudgeRight: { right: 0, borderTopLeftRadius: 999, borderBottomLeftRadius: 999 }
});
