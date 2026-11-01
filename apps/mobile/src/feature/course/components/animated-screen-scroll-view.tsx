import Animated from 'react-native-reanimated';

import { ScreenScrollView } from '@/feature/common/components/screen';

/** `ScreenScrollView` that accepts a Reanimated scroll handler as `onScroll`. */
export const AnimatedScreenScrollView = Animated.createAnimatedComponent(ScreenScrollView);
