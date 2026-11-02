import { onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';
import { AppState } from 'react-native';

/** Unknown states count as online. */
const isOnline = (state: NetworkState) => state.isConnected !== false && state.isInternetReachable !== false;

/**
 * Pauses React Query fetches while the device is offline and resumes them on reconnect. The state is re-read on
 * launch and on every return to the foreground, because iOS can drop the reconnect event while the app is suspended.
 */
export function connectQueryNetworkStatus() {
  onlineManager.setEventListener((setOnline) => {
    const sync = () =>
      void getNetworkStateAsync()
        .then((state) => setOnline(isOnline(state)))
        .catch(() => {});

    sync();
    const networkSubscription = addNetworkStateListener((state) => setOnline(isOnline(state)));
    const appStateSubscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') sync();
    });

    return () => {
      networkSubscription.remove();
      appStateSubscription.remove();
    };
  });
}
