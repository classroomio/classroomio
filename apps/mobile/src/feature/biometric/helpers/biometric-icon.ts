import { FingerprintIcon } from 'phosphor-react-native/src/icons/Fingerprint';
import { LockKeyIcon } from 'phosphor-react-native/src/icons/LockKey';
import { ScanSmileyIcon } from 'phosphor-react-native/src/icons/ScanSmiley';
import type { AppIcon } from '@/feature/common/components/icon';

import type { BiometricSupport } from '@/feature/biometric/types/biometric';

const ICONS: Record<BiometricSupport['kind'], AppIcon> = {
  face: ScanSmileyIcon,
  fingerprint: FingerprintIcon,
  other: LockKeyIcon
};

export function biometricIconOf(kind: BiometricSupport['kind'] | undefined) {
  return ICONS[kind ?? 'other'];
}
