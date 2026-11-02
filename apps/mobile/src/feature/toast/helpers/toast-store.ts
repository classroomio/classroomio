import { useSyncExternalStore } from 'react';
import { makeMutable } from 'react-native-reanimated';

import type { ToastInput, ToastMessage } from '@/feature/toast/types/toast';

const DEFAULT_DURATION_MS = 3500;
const ACTION_DURATION_MS = 6000;

let current: ToastMessage | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

/** True while the outgoing toast is being replaced by a new one, so its exit can crossfade in place. */
export const toastReplacing = makeMutable(false);

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function showToast(input: ToastInput) {
  toastReplacing.set(current !== null);
  current = {
    ...input,
    id: nextId++,
    tone: input.tone ?? 'info',
    duration: input.duration ?? (input.action ? ACTION_DURATION_MS : DEFAULT_DURATION_MS)
  };
  emit();
}

export function dismissToast(id?: number) {
  if (id !== undefined && current?.id !== id) return;

  toastReplacing.set(false);
  current = null;
  emit();
}

export function useToast() {
  return useSyncExternalStore(subscribe, () => current);
}
