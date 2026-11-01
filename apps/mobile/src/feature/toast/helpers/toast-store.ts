import { useSyncExternalStore } from 'react';

import type { ToastInput, ToastMessage } from '@/feature/toast/types/toast';

const DEFAULT_DURATION_MS = 3500;

let current: ToastMessage | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

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
  current = { ...input, id: nextId++, tone: input.tone ?? 'info', duration: input.duration ?? DEFAULT_DURATION_MS };
  emit();
}

export function dismissToast(id?: number) {
  if (id !== undefined && current?.id !== id) return;

  current = null;
  emit();
}

export function useToast() {
  return useSyncExternalStore(subscribe, () => current);
}
