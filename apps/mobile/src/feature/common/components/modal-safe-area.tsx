import type { ComponentType } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Gives a modal screen its own safe-area insets. A modal inside a tab stack otherwise inherits the tab's insets, whose
 * bottom includes the tab bar the modal covers.
 */
export function withModalSafeArea<Props extends object>(Screen: ComponentType<Props>) {
  function ModalScreen(props: Props) {
    return (
      <SafeAreaProvider>
        <Screen {...props} />
      </SafeAreaProvider>
    );
  }

  return ModalScreen;
}
