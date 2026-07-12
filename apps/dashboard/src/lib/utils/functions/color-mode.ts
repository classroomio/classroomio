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
 * Resolve the stored preference to apply on load.
 *
 * mode-watcher used to default to "system" and persist it eagerly, so returning
 * users still carry a stored "system" they never chose. Only honor "system"
 * when the user explicitly picked it in the theme toggle; otherwise use light.
 * This mirrors the inline bootstrap script in `app.html`.
 */
export function resolveStoredColorMode(storage: Pick<Storage, 'getItem'> = localStorage): ColorModePreference {
  const stored = storage.getItem(MODE_STORAGE_KEY);

  if (!isColorModePreference(stored)) {
    return 'light';
  }

  if (stored === 'system' && !hasExplicitColorModePreference(storage)) {
    return 'light';
  }

  return stored;
}
