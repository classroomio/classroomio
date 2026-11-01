import { useQuery } from '@tanstack/react-query';

import { getBiometricSupport } from '@/feature/biometric/helpers/biometric-support';

export const biometricSupportQueryKey = ['biometric-support'] as const;

export function useBiometricSupport() {
  return useQuery({ queryKey: biometricSupportQueryKey, queryFn: getBiometricSupport, staleTime: 60 * 1000 });
}
