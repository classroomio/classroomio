import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { LOCK_AFTER_BACKGROUND_MS } from '@/feature/biometric/constants/biometric';

type AutoLockOptions = { userId: string | null; isPending: boolean; enabled: boolean };

/** Locks on cold start with a stored session, and after the app spends `LOCK_AFTER_BACKGROUND_MS` in the background. */
export function useAutoLock({ userId, isPending, enabled }: AutoLockOptions) {
  const [lockedFor, setLockedFor] = useState<string | null>(null);
  const [bootResolved, setBootResolved] = useState(false);

  if (!bootResolved && !isPending) {
    setBootResolved(true);
    if (userId && enabled) setLockedFor(userId);
  }

  if (lockedFor !== null && lockedFor !== userId) setLockedFor(null);

  useEffect(() => {
    if (!userId || !enabled) return;

    let backgroundedAt: number | null = null;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        backgroundedAt = Date.now();
        return;
      }

      if (state === 'active' && backgroundedAt !== null) {
        if (Date.now() - backgroundedAt >= LOCK_AFTER_BACKGROUND_MS) setLockedFor(userId);
        backgroundedAt = null;
      }
    });

    return () => subscription.remove();
  }, [userId, enabled]);

  return { locked: enabled && lockedFor !== null && lockedFor === userId, unlock: () => setLockedFor(null) };
}
