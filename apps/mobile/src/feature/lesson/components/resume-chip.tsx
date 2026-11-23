import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { VIDEO_COLORS } from '@/feature/lesson/constants/playback';
import { formatTimestamp } from '@/feature/lesson/helpers/transcript';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';

import { useNativeVideo } from './native-video-context';

const VISIBLE_MS = 4000;

/** "Resumed from 1:42" over the top of the video for a few seconds after playback picks up where it stopped. */
export function ResumeChip() {
  const t = useTranslations(lessonCatalog);
  const { resumedFrom, clearResumed } = useNativeVideo();

  useEffect(() => {
    if (resumedFrom === null) return;

    const timer = setTimeout(clearResumed, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [resumedFrom, clearResumed]);

  if (resumedFrom === null) return null;

  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.duration(DURATION.base).easing(EASE_OUT)}
      exiting={FadeOut.duration(DURATION.fast)}
      accessibilityLiveRegion="polite"
      style={[styles.chip, { backgroundColor: VIDEO_COLORS.captionBackground }]}
    >
      <Text variant="captionStrong" color={VIDEO_COLORS.control}>
        {t('resumedFrom', { time: formatTimestamp(resumedFrom) })}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs + 2,
    borderRadius: RADII.md
  }
});
