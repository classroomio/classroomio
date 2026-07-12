export type ColorModePreference = 'light' | 'dark' | 'system';

export const MODE_STORAGE_KEY = 'mode-watcher-mode';

export function isColorModePreference(value: string | null | undefined): value is ColorModePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Read the sidebar theme preference from mode-watcher storage. */
export function readStoredColorMode(storage: Pick<Storage, 'getItem'> = localStorage): ColorModePreference {
  const stored = storage.getItem(MODE_STORAGE_KEY);

  return isColorModePreference(stored) ? stored : 'light';
}
