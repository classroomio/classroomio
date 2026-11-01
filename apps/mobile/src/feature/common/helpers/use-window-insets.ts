import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The device's safe-area insets, for UI drawn over the whole window such as sheets. `useSafeAreaInsets` inside a tab
 * screen includes the tab bar in its bottom inset. The app is portrait-only, so the launch metrics stay valid.
 */
export function useWindowInsets() {
  const screenInsets = useSafeAreaInsets();

  return initialWindowMetrics?.insets ?? screenInsets;
}
