import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { VideoView } from 'expo-video';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { VIDEO_COLORS } from '@/feature/lesson/constants/playback';

import { useNativeVideo } from './native-video-context';
import { VideoCaptions } from './video-captions';
import { VideoControls } from './video-controls';

const DISMISS_FRACTION = 0.2;
const DISMISS_VELOCITY = 900;
const MIN_SCALE = 0.8;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ORIENTATIONS = ['portrait', 'landscape-left', 'landscape-right'] as const;

/** The video over the whole screen with the same controls; drag it down to close, like a native video app. */
export function VideoFullscreen({ onExit }: { onExit: () => void }) {
  return (
    <Modal
      visible
      animationType="fade"
      supportedOrientations={ORIENTATIONS}
      statusBarTranslucent
      onRequestClose={onExit}
    >
      <GestureHandlerRootView style={styles.fill}>
        <SafeAreaProvider>
          {/* Sheets opened in fullscreen would otherwise present behind this modal. */}
          <BottomSheetModalProvider>
            <StatusBar hidden />
            <FullscreenStage onExit={onExit} />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Modal>
  );
}

function FullscreenStage({ onExit }: { onExit: () => void }) {
  const { player, enforced } = useNativeVideo();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dragY = useSharedValue(0);

  const pan = usePanGesture({
    activeOffsetY: 14,
    failOffsetX: [-24, 24],
    onUpdate: (event) => {
      'worklet';
      dragY.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      'worklet';
      if (dragY.get() > height * DISMISS_FRACTION || event.velocityY > DISMISS_VELOCITY) {
        dragY.set(
          withTiming(height, { duration: 220, easing: EASE_OUT }, (finished) => {
            if (finished) scheduleOnRN(onExit);
          })
        );
        return;
      }

      dragY.set(withSpring(0, { duration: 300, dampingRatio: 1, velocity: event.velocityY }));
    }
  });

  const stageStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, dragY.get() / Math.max(1, height));

    return { transform: [{ translateY: dragY.get() }, { scale: 1 - progress * (1 - MIN_SCALE) }] };
  });
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, dragY.get() / Math.max(1, height))
  }));

  return (
    <View style={styles.fill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: VIDEO_COLORS.letterbox }, backdropStyle]} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.fill, stageStyle]}>
          <VideoView
            player={player}
            nativeControls={false}
            contentFit="contain"
            allowsPictureInPicture
            startsPictureInPictureAutomatically
            allowsVideoFrameAnalysis={false}
            requiresLinearPlayback={enforced}
            style={StyleSheet.absoluteFill}
          />
          <VideoCaptions bottomOffset={insets.bottom + 72} />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right
              }
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.fill}>
              <VideoControls fullscreen onFullscreen={onExit} />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 }
});
