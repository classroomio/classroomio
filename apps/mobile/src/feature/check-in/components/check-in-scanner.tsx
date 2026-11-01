import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { IconTile } from '@/feature/common/components/icon-tile';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { warningHaptic } from '@/feature/common/helpers/haptics';
import { withAlpha } from '@/feature/common/helpers/color';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { parseCheckInPayload, type CheckInTarget } from '@/feature/check-in/helpers/check-in-code';
import { checkInCatalog } from '@/feature/check-in/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const REJECTED_NOTICE_MS = 2500;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;

type CheckInScannerProps = {
  /** Pauses the camera, for example while the code field has focus. */
  paused?: boolean;
  onScan: (target: CheckInTarget) => void;
};

/** A square camera viewfinder that reads check-in QR codes, or the camera permission prompt in its place. */
export function CheckInScanner({ paused = false, onScan }: CheckInScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <ViewfinderFrame />;

  if (!permission.granted) {
    return (
      <CameraPermissionPrompt
        blocked={!permission.canAskAgain}
        onAllow={() => void requestPermission()}
        onOpenSettings={() => void Linking.openSettings()}
      />
    );
  }

  return <ScanningViewfinder paused={paused} onScan={onScan} />;
}

function ViewfinderFrame({ children }: { children?: ReactNode }) {
  const { colors } = useTheme();

  return <View style={[styles.frame, { backgroundColor: colors.muted, borderColor: colors.border }]}>{children}</View>;
}

function ScanningViewfinder({ paused, onScan }: Required<CheckInScannerProps>) {
  const t = useTranslations(checkInCatalog);
  const { colors } = useTheme();
  const focused = useIsFocused();
  const handled = useRef(false);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    if (!rejected) return;

    const timer = setTimeout(() => setRejected(false), REJECTED_NOTICE_MS);

    return () => clearTimeout(timer);
  }, [rejected]);

  const handleScan = ({ data }: BarcodeScanningResult) => {
    if (handled.current || rejected) return;

    const target = parseCheckInPayload(data);
    if (!target) {
      warningHaptic();
      setRejected(true);
      return;
    }

    handled.current = true;
    onScan(target);
  };

  return (
    <View
      style={[styles.frame, { backgroundColor: colors.artworkScrim, borderColor: colors.border }]}
      accessible
      accessibilityLabel={t('viewfinderA11y')}
    >
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        active={focused && !paused}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={focused && !paused ? handleScan : undefined}
      />
      <View pointerEvents="none" style={styles.corners}>
        {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map((corner) => (
          <View key={corner} style={[styles.corner, styles[corner], { borderColor: colors.onSolid }]} />
        ))}
      </View>
      {rejected ? (
        <Animated.View
          entering={FadeIn.duration(DURATION.fast).easing(EASE_OUT)}
          exiting={FadeOut.duration(DURATION.fast).easing(EASE_OUT)}
          style={[styles.notice, { backgroundColor: withAlpha(colors.artworkScrim, 0.72) }]}
        >
          <Icon icon={WarningCircleIcon} size={16} color={colors.onSolid} weight="fill" />
          <Text variant="captionStrong" style={[styles.noticeText, { color: colors.onSolid }]}>
            {t('notCheckInCode')}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

type CameraPermissionPromptProps = { blocked: boolean; onAllow: () => void; onOpenSettings: () => void };

function CameraPermissionPrompt({ blocked, onAllow, onOpenSettings }: CameraPermissionPromptProps) {
  const t = useTranslations(checkInCatalog);
  const { colors } = useTheme();

  return (
    <ViewfinderFrame>
      <View style={styles.prompt}>
        <IconTile icon={CameraIcon} tone="primary" size={52} />
        <View style={styles.promptCopy}>
          <Text variant="heading" style={styles.centered}>
            {t('cameraTitle')}
          </Text>
          <Text variant="caption" tone="muted" style={styles.centered}>
            {blocked ? t('cameraBlocked') : t('cameraExplanation')}
          </Text>
        </View>
        <Button size="md" onPress={blocked ? onOpenSettings : onAllow}>
          <ButtonText>{blocked ? t('openSettings') : t('allowCamera')}</ButtonText>
        </Button>
      </View>
    </ViewfinderFrame>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.sheet,
    borderCurve: 'continuous'
  },
  corners: { ...StyleSheet.absoluteFill, margin: '18%' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: RADII.md
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: RADII.md
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: RADII.md
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: RADII.md
  },
  notice: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  noticeText: { flex: 1 },
  prompt: { alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  promptCopy: { gap: SPACING.xxs },
  centered: { textAlign: 'center' }
});
