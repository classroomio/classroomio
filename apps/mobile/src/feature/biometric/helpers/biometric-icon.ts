import { FingerprintPattern, LockKeyhole, ScanFace, type LucideIcon } from 'lucide-react-native';

import type { BiometricSupport } from '@/feature/biometric/types/biometric';

const ICONS: Record<BiometricSupport['kind'], LucideIcon> = {
  face: ScanFace,
  fingerprint: FingerprintPattern,
  other: LockKeyhole
};

export function biometricIconOf(kind: BiometricSupport['kind'] | undefined) {
  return ICONS[kind ?? 'other'];
}
