import { useEvent } from 'expo';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { VIDEO_COLORS } from '@/feature/lesson/constants/playback';
import { activeSegmentIndex } from '@/feature/lesson/helpers/transcript';

import { useNativeVideo } from './native-video-context';

/** Transcript lines drawn over the video when captions come from the transcript rather than a subtitle track. */
export function VideoCaptions({ bottomOffset = 56 }: { bottomOffset?: number }) {
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
    <View pointerEvents="none" style={[styles.anchor, { bottom: bottomOffset }]}>
      <Text variant="captionStrong" style={styles.caption} accessibilityLiveRegion="polite">
        {segment.text.trim()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', left: SPACING.md, right: SPACING.md, alignItems: 'center' },
  caption: {
    color: VIDEO_COLORS.captionText,
    textAlign: 'center',
    backgroundColor: VIDEO_COLORS.captionBackground,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    borderRadius: RADII.xs,
    overflow: 'hidden'
  }
});
