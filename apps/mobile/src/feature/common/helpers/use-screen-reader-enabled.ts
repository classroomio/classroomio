import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

let enabled = false;
let watching = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (next === enabled) return;

  enabled = next;
  listeners.forEach((listener) => listener());
}

function watch() {
  if (watching) return;

  watching = true;
  void AccessibilityInfo.isScreenReaderEnabled()
    .then(set)
    .catch(() => {});
  AccessibilityInfo.addEventListener('screenReaderChanged', set);
}

function subscribe(listener: () => void) {
  watch();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Whether VoiceOver or TalkBack is running. One shared listener serves every caller, so list rows can use it. */
export function useScreenReaderEnabled() {
  return useSyncExternalStore(subscribe, () => enabled);
}
