import { useIsFocused } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { css, useReducedMotion, type CSSAnimationKeyframes } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Polygon, Rect } from 'react-native-svg';

import {
  ILLUSTRATION_SCENES,
  type IllustrationName,
  type SceneMotion,
  type Shape,
  type ShapeClass
} from '@/feature/brand/constants/illustration-scenes';
import { useTheme } from '@/feature/common/helpers/use-theme';

type Palette = { face: string; line: string; faint: string; accent: string };

// A fall accelerates, so ease-in is deliberate here.
const DROP_CURVE = 'ease-in';
const SETTLE_CURVE = 'ease-out';

function percent(fraction: number) {
  return `${Math.round(fraction * 10000) / 100}%`;
}

function motionKeyframes(motion: SceneMotion): CSSAnimationKeyframes {
  switch (motion.kind) {
    case 'bob':
      return {
        0: { transform: [{ translateY: '0%' }] },
        50: { transform: [{ translateY: percent(-motion.distance) }] },
        100: { transform: [{ translateY: '0%' }] }
      };
    case 'drop':
      return {
        0: { opacity: 0, transform: [{ translateY: percent(-motion.distance) }] },
        10: {
          opacity: 1,
          transform: [{ translateY: percent(-motion.distance) }],
          animationTimingFunction: DROP_CURVE
        },
        24: { transform: [{ translateY: '0%' }], animationTimingFunction: SETTLE_CURVE },
        28: { transform: [{ translateY: percent(-0.012) }], animationTimingFunction: SETTLE_CURVE },
        32: { transform: [{ translateY: '0%' }] },
        84: { opacity: 1, transform: [{ translateY: '0%' }] },
        94: { opacity: 0, transform: [{ translateY: '0%' }] },
        100: { opacity: 0, transform: [{ translateY: percent(-motion.distance) }] }
      };
    case 'press':
      return {
        0: { transform: [{ translateY: '0%' }] },
        34: { transform: [{ translateY: '0%' }], animationTimingFunction: DROP_CURVE },
        44: { transform: [{ translateY: percent(motion.distance) }] },
        54: { transform: [{ translateY: percent(motion.distance) }], animationTimingFunction: SETTLE_CURVE },
        76: { transform: [{ translateY: '0%' }] },
        100: { transform: [{ translateY: '0%' }] }
      };
    case 'swing':
      return {
        0: { transform: [{ rotate: `${-motion.angle}deg` }] },
        50: { transform: [{ rotate: `${motion.angle}deg` }] },
        100: { transform: [{ rotate: `${-motion.angle}deg` }] }
      };
    case 'travel': {
      const start = [{ translateX: percent(-motion.dx / 2) }, { translateY: percent(-motion.dy / 2) }];
      const end = [{ translateX: percent(motion.dx / 2) }, { translateY: percent(motion.dy / 2) }];

      return {
        0: { opacity: 0, transform: start },
        14: { opacity: 1 },
        72: { opacity: 1, transform: end },
        86: { opacity: 0, transform: end },
        100: { opacity: 0, transform: end }
      };
    }
  }
}

const KEYFRAMES = new Map<SceneMotion, ReturnType<typeof css.keyframes>>();

function keyframesFor(motion: SceneMotion) {
  let rule = KEYFRAMES.get(motion);
  if (!rule) {
    const frames = Object.entries(motionKeyframes(motion)).map(([offset, frame]) => [`${offset}%`, frame]);
    rule = css.keyframes(Object.fromEntries(frames));
    KEYFRAMES.set(motion, rule);
  }

  return rule;
}

function strokeProps(cls: ShapeClass, palette: Palette) {
  switch (cls) {
    case 'ln':
      return { fill: palette.face, stroke: palette.line, strokeWidth: 1.1 };
    case 'lo':
      return { fill: 'none', stroke: palette.line, strokeWidth: 1.1 };
    case 'lt':
      return { fill: 'none', stroke: palette.faint, strokeWidth: 1 };
    case 'dash':
      return { fill: 'none', stroke: palette.line, strokeWidth: 1.1, strokeDasharray: '3 4' };
    case 'ink':
      return { fill: palette.face, stroke: palette.accent, strokeWidth: 1.5 };
    case 'ko':
      return { fill: 'none', stroke: palette.accent, strokeWidth: 1.5 };
    case 'kf':
      return { fill: palette.accent };
    case 'dot':
      return { fill: palette.line };
  }
}

function renderShape(shape: Shape, palette: Palette, key: number): ReactNode {
  if (shape.kind === 'group') {
    return (
      <G key={key} transform={shape.transform}>
        {shape.children.map((child, index) => renderShape(child, palette, index))}
      </G>
    );
  }

  const common = {
    ...strokeProps(shape.cls, palette),
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
    vectorEffect: 'non-scaling-stroke' as const
  };

  switch (shape.kind) {
    case 'polygon':
      return <Polygon key={key} points={shape.points} {...common} />;
    case 'path':
      return <Path key={key} d={shape.d} {...common} />;
    case 'circle':
      return <Circle key={key} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
    case 'rect':
      return (
        <Rect key={key} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} {...common} />
      );
  }
}

type IllustrationProps = {
  name: IllustrationName;
  /** Rendered height in points; the width follows the drawing's aspect ratio. */
  size?: number;
  /** Colour behind the drawing, so hidden lines stay hidden. Defaults to the screen background. */
  surface?: string;
  /** Loops the accent part. Off under reduced motion and while the screen is not focused. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** An isometric line drawing from the brand's Machines family: neutral hairlines with one accent part. */
export function Illustration({ name, size = 140, surface, animated = true, style }: IllustrationProps) {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const focused = useIsFocused();
  const scene = ILLUSTRATION_SCENES[name];
  const width = (size * scene.width) / scene.height;
  const viewBox = `0 0 ${scene.width} ${scene.height}`;
  const palette: Palette = {
    face: surface ?? colors.background,
    line: isDark ? colors.inkMuted : colors.inkSubtle,
    faint: colors.borderStrong,
    accent: colors.primary
  };
  const moving = animated && !reducedMotion;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[{ width, height: size }, style]}
    >
      {scene.layers.map((layer, index) => {
        const drawing = (
          <Svg width={width} height={size} viewBox={viewBox}>
            {layer.shapes.map((shape, shapeIndex) => renderShape(shape, palette, shapeIndex))}
          </Svg>
        );

        if (!layer.motion || !moving) {
          return (
            <View key={index} style={StyleSheet.absoluteFill}>
              {drawing}
            </View>
          );
        }

        const motion = layer.motion;

        return (
          <Animated.View
            key={index}
            style={[
              StyleSheet.absoluteFill,
              motion.kind === 'swing' && { transformOrigin: `${percent(motion.originX)} ${percent(motion.originY)}` },
              {
                animationName: keyframesFor(motion),
                animationDuration: motion.duration,
                animationIterationCount: 'infinite',
                animationTimingFunction: motion.kind === 'bob' || motion.kind === 'swing' ? 'ease-in-out' : 'linear',
                animationPlayState: focused ? 'running' : 'paused'
              }
            ]}
          >
            {drawing}
          </Animated.View>
        );
      })}
    </View>
  );
}
