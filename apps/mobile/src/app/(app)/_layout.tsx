import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spinner } from '@/feature/common/components/spinner';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';

export default function SignedInLayout() {
  const { colors } = useTheme();
  const { org, isLoading } = useActiveOrg();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!org}>
        <Stack.Screen name="select-org" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(org)}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course" />
        <Stack.Screen name="certificates" />
        <Stack.Screen name="notifications" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
