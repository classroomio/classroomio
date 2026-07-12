import { MediaQuery } from 'svelte/reactivity';
import { setMode, systemPrefersMode } from '@cio/ui/base/dark-mode';

import {
  markColorModeExplicit,
  resolveStoredColorMode,
  writeStoredColorMode,
  type ColorModePreference
} from './color-mode';
import { applyDocumentColorMode, type AppliedColorMode } from './color-mode-document';

const systemPrefersLight = new MediaQuery('(prefers-color-scheme: light)');

let preference = $state<ColorModePreference>('light');

function getAppliedMode(): AppliedColorMode {
  if (preference === 'system') {
    return systemPrefersLight.current ? 'light' : 'dark';
  }

  if (preference === 'dark') {
    return 'dark';
  }

  return 'light';
}

function syncModeWatcher(nextPreference: ColorModePreference): void {
  const shouldTrackSystem = nextPreference === 'system';
  systemPrefersMode.tracking(shouldTrackSystem);

  if (shouldTrackSystem) {
    systemPrefersMode.query();
  }

  setMode(nextPreference);
}

function applyPreference(): void {
  applyDocumentColorMode(getAppliedMode());
}

export function initColorModeState(): void {
  preference = resolveStoredColorMode();
  writeStoredColorMode(preference);
  syncModeWatcher(preference);
  applyPreference();
}

export function getColorModePreference(): ColorModePreference {
  return preference;
}

export function setColorModePreference(nextPreference: ColorModePreference): void {
  markColorModeExplicit();
  preference = nextPreference;
  writeStoredColorMode(nextPreference);
  syncModeWatcher(nextPreference);
  applyPreference();
}

$effect.root(() => {
  $effect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (preference !== 'system') {
      return;
    }

    systemPrefersLight.current;
    applyPreference();
  });
});
