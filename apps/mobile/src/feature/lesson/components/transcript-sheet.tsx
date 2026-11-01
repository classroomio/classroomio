import { useBottomSheetScrollableCreator } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useEvent } from 'expo';
import type { VideoPlayer } from 'expo-video';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetHeading,
  BottomSheetTitle
} from '@/feature/common/components/bottom-sheet';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { activeSegmentIndex, formatTimestamp } from '@/feature/lesson/helpers/transcript';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { TranscriptSegment } from '@/feature/lesson/types/lesson';

type TranscriptSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segments: TranscriptSegment[];
  /** The player the transcript belongs to; lines seek it when present. */
  player: VideoPlayer | null;
};

export function TranscriptSheet({ open, onOpenChange, segments, player }: TranscriptSheetProps) {
  const t = useTranslations(lessonCatalog);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent size="tall">
        <BottomSheetHeader>
          <BottomSheetHeading>
            <BottomSheetTitle>{t('transcript')}</BottomSheetTitle>
            <BottomSheetDescription>
              {player ? t('transcriptSheetTapLine') : t('transcriptLineCount', { count: segments.length })}
            </BottomSheetDescription>
          </BottomSheetHeading>
          <BottomSheetClose />
        </BottomSheetHeader>
        {player ? (
          <FollowingTranscript segments={segments} player={player} />
        ) : (
          <TranscriptLines segments={segments} activeIndex={-1} />
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}

function FollowingTranscript({ segments, player }: { segments: TranscriptSegment[]; player: VideoPlayer }) {
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0
  });

  return (
    <TranscriptLines
      segments={segments}
      activeIndex={activeSegmentIndex(segments, currentTime)}
      onSeek={(seconds) => {
        selectionHaptic();
        player.currentTime = seconds;
        if (!player.playing) player.play();
      }}
    />
  );
}

type TranscriptLinesProps = { segments: TranscriptSegment[]; activeIndex: number; onSeek?: (seconds: number) => void };

function TranscriptLines({ segments, activeIndex, onSeek }: TranscriptLinesProps) {
  const insets = useSafeAreaInsets();
  const sheetScroll = useBottomSheetScrollableCreator();

  return (
    <FlashList
      renderScrollComponent={sheetScroll}
      data={segments}
      extraData={activeIndex}
      keyExtractor={(segment, index) => `${segment.start}-${index}`}
      initialScrollIndex={activeIndex > 2 ? activeIndex - 2 : undefined}
      contentContainerStyle={{ paddingHorizontal: GUTTER - SPACING.xs, paddingBottom: insets.bottom + SPACING.lg }}
      renderItem={({ item, index }) => <TranscriptLine segment={item} active={index === activeIndex} onSeek={onSeek} />}
    />
  );
}

type TranscriptLineProps = { segment: TranscriptSegment; active: boolean; onSeek?: (seconds: number) => void };

function TranscriptLine({ segment, active, onSeek }: TranscriptLineProps) {
  const { colors } = useTheme();
  const t = useTranslations(lessonCatalog);
  const timestamp = formatTimestamp(segment.start);
  const content = (
    <>
      <Text variant="micro" tone={active ? 'primary' : 'subtle'} style={styles.time}>
        {timestamp}
      </Text>
      <Text variant={active ? 'captionStrong' : 'caption'} tone={active ? 'ink' : 'body'} style={styles.text}>
        {segment.text.trim()}
      </Text>
    </>
  );

  if (!onSeek) return <View style={styles.line}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${timestamp}, ${segment.text.trim()}`}
      accessibilityHint={t('playsFromLine')}
      accessibilityState={{ selected: active }}
      onPress={() => onSeek(segment.start)}
      style={({ pressed }) => [
        styles.line,
        active && { backgroundColor: colors.primaryTint },
        pressed && !active && { backgroundColor: colors.muted }
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  },
  time: { width: 44, paddingTop: 2, fontVariant: ['tabular-nums'] },
  text: { flex: 1 }
});
