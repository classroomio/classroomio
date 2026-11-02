import Constants from 'expo-constants';

/** The EAS project id Expo push tokens are issued for, or null in a build without one. */
export function easProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;

  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}
