import { useEffect } from 'react';
import { AppState } from 'react-native';

import { sendPendingDeletes } from '@/feature/notifications/helpers/pending-deletes';
import { useToast } from '@/feature/toast/helpers/toast-store';

/** Sends pending notification deletes once their Undo toast is gone, when the app leaves the foreground, and on sign-out. */
export function usePendingDeleteSender() {
  const toast = useToast();
  const visibleUndo = toast?.action ?? null;

  useEffect(() => {
    sendPendingDeletes(visibleUndo);
  }, [visibleUndo]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') sendPendingDeletes();
    });

    return () => {
      subscription.remove();
      sendPendingDeletes();
    };
  }, []);
}
