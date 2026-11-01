import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The device's safe-area insets, for UI drawn over the whole window such as sheets. `useSafeAreaInsets` inside a tab
 * screen includes the tab bar in its bottom inset. Launch metrics assume portrait; UI shown in landscape (fullscreen
 * video) uses its own `SafeAreaProvider` instead.
 */
export function useWindowInsets() {
  const screenInsets = useSafeAreaInsets();

  return initialWindowMetrics?.insets ?? screenInsets;
}
