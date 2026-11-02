import { useSyncExternalStore } from 'react';

import type { ToastAction } from '@/feature/toast/types/toast';

export type PendingDelete = {
  id: string;
  unread: boolean;
  /** The Undo action of the toast that offers it; the delete is sent once that toast is gone. */
  undo: ToastAction;
  /** Sends the delete and settles the caches. Never throws. */
  send: () => Promise<void>;
  sending: boolean;
};

const MAX_WAIT_MS = 20_000;

let pending: ReadonlyMap<string, PendingDelete> = new Map();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

function update(next: Map<string, PendingDelete>) {
  pending = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function clearTimer(id: string) {
  clearTimeout(timers.get(id));
  timers.delete(id);
}

function send(entry: PendingDelete) {
  if (entry.sending) return;

  clearTimer(entry.id);
  const next = new Map(pending);
  next.set(entry.id, { ...entry, sending: true });
  update(next);

  void entry.send().finally(() => {
    const settled = new Map(pending);
    settled.delete(entry.id);
    update(settled);
  });
}

/** Hides a notification until its delete is sent or undone; sends it anyway after `MAX_WAIT_MS`. */
export function schedulePendingDelete(entry: Omit<PendingDelete, 'sending'>) {
  const next = new Map(pending);
  next.set(entry.id, { ...entry, sending: false });
  update(next);
  timers.set(
    entry.id,
    setTimeout(() => {
      const current = pending.get(entry.id);
      if (current) send(current);
    }, MAX_WAIT_MS)
  );
}

/** Restores a notification whose delete has not been sent yet. Returns false when it is too late to undo. */
export function cancelPendingDelete(id: string) {
  const entry = pending.get(id);
  if (!entry || entry.sending) return false;

  clearTimer(id);
  const next = new Map(pending);
  next.delete(id);
  update(next);

  return true;
}

/** Sends every pending delete whose Undo is no longer on screen, or all of them when `visibleUndo` is omitted. */
export function sendPendingDeletes(visibleUndo?: ToastAction | null) {
  for (const entry of pending.values()) {
    if (visibleUndo === undefined || entry.undo !== visibleUndo) send(entry);
  }
}

export function usePendingDeletes() {
  return useSyncExternalStore(subscribe, () => pending);
}
