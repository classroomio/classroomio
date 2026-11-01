import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import type { BiometricFailure, BiometricSupport } from '@/feature/biometric/types/biometric';

function describe(types: LocalAuthentication.AuthenticationType[]): Pick<BiometricSupport, 'method' | 'kind'> {
  const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

  if (Platform.OS === 'ios') {
    if (hasFace) return { method: 'faceId', kind: 'face' };
    if (hasFingerprint) return { method: 'touchId', kind: 'fingerprint' };
  }

  if (hasFingerprint) return { method: 'fingerprint', kind: 'fingerprint' };
  if (hasFace) return { method: 'faceUnlock', kind: 'face' };

  return { method: 'biometrics', kind: 'other' };
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync()
  ]);

  return { available: hasHardware && isEnrolled, hasHardware, ...describe(types) };
}

const SILENT_FAILURES = new Set(['user_cancel', 'system_cancel', 'app_cancel']);

type BiometricPrompt = { promptMessage: string; cancelLabel: string };

/**
 * Prompts for biometrics, falling back to the device passcode.
 * Resolves `failure: null` on success or when the person dismissed the prompt themselves.
 */
export async function authenticateWithBiometrics({
  promptMessage,
  cancelLabel
}: BiometricPrompt): Promise<{ success: boolean; failure: BiometricFailure | null }> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel,
    disableDeviceFallback: false
  });

  if (result.success) return { success: true, failure: null };
  if (SILENT_FAILURES.has(result.error)) return { success: false, failure: null };
  if (result.error === 'lockout') return { success: false, failure: 'lockout' };
  if (result.error === 'not_enrolled' || result.error === 'not_available' || result.error === 'passcode_not_set') {
    return { success: false, failure: 'notSetUp' };
  }

  return { success: false, failure: 'notRecognized' };
}
