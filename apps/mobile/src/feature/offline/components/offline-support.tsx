import { useQueryClient } from '@tanstack/react-query';
import { addNetworkStateListener } from 'expo-network';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { useApi } from '@/feature/common/components/api-provider';
import { configureDownloads, pumpDownloads } from '@/feature/downloads/helpers/download-manager';
import { offlineSnapshotWriter } from '@/feature/downloads/helpers/offline-snapshots';
import { useAutoDownloadRequired } from '@/feature/downloads/helpers/use-auto-download';
import { loadSyncQueue } from '@/feature/offline/helpers/sync-queue';
import { configureSyncRunner, requestSync } from '@/feature/offline/helpers/sync-runner';
import { useServer } from '@/feature/server/components/server-provider';

import { OfflineBanner } from './offline-banner';

/**
 * Rendered once at the root: points downloads and the sync queue at the signed-in user, replays queued progress after
 * sign-in, on reconnect and when the app returns to the foreground, and shows the offline banner.
 */
export function OfflineSupport() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { serverUrl } = useServer();

  useEffect(() => {
    configureSyncRunner(userId ? { api, queryClient, userId } : null);
    void configureDownloads(userId ? { api, serverUrl, userId, snapshots: offlineSnapshotWriter } : null);
  }, [api, queryClient, serverUrl, userId]);

  useEffect(() => {
    void loadSyncQueue(userId).then(() => {
      if (userId) void requestSync();
    });
  }, [userId]);

  useEffect(() => {
    const network = addNetworkStateListener((state) => {
      if (state.isConnected !== false && state.isInternetReachable !== false) void requestSync();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;

      void requestSync();
      void pumpDownloads();
    });

    return () => {
      network.remove();
      appState.remove();
    };
  }, []);

  useAutoDownloadRequired();

  return <OfflineBanner />;
}
