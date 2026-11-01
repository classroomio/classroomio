import { useNetworkState } from 'expo-network';

/** True only when the device reports no connection or no internet; unknown states count as online. */
export function useIsOffline() {
  const network = useNetworkState();

  return network.isConnected === false || network.isInternetReachable === false;
}
