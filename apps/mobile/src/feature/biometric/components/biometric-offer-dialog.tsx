import { useEffect, useState } from 'react';

import { BIOMETRIC_OFFER_DELAY_MS } from '@/feature/biometric/constants/biometric';
import { setBiometricPreference } from '@/feature/biometric/helpers/biometric-preference-store';
import { authenticateWithBiometrics } from '@/feature/biometric/helpers/biometric-support';
import { useBiometricSupport } from '@/feature/biometric/helpers/use-biometric-support';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useBiometricCopy } from '@/feature/biometric/helpers/use-biometric-copy';

/** Asks once per user whether to lock the app with biometrics. Render only while the user has no stored choice. */
export function BiometricOfferDialog({ userId }: { userId: string }) {
  const support = useBiometricSupport();
  const [open, setOpen] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const { t, cancelLabel, failureMessage } = useBiometricCopy(support.data?.method);
  const available = support.data?.available ?? false;

  useEffect(() => {
    if (!available) return;

    const timer = setTimeout(() => setOpen(true), BIOMETRIC_OFFER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [available]);

  const decline = (nextOpen: boolean) => {
    if (nextOpen) return;

    setOpen(false);
    setBiometricPreference(userId, 'off');
  };

  const enable = async () => {
    setEnabling(true);
    const result = await authenticateWithBiometrics({ promptMessage: t('turnOnPrompt'), cancelLabel });
    setEnabling(false);
    setOpen(false);

    if (result.success) {
      successHaptic();
      setBiometricPreference(userId, 'on');
      showToast({ tone: 'success', title: t('isOn'), description: t('isOnDescription') });
      return;
    }

    setBiometricPreference(userId, 'off');
    if (result.failure) showToast({ tone: 'warning', title: t('isOff'), description: failureMessage(result.failure) });
  };

  return (
    <AlertDialog open={open} onOpenChange={decline} busy={enabling}>
      <AlertDialogContent>
        <AlertDialogTitle>{t('offerTitle')}</AlertDialogTitle>
        <AlertDialogDescription>{t('offerDescription')}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('notNow')}</AlertDialogCancel>
          <AlertDialogAction loading={enabling} onPress={enable}>
            {t('turnOn')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
