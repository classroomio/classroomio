import { GearIcon } from 'phosphor-react-native/src/icons/Gear';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Avatar } from '@/feature/common/components/avatar';
import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { darken, withAlpha } from '@/feature/common/helpers/color';
import { useTheme } from '@/feature/common/helpers/use-theme';

export const PROFILE_COVER_HEIGHT = 128;
const AVATAR_SIZE = 88;
const AVATAR_RING = 4;

function notchBlockPath(x: number, y: number, width: number, height: number, radius: number, notchX: number) {
  const nx = x + notchX;

  return [
    `M ${x + radius} ${y}`,
    `H ${nx}`,
    `Q ${nx + 4.4} ${y} ${nx + 5.6} ${y + 2.6}`,
    `L ${nx + 8} ${y + 8.4}`,
    `Q ${nx + 9.1} ${y + 11} ${nx + 11.8} ${y + 11}`,
    `H ${nx + 34.2}`,
    `Q ${nx + 36.9} ${y + 11} ${nx + 38} ${y + 8.4}`,
    `L ${nx + 40.4} ${y + 2.6}`,
    `Q ${nx + 41.6} ${y} ${nx + 46} ${y}`,
    `H ${x + width - radius}`,
    `Q ${x + width} ${y} ${x + width} ${y + radius}`,
    `V ${y + height - radius}`,
    `Q ${x + width} ${y + height} ${x + width - radius} ${y + height}`,
    `H ${x + radius}`,
    `Q ${x} ${y + height} ${x} ${y + height - radius}`,
    `V ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    'Z'
  ].join(' ');
}

/**
 * The brand cover behind the profile: an org-coloured gradient with the notch blocks across it. Pulling past the
 * top stretches the gradient up from its bottom edge, so the cover always reaches the top of the screen.
 */
function ProfileCover({ height, scrollY }: { height: number; scrollY?: SharedValue<number> }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const stretchStyle = useAnimatedStyle(() => {
    const pull = Math.max(0, -(scrollY?.get() ?? 0));

    return { transform: [{ scaleY: 1 + pull / height }] };
  });

  return (
    <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, styles.stretchOrigin, stretchStyle]}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="cover" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.primary} />
              <Stop offset="1" stopColor={darken(colors.primary, 0.38)} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} fill="url(#cover)" />
        </Svg>
      </Animated.View>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={notchBlockPath(width - 168, height - 104, 150, 40, 9, 18)} fill={colors.onPrimary} opacity={0.12} />
        <Path d={notchBlockPath(width - 222, height - 58, 150, 40, 9, 18)} fill={colors.onPrimary} opacity={0.09} />
        <Path d={notchBlockPath(width - 64, height - 58, 150, 40, 9, 18)} fill={colors.onPrimary} opacity={0.06} />
      </Svg>
    </View>
  );
}

type ProfileHeroProps = {
  name: string | null;
  email: string | null;
  avatarUrl?: string | null;
  meta?: ReactNode;
  editLabel: string;
  settingsLabel: string;
  onEdit: () => void;
  onOpenSettings: () => void;
  /** Scroll offset of the screen; a negative value (pulling past the top) stretches the cover. */
  scrollY?: SharedValue<number>;
};

export function ProfileHero({
  name,
  email,
  avatarUrl,
  meta,
  editLabel,
  settingsLabel,
  onEdit,
  onOpenSettings,
  scrollY
}: ProfileHeroProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const coverHeight = insets.top + PROFILE_COVER_HEIGHT;

  return (
    <View>
      <View style={{ height: coverHeight }}>
        <ProfileCover height={coverHeight} scrollY={scrollY} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={settingsLabel}
          hitSlop={HIT_SLOP}
          onPress={onOpenSettings}
          style={({ pressed }) => [
            styles.coverButton,
            {
              top: insets.top + SPACING.xs,
              backgroundColor: withAlpha(colors.onPrimary, pressed ? 0.28 : 0.18)
            }
          ]}
        >
          <Icon icon={GearIcon} size={21} color={colors.onPrimary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.avatarRow}>
          <View style={[styles.ring, { backgroundColor: colors.background }]}>
            {name === null ? (
              <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} radius={AVATAR_SIZE / 2} />
            ) : (
              <Avatar name={name || email || '?'} uri={avatarUrl} size={AVATAR_SIZE} />
            )}
          </View>
          <Button variant="outline" size="sm" onPress={onEdit} style={styles.edit}>
            <ButtonIcon icon={PencilSimpleIcon} />
            <ButtonText>{editLabel}</ButtonText>
          </Button>
        </View>

        <View style={styles.identity}>
          {name === null ? (
            <>
              <Skeleton width="55%" height={26} />
              <Skeleton width="70%" height={16} />
            </>
          ) : (
            <>
              <Text variant="display" numberOfLines={2}>
                {name}
              </Text>
              {email ? (
                <Text variant="body" tone="muted" numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
            </>
          )}
        </View>
        {meta}
      </View>
    </View>
  );
}

export function ProfileMeta({ children }: { children: ReactNode }) {
  return <View style={styles.meta}>{children}</View>;
}

const styles = StyleSheet.create({
  stretchOrigin: { transformOrigin: 'bottom' },
  coverButton: {
    position: 'absolute',
    right: GUTTER,
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: { paddingHorizontal: GUTTER, gap: SPACING.sm },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -(AVATAR_SIZE / 2 + AVATAR_RING)
  },
  ring: { padding: AVATAR_RING, borderRadius: RADII.pill },
  edit: { marginBottom: SPACING.xxs },
  identity: { gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.xs }
});
