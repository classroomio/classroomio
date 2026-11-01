import { createContext, use, useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  makeMutable,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_IN_OUT } from '@/feature/common/constants/motion';
import { TEXT_VARIANTS, type TextVariant } from '@/feature/common/constants/typography';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { ItemGroup } from './item';
import { NotchCard } from './notch-card';

const PULSE_LOW = 0.5;
const PULSE_DURATION = 900;

const pulse = makeMutable(1);
let pulseConsumers = 0;

function retainPulse() {
  pulseConsumers += 1;
  if (pulseConsumers === 1) {
    pulse.set(withRepeat(withTiming(PULSE_LOW, { duration: PULSE_DURATION, easing: EASE_IN_OUT }), -1, true));
  }
}

function releasePulse() {
  pulseConsumers -= 1;
  if (pulseConsumers === 0) {
    cancelAnimation(pulse);
    pulse.set(1);
  }
}

/** Every mounted placeholder reads one shared, app-wide pulse, so they breathe in step and cost one animation. */
function usePulseStyle() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    retainPulse();

    return releasePulse;
  }, [reducedMotion]);

  return useAnimatedStyle(() => ({ opacity: reducedMotion ? 1 : pulse.get() }));
}

type SkeletonGroupValue = { grouped: boolean; color?: string };

const SkeletonGroupContext = createContext<SkeletonGroupValue>({ grouped: false });

type SkeletonGroupProps = {
  /** Bone colour for placeholders on a sand surface. */
  color?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Pulses its placeholders as one layer. Wrap bones only; a frame inside the group pulses with them. */
export function SkeletonGroup({ color, style, children }: SkeletonGroupProps) {
  const parent = use(SkeletonGroupContext);
  const resolvedColor = color ?? parent.color;

  if (parent.grouped) {
    return (
      <SkeletonGroupContext value={{ grouped: true, color: resolvedColor }}>
        <View style={style}>{children}</View>
      </SkeletonGroupContext>
    );
  }

  return (
    <SkeletonGroupContext value={{ grouped: true, color: resolvedColor }}>
      <PulsingGroup style={style}>{children}</PulsingGroup>
    </SkeletonGroupContext>
  );
}

function PulsingGroup({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const animatedStyle = usePulseStyle();

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[style, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height, radius = RADII.input, style }: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const group = use(SkeletonGroupContext);
  const color = group.color ?? (isDark ? colors.border : colors.sandStrong);
  const boneStyle = [{ width, height, borderRadius: radius, backgroundColor: color }, style];

  if (group.grouped) return <View style={boneStyle} />;

  return <PulsingBone style={boneStyle} />;
}

function PulsingBone({ style }: { style: StyleProp<ViewStyle> }) {
  const animatedStyle = usePulseStyle();

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[style, animatedStyle]}
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  /** The text variant being stood in for; each line takes that variant's line height so nothing shifts on load. */
  variant?: TextVariant;
  lastLineWidth?: DimensionValue;
  width?: DimensionValue;
};

export function SkeletonText({
  lines = 2,
  variant = 'body',
  lastLineWidth = '60%',
  width = '100%'
}: SkeletonTextProps) {
  const { fontSize = 16, lineHeight = 24 } = TEXT_VARIANTS[variant];
  const boneHeight = Math.round(fontSize * 0.72);

  return (
    <View style={{ width }}>
      {Array.from({ length: lines }, (_, index) => (
        <View key={index} style={[styles.textLine, { height: lineHeight }]}>
          <Skeleton
            height={boneHeight}
            radius={RADII.xs}
            width={index === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          />
        </View>
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} radius={size / 2} />;
}

export function SkeletonThumbnail({
  width = 40,
  height = 40,
  radius = RADII.md
}: {
  width?: number;
  height?: number;
  radius?: number;
}) {
  return <Skeleton width={width} height={height} radius={radius} />;
}

type SkeletonRowProps = {
  /** Matches `ItemMedia`: a round avatar, a 40pt tile, or nothing. */
  media?: 'avatar' | 'thumbnail' | 'none';
  lines?: 1 | 2;
};

/** The shape of an `Item` row while it loads. */
export function SkeletonRow({ media = 'avatar', lines = 2 }: SkeletonRowProps) {
  return (
    <SkeletonGroup style={styles.row}>
      {media === 'avatar' ? <SkeletonAvatar /> : null}
      {media === 'thumbnail' ? <SkeletonThumbnail /> : null}
      <View style={styles.rowContent}>
        <SkeletonText variant="bodyStrong" lines={1} width="70%" />
        {lines === 2 ? <SkeletonText variant="caption" lines={1} width="45%" /> : null}
      </View>
    </SkeletonGroup>
  );
}

type SkeletonListProps = SkeletonRowProps & { count?: number; style?: StyleProp<ViewStyle> };

/** The shape of an `ItemGroup` while it loads. */
export function SkeletonList({ count = 3, media, lines, style }: SkeletonListProps) {
  return (
    <ItemGroup style={style}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonRow key={index} media={media} lines={lines} />
      ))}
    </ItemGroup>
  );
}

type SkeletonCardProps = {
  /** Height of a cover image placeholder at the top of the card. */
  coverHeight?: number;
  lines?: number;
  style?: StyleProp<ViewStyle>;
  /** Custom bones; replaces the default title and lines. */
  children?: ReactNode;
};

/** The shape of a `Card` while it loads. The frame stays still; only the bones pulse. */
export function SkeletonCard({ coverHeight, lines = 2, style, children }: SkeletonCardProps) {
  const { colors, elevation } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised, style]}
    >
      <SkeletonGroup>
        {coverHeight ? <Skeleton height={coverHeight} radius={0} /> : null}
        <View style={styles.cardBody}>
          {children ?? (
            <>
              <SkeletonText variant="heading" lines={1} width="65%" />
              <SkeletonText variant="caption" lines={lines} />
            </>
          )}
        </View>
      </SkeletonGroup>
    </View>
  );
}

type SkeletonBlockProps = {
  lines?: number;
  /** Colour of the surface the block sits on, so the notch reads as a cut-out. */
  cutoutColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** A notch card placeholder, the brand's loading block for featured content. */
export function SkeletonBlock({ lines = 2, cutoutColor, style }: SkeletonBlockProps) {
  const { colors, isDark } = useTheme();

  return (
    <NotchCard cutoutColor={cutoutColor} style={style}>
      <SkeletonGroup color={isDark ? colors.borderStrong : colors.border} style={styles.block}>
        <Skeleton height={8} width={72} radius={RADII.xs} />
        <SkeletonText variant="heading" lines={1} width="75%" />
        {lines > 1 ? <SkeletonText variant="caption" lines={lines - 1} /> : null}
      </SkeletonGroup>
    </NotchCard>
  );
}

const styles = StyleSheet.create({
  textLine: { justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm
  },
  rowContent: { flex: 1 },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  cardBody: { gap: SPACING.xxs, padding: SPACING.md },
  block: { gap: SPACING.xs }
});
