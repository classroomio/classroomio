import Constants from 'expo-constants';

export function appVersionOf() {
  return Constants.expoConfig?.version ?? 'Unknown';
}

/** The installed app version, or null when the build does not report one. */
export function installedAppVersion() {
  return Constants.expoConfig?.version ?? null;
}
