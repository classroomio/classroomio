import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRef, useState } from 'react';
import { Linking, Modal, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { DURATION } from '@/feature/common/constants/motion';
import { errorHaptic, tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { CAMERA_CHROME } from '@/feature/exercise/constants/camera';
import { VIDEO_RECORDING_MIN_SECONDS } from '@/feature/exercise/constants/question-types';
import { formatDuration } from '@/feature/exercise/helpers/format';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export type RecordedVideo = { uri: string; durationSeconds: number; recordedAt: string };

type VideoRecorderProps = {
  open: boolean;
  maxSeconds: number;
  onClose: () => void;
  onUse: (video: RecordedVideo) => void;
};

export function VideoRecorder({ open, maxSeconds, onClose, onUse }: VideoRecorderProps) {
  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      {open && <RecorderBody maxSeconds={maxSeconds} onClose={onClose} onUse={onUse} />}
    </Modal>
  );
}

function RecorderBody({ maxSeconds, onClose, onUse }: Omit<VideoRecorderProps, 'open'>) {
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();
  const [take, setTake] = useState<RecordedVideo | null>(null);

  if (!cameraPermission || !micPermission) return <View style={styles.black} />;

  if (!cameraPermission.granted || !micPermission.granted) {
    const blocked =
      (!cameraPermission.granted && !cameraPermission.canAskAgain) ||
      (!micPermission.granted && !micPermission.canAskAgain);

    return (
      <PermissionPrompt
        blocked={blocked}
        onClose={onClose}
        onAllow={async () => {
          if (!cameraPermission.granted) await requestCamera();
          if (!micPermission.granted) await requestMic();
        }}
      />
    );
  }

  if (take)
    return <TakePreview take={take} onRetake={() => setTake(null)} onUse={() => onUse(take)} onClose={onClose} />;

  return <Camera maxSeconds={maxSeconds} onClose={onClose} onRecorded={setTake} />;
}

function PermissionPrompt({
  blocked,
  onAllow,
  onClose
}: {
  blocked: boolean;
  onAllow: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.prompt, { backgroundColor: colors.background, paddingTop: insets.top + SPACING.md }]}>
      <CloseButton onPress={onClose} tone="ink" />
      <View style={styles.promptBody}>
        <Text variant="title">{t('permissionTitle')}</Text>
        <Text tone="muted">{t(blocked ? 'permissionBlocked' : 'permissionExplanation')}</Text>
        <Button size="lg" onPress={blocked ? () => void Linking.openSettings() : onAllow}>
          <ButtonText>{t(blocked ? 'openSettings' : 'allowAccess')}</ButtonText>
        </Button>
      </View>
    </View>
  );
}

function CloseButton({ onPress, tone = 'onPrimary' }: { onPress: () => void; tone?: 'ink' | 'onPrimary' }) {
  const tc = useTranslations(commonCatalog);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={tc('close')}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={styles.close}
    >
      <Icon
        icon={XIcon}
        size={24}
        tone={tone === 'ink' ? 'ink' : undefined}
        color={tone === 'ink' ? undefined : CAMERA_CHROME.foreground}
      />
    </PressableScale>
  );
}

