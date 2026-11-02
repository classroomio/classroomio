import { LOCK_AFTER_BACKGROUND_MS } from '@/feature/biometric/constants/biometric';
import { biometricCatalog } from '@/feature/biometric/translations/catalog';
import type { BiometricFailure, BiometricMethod } from '@/feature/biometric/types/biometric';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const FAILURE_KEYS = {
  lockout: 'errorLockout',
  notSetUp: 'errorNotSetUp',
  notRecognized: 'errorNotRecognized'
} as const;

/** Biometric copy in the app language, with the method named as the platform names it. */
export function useBiometricCopy(method: BiometricMethod | undefined) {
  const t = useTranslations(biometricCatalog);
  const tc = useTranslations(commonCatalog);
  const methodName = {
    faceId: 'Face ID',
    touchId: 'Touch ID',
    fingerprint: t('methodFingerprint'),
    faceUnlock: t('methodFaceUnlock'),
    biometrics: t('methodBiometrics')
  }[method ?? 'faceId'];
  const duration = t('lockDuration', { count: LOCK_AFTER_BACKGROUND_MS / 60_000 });

  const translate = (key: Parameters<typeof t>[0], values?: Parameters<typeof t>[1]) => {
    const text = t(key, { method: methodName, duration, ...values });

    return t(key).startsWith('{method}') ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  };

  return {
    t: translate,
    cancelLabel: tc('cancel'),
    signOut: tc('signOut'),
    failureMessage: (failure: BiometricFailure) => translate(FAILURE_KEYS[failure])
  };
}
