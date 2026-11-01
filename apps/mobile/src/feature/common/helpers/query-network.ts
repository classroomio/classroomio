import { onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener } from 'expo-network';

/** Pauses React Query fetches while the device is offline and resumes them on reconnect. */
export function connectQueryNetworkStatus() {
  onlineManager.setEventListener((setOnline) => {
    const subscription = addNetworkStateListener((state) => setOnline(state.isConnected !== false));

    return () => subscription.remove();
  });
}
