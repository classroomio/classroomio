import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
  useFonts
} from '@expo-google-fonts/geist';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AuthProvider, useAuth } from '@/feature/auth/components/auth-provider';
import { BiometricLock } from '@/feature/biometric/components/biometric-lock';
import { AnimatedSplash } from '@/feature/brand/components/animated-splash';
import { NotificationsBootstrap } from '@/feature/notifications/components/notifications-bootstrap';
import { ApiProvider } from '@/feature/common/components/api-provider';
import { ThemeProvider } from '@/feature/common/components/theme-provider';
import { FONT_FAMILY } from '@/feature/common/constants/typography';
import { connectQueryNetworkStatus } from '@/feature/common/helpers/query-network';
import { OfflineSupport } from '@/feature/offline/components/offline-support';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useSyncCurrentLocale } from '@/feature/i18n/helpers/use-sync-current-locale';
import { orgBrandOf } from '@/feature/org/helpers/org-brand';
import { useTabIcons } from '@/feature/common/helpers/use-tab-icons';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { ServerProvider } from '@/feature/server/components/server-provider';
import { Toaster } from '@/feature/toast/components/toaster';

void SplashScreen.preventAutoHideAsync();
connectQueryNetworkStatus();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60 * 1000 } }
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <ServerProvider>
            <AuthProvider>
              <ApiProvider>
                <BrandedApp fontsLoaded={fontsLoaded} />
              </ApiProvider>
            </AuthProvider>
          </ServerProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function BrandedApp({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { org } = useActiveOrg();
  const { isPending } = useAuth();
  const tabIcons = useTabIcons();
  const ready = fontsLoaded && tabIcons !== null && !isPending;
  useSyncCurrentLocale();
  const brand = useMemo(() => orgBrandOf(org?.theme), [org?.theme]);

  return (
    <ThemeProvider brand={brand}>
      <BottomSheetModalProvider>
        <RootNavigator ready={ready} />
      </BottomSheetModalProvider>
      <Toaster />
      <AnimatedSplash ready={ready} />
    </ThemeProvider>
  );
}

function RootNavigator({ ready }: { ready: boolean }) {
  const { isDark, colors } = useTheme();
  const { userId } = useAuth();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;

    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.background,
        text: colors.ink,
        border: colors.border
      },
      fonts: {
        regular: { fontFamily: FONT_FAMILY.regular, fontWeight: '400' as const },
        medium: { fontFamily: FONT_FAMILY.medium, fontWeight: '500' as const },
        bold: { fontFamily: FONT_FAMILY.semibold, fontWeight: '600' as const },
        heavy: { fontFamily: FONT_FAMILY.bold, fontWeight: '700' as const }
      }
    };
  }, [isDark, colors]);

  if (!ready) return null;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={!userId}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(userId)}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
      <OfflineSupport />
      <BiometricLock />
      <NotificationsBootstrap />
    </NavigationThemeProvider>
  );
}
