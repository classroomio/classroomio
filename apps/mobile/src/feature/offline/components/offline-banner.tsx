import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import { useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useUnsyncedCount } from '@/feature/offline/helpers/sync-queue';
import { offlineCatalog } from '@/feature/offline/translations/catalog';
import type { en } from '@/feature/offline/translations/en';

/** Native tab bars draw over the bottom inset; the banner sits above them on tab screens. */
const TAB_BAR_CLEARANCE = Platform.select({ ios: 64, default: 80 });

const entering = FadeInDown.duration(220).easing(EASE_OUT);
const exiting = FadeOutDown.duration(160).easing(EASE_OUT);

function syncLine(count: number, t: Translator<typeof en>) {
  if (count === 0) return t('syncsOnReconnect');

  return t('changesWaiting', { count });
}

/** App-wide notice shown while the device has no connection. It never takes touches, so controls under it still work. */
export function OfflineBanner() {
  const t = useTranslations(offlineCatalog);
  const offline = useIsOffline();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  const unsynced = useUnsyncedCount();
  const { colors, elevation } = useTheme();

  useEffect(() => {
    if (offline) AccessibilityInfo.announceForAccessibility(t('youAreOffline'));
  }, [offline, t]);

  const bottom = insets.bottom + (segments.includes('(tabs)') ? TAB_BAR_CLEARANCE : 0) + SPACING.xs;

  return (
    <View pointerEvents="none" style={[styles.anchor, { bottom }]}>
      {offline ? (
        <Animated.View
          entering={entering}
          exiting={exiting}
          accessible
          accessibilityLabel={`${t('offline')}. ${syncLine(unsynced, t)}`}
          style={[styles.strip, elevation.floating, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Icon icon={WifiSlashIcon} size={15} tone="muted" />
          <Text variant="captionStrong">{t('offline')}</Text>
          <Text variant="caption" tone="muted" numberOfLines={1} style={styles.detail}>
            {syncLine(unsynced, t)}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', left: GUTTER, right: GUTTER, alignItems: 'center' },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    maxWidth: '100%',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  detail: { flexShrink: 1 }
});
