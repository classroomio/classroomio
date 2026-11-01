import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { selectionHaptic, tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { UnsupportedQuestion } from '@/feature/exercise/components/unsupported-question';
import { questionImageUrlsOf, stringSetting } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const MARKER_SIZE = 28;
const REMOVE_RADIUS_PERCENT = 6;
const MAX_POINTS = 10;

type Point = { x: number; y: number };

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function HotspotQuestion({ question }: { question: ExerciseQuestion }) {
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const { answer, setAnswer } = useQuestionAnswer(question, 'HOTSPOT');
  const imageUrl = stringSetting(question, 'hotspotImageUrl') || questionImageUrlsOf(question)[0];
  const [aspectRatio, setAspectRatio] = useState(4 / 3);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const points = answer?.coordinates ?? [];

  const commit = (next: Point[]) => setAnswer(next.length > 0 ? { type: 'HOTSPOT', coordinates: next } : null);

  const handleTap = (x: number, y: number) => {
    if (size.width === 0 || size.height === 0) return;

    const tapped = { x: round((x / size.width) * 100), y: round((y / size.height) * 100) };
    const hitIndex = points.findIndex(
      (point) => Math.hypot(point.x - tapped.x, (point.y - tapped.y) / aspectRatio) <= REMOVE_RADIUS_PERCENT
    );

    if (hitIndex >= 0) {
      tapHaptic();
      commit(points.filter((_, index) => index !== hitIndex));
      return;
    }

    if (points.length >= MAX_POINTS) return;

    selectionHaptic();
    commit([...points, tapped]);
  };

  const tap = useTapGesture({
    runOnJS: true,
    onActivate: (event) => handleTap(event.x, event.y)
  });

  if (!imageUrl) return <UnsupportedQuestion reason={t('hotspotNoImage')} />;

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={tap}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t('hotspotAccessibilityLabel', { count: points.length })}
          accessibilityHint={t('hotspotAccessibilityHint')}
          onLayout={(event) => setSize(event.nativeEvent.layout)}
          style={[styles.frame, { aspectRatio, backgroundColor: colors.muted, borderColor: colors.border }]}
        >
          <Image
            source={{ uri: imageUrl }}
            contentFit="fill"
            transition={150}
            onLoad={(event) => {
              if (event.source.width > 0 && event.source.height > 0) {
                setAspectRatio(event.source.width / event.source.height);
              }
            }}
            style={StyleSheet.absoluteFill}
          />
          {points.map((point, index) => (
            <Animated.View
              key={`${point.x}-${point.y}`}
              entering={ZoomIn.duration(DURATION.fast).easing(EASE_OUT)}
              pointerEvents="none"
              style={[
                styles.marker,
                {
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  backgroundColor: colors.primary,
                  borderColor: colors.onPrimary
                }
              ]}
            >
              <Text variant="micro" tone="onPrimary">
                {index + 1}
              </Text>
            </Animated.View>
          ))}
        </View>
      </GestureDetector>
      <View style={styles.footer}>
        <Text variant="caption" tone="muted" style={styles.hint}>
          {t(points.length === 0 ? 'hotspotPrompt' : 'hotspotRemoveHint')}
        </Text>
        {points.length > 0 && (
          <Button variant="ghost" size="sm" onPress={() => commit([])}>
            <ButtonIcon icon={ArrowCounterClockwiseIcon} />
            <ButtonText>{t('clear')}</ButtonText>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.xs },
  frame: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  marker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    marginLeft: -MARKER_SIZE / 2,
    marginTop: -MARKER_SIZE / 2,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 34 },
  hint: { flex: 1 }
});
