import { lockAsync, OrientationLock } from 'expo-screen-orientation';

/** Every screen is portrait except fullscreen video. The config plugin only presets iOS, so this also runs at launch. */
export function enterLandscape() {
  return lockAsync(OrientationLock.LANDSCAPE);
}

export function restorePortrait() {
  return lockAsync(OrientationLock.PORTRAIT_UP);
}