function Camera({
  maxSeconds,
  onClose,
  onRecorded
}: {
  maxSeconds: number;
  onClose: () => void;
  onRecorded: (take: RecordedVideo) => void;
}) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const insets = useSafeAreaInsets();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tooShort, setTooShort] = useState(false);
  const startedAt = useRef(0);

  const start = async () => {
    if (!camera.current || !ready) return;

    tapHaptic();
    setTooShort(false);
    setElapsed(0);
    setRecording(true);
    startedAt.current = Date.now();
    const recordedAt = new Date().toISOString();

    try {
      const result = await camera.current.recordAsync({ maxDuration: maxSeconds, progressUpdateInterval: 0.25 });
      const durationSeconds = Math.min(maxSeconds, (Date.now() - startedAt.current) / 1000);
      setRecording(false);
      if (!result?.uri) return;

      if (durationSeconds < VIDEO_RECORDING_MIN_SECONDS) {
        errorHaptic();
        setTooShort(true);
        return;
      }

      onRecorded({ uri: result.uri, durationSeconds, recordedAt });
    } catch {
      setRecording(false);
      errorHaptic();
    }
  };

  const stop = () => {
    tapHaptic();
    camera.current?.stopRecording();
  };

  return (
    <View style={styles.black}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        mode="video"
        facing={facing}
        videoQuality="720p"
        onCameraReady={() => setReady(true)}
        onRecordingProgress={(progress) => setElapsed(progress.duration)}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.xs }]}>
        {!recording && <CloseButton onPress={onClose} />}
        <View style={styles.grow} />
        <View style={[styles.timer, recording && { backgroundColor: colors.danger }]}>
          <Text variant="captionStrong" color={CAMERA_CHROME.foreground} style={styles.tabular}>
            {`${formatDuration(elapsed)} / ${formatDuration(maxSeconds)}`}
          </Text>
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <Text variant="caption" color={CAMERA_CHROME.foreground} style={styles.centerText}>
          {tooShort
            ? t('recordingTooShort', { count: VIDEO_RECORDING_MIN_SECONDS })
            : recording
              ? t('recordingInProgress')
              : t('recordingReady', { duration: formatDuration(maxSeconds) })}
        </Text>
        <View style={styles.controls}>
          <View style={styles.sideControl} />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t(recording ? 'stopRecording' : 'startRecording')}
            disabled={!ready}
            onPress={recording ? stop : () => void start()}
            style={styles.shutter}
          >
            <Animated.View
              style={{
                width: recording ? 28 : 60,
                height: recording ? 28 : 60,
                borderRadius: recording ? 6 : 30,
                backgroundColor: colors.danger,
                transitionProperty: ['width', 'height', 'borderRadius'],
                transitionDuration: DURATION.fast
              }}
            />
          </PressableScale>
          <View style={styles.sideControl}>
            {!recording && (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t('switchCamera')}
                hitSlop={HIT_SLOP}
                onPress={() => {
                  tapHaptic();
                  setFacing((current) => (current === 'front' ? 'back' : 'front'));
                }}
                style={styles.flip}
              >
                <Icon icon={ArrowsClockwiseIcon} size={22} color={CAMERA_CHROME.foreground} />
              </PressableScale>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function TakePreview({
  take,
  onRetake,
  onUse,
  onClose
}: {
  take: RecordedVideo;
  onRetake: () => void;
  onUse: () => void;
  onClose: () => void;
}) {
  const t = useTranslations(exerciseCatalog);
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(take.uri, (instance) => {
    instance.loop = true;
    instance.play();
  });

  return (
    <View style={styles.black}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.xs }]}>
        <CloseButton onPress={onClose} />
        <View style={styles.grow} />
        <View style={styles.timer}>
          <Text variant="captionStrong" color={CAMERA_CHROME.foreground} style={styles.tabular}>
            {formatDuration(take.durationSeconds)}
          </Text>
        </View>
      </View>
      <View style={[styles.previewActions, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <Button variant="secondary" size="lg" style={styles.grow} onPress={onRetake}>
          <ButtonIcon icon={ArrowsClockwiseIcon} />
          <ButtonText>{t('retake')}</ButtonText>
        </Button>
        <Button size="lg" style={styles.grow} onPress={onUse}>
          <ButtonText>{t('useVideo')}</ButtonText>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: CAMERA_CHROME.background },
  prompt: { flex: 1, paddingHorizontal: GUTTER },
  promptBody: { flex: 1, justifyContent: 'center', gap: SPACING.md },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md },
  grow: { flex: 1 },
  timer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: 6,
    backgroundColor: CAMERA_CHROME.scrim
  },
  tabular: { fontVariant: ['tabular-nums'] },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: SPACING.md, paddingHorizontal: GUTTER },
  centerText: { textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideControl: { width: 56, alignItems: 'center' },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: CAMERA_CHROME.foreground,
    alignItems: 'center',
    justifyContent: 'center'
  },
  flip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CAMERA_CHROME.scrim
  },
  previewActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: GUTTER
  }
});
