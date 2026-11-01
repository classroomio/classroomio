import Constants from 'expo-constants';

const configuredScheme = Constants.expoConfig?.scheme;

/** The link scheme of this build; development and preview builds use their own. */
export const APP_SCHEME = (Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme) ?? 'classroomio';

export const AUTH_STORAGE_PREFIX = 'classroomio';

export const AUTH_COOKIE_PREFIX = 'classroomio';
