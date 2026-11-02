export type BiometricPreference = 'on' | 'off';

export type BiometricMethod = 'faceId' | 'touchId' | 'fingerprint' | 'faceUnlock' | 'biometrics';

export type BiometricSupport = {
  /** The device has biometric hardware and at least one enrolled face or fingerprint. */
  available: boolean;
  hasHardware: boolean;
  method: BiometricMethod;
  kind: 'face' | 'fingerprint' | 'other';
};

export type BiometricFailure = 'lockout' | 'notSetUp' | 'notRecognized';
