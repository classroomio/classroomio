import type { ColorModePreference } from './color-mode';
import { resolveStoredColorMode } from './color-mode';

export type AppliedColorMode = 'light' | 'dark';

export function resolveAppliedColorMode(
  preference: ColorModePreference = resolveStoredColorMode(),
  systemPrefersLight: boolean = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : true
): AppliedColorMode {
  if (preference === 'dark') {
    return 'dark';
  }

  if (preference === 'system') {
    return systemPrefersLight ? 'light' : 'dark';
  }

  return 'light';
}

export function applyDocumentColorMode(mode: AppliedColorMode): void {
  const root = document.documentElement;

  if (mode === 'light') {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    return;
  }

  root.classList.add('dark');
  root.style.colorScheme = 'dark';
}
