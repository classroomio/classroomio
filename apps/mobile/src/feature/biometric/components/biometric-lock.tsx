import { useAuth } from '@/feature/auth/components/auth-provider';
import { BiometricOfferDialog } from '@/feature/biometric/components/biometric-offer-dialog';
import { LockScreen } from '@/feature/biometric/components/lock-screen';
import { useBiometricPreference } from '@/feature/biometric/helpers/biometric-preference-store';
import { useAutoLock } from '@/feature/biometric/helpers/use-auto-lock';

/** Biometric re-entry gate. Render once, after the root navigator, so the lock screen covers every route. */
export function BiometricLock() {
  const { userId, isPending } = useAuth();
  const preference = useBiometricPreference(userId);
  const { locked, unlock } = useAutoLock({ userId, isPending, enabled: preference === 'on' });

  if (!userId) return null;

  if (locked) return <LockScreen onUnlock={unlock} />;

  if (preference === null) return <BiometricOfferDialog key={userId} userId={userId} />;

  return null;
}
