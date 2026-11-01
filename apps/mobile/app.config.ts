import type { ExpoConfig } from 'expo/config';

import { SPLASH } from './src/feature/brand/constants/splash.ts';

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(
      `${name} is not set. Add it to apps/mobile/.env, or .env.production for store builds (see .env.example), or to the build environment.`
    );

  return value;
}

const APP_VARIANTS = ['development', 'preview', 'production'] as const;
type AppVariant = (typeof APP_VARIANTS)[number];

const APP_NAMES: Record<AppVariant, string> = {
  development: 'ClassroomIO Dev',
  preview: 'ClassroomIO Preview',
  production: 'ClassroomIO'
};

// Non-production builds get their own bundle ID and link scheme so they install alongside the store app.
const BUNDLE_ID_SUFFIXES: Record<AppVariant, string> = {
  development: '.dev',
  preview: '.preview',
  production: ''
};

const SCHEMES: Record<AppVariant, string> = {
  development: 'classroomio-dev',
  preview: 'classroomio-preview',
  production: 'classroomio'
};

function appVariantOf(value: string): AppVariant {
  const variant = APP_VARIANTS.find((candidate) => candidate === value);
  if (!variant) throw new Error(`APP_VARIANT must be one of ${APP_VARIANTS.join(', ')}; received "${value}".`);

  return variant;
}

const appId = requiredEnv('APP_ID');
const appVariant = appVariantOf(requiredEnv('APP_VARIANT'));
const easProjectId = requiredEnv('EAS_PROJECT_ID');
const bundleId = `${appId}${BUNDLE_ID_SUFFIXES[appVariant]}`;

const FACE_ID_REASON = 'ClassroomIO uses Face ID to unlock the app without signing in again.';
const CAMERA_REASON =
  'ClassroomIO uses the camera to scan check-in codes for live classes, record video answers and photograph documents you attach.';
const MICROPHONE_REASON = 'ClassroomIO records audio with video answers you submit to exercises.';

const config: ExpoConfig = {
  name: APP_NAMES[appVariant],
  slug: 'classroomio',
  scheme: SCHEMES[appVariant],
  version: '1.0.0',
  // Landscape stays available for fullscreen video; screens are locked to portrait with expo-screen-orientation once JS starts.
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: bundleId,
    supportsTablet: false,
    icon: {
      light: './assets/icon.png',
      dark: './assets/icon-dark.png',
      tinted: './assets/icon-tinted.png'
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CADisableMinimumFrameDurationOnPhone: true,
      NSFaceIDUsageDescription: FACE_ID_REASON
    }
  },
  android: {
    package: bundleId,
    adaptiveIcon: {
      backgroundColor: '#0233BD',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png'
    },
    predictiveBackGestureEnabled: false
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-web-browser',
    'expo-font',
    ['expo-local-authentication', { faceIDPermission: FACE_ID_REASON }],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: SPLASH.markWidth,
        resizeMode: 'contain',
        backgroundColor: SPLASH.background,
        dark: { image: './assets/splash-icon.png', backgroundColor: SPLASH.background }
      }
    ],
    ['expo-video', { supportsBackgroundPlayback: true, supportsPictureInPicture: true }],
    ['expo-screen-orientation', { initialOrientation: 'PORTRAIT_UP' }],
    [
      'expo-camera',
      {
        cameraPermission: CAMERA_REASON,
        microphonePermission: MICROPHONE_REASON,
        recordAudioAndroid: true
      }
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'ClassroomIO opens the photos you choose to attach to an exercise answer or a community post.',
        cameraPermission: CAMERA_REASON
      }
    ],
    ['expo-audio', { microphonePermission: MICROPHONE_REASON }],
    ['expo-notifications', { color: '#0233BD' }],
    'expo-sqlite',
    'expo-localization'
  ],
  extra: { appVariant, eas: { projectId: easProjectId } },
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  }
};

export default config;
