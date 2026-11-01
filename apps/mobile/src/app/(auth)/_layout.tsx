import { Stack } from 'expo-router';

import { useTheme } from '@/feature/common/helpers/use-theme';

const sheetOptions = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [0.6, 0.92],
  sheetGrabberVisible: true,
  sheetCornerRadius: 18
};

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="server" options={sheetOptions} />
      <Stack.Screen name="sso" options={sheetOptions} />
      <Stack.Screen name="forgot-password" options={sheetOptions} />
    </Stack>
  );
}
