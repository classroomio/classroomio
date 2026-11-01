import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import { DOWNLOAD_SETTINGS_KEY } from '@/feature/downloads/constants/downloads';
import type { DownloadSettings } from '@/feature/downloads/types/downloads';

const DEFAULT_SETTINGS: DownloadSettings = { wifiOnly: true, autoDownloadRequired: false };

function readSettings(): DownloadSettings {
  try {
    const raw = Storage.getItemSync(DOWNLOAD_SETTINGS_KEY);

    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<DownloadSettings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let settings = readSettings();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getDownloadSettings() {
  return settings;
}

export function updateDownloadSettings(patch: Partial<DownloadSettings>) {
  settings = { ...settings, ...patch };
  void Storage.setItemAsync(DOWNLOAD_SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
  listeners.forEach((listener) => listener());
}

export function useDownloadSettings() {
  return useSyncExternalStore(subscribe, getDownloadSettings);
}
