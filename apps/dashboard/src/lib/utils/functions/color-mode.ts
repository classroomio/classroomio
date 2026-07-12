export type ColorModePreference = 'light' | 'dark' | 'system';

export const MODE_STORAGE_KEY = 'mode-watcher-mode';
export const MODE_EXPLICIT_STORAGE_KEY = 'mode-watcher-explicit';

export function isColorModePreference(value: string | null | undefined): value is ColorModePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function hasExplicitColorModePreference(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  return storage.getItem(MODE_EXPLICIT_STORAGE_KEY) === 'true';
}

export function markColorModeExplicit(storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(MODE_EXPLICIT_STORAGE_KEY, 'true');
}

/**
 * Resolve the color mode to apply on load.
 *
 * mode-watcher historically defaulted to "system", so many browsers still have
 * that value in localStorage even though the user never chose it. Only honor
 * "system" when the user explicitly picked it in the sidebar theme toggle.
 */
export function resolveStoredColorMode(storage: Pick<Storage, 'getItem'> = localStorage): ColorModePreference {
  const stored = storage.getItem(MODE_STORAGE_KEY);
  const isExplicit = hasExplicitColorModePreference(storage);

  if (!isColorModePreference(stored)) {
    return 'light';
  }

  if (stored === 'system' && !isExplicit) {
    return 'light';
  }

  return stored;
}

/** @deprecated Use resolveStoredColorMode for load-time resolution. */
export function readStoredColorMode(storage: Pick<Storage, 'getItem'> = localStorage): ColorModePreference {
  return resolveStoredColorMode(storage);
}
