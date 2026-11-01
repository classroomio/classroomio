import { Stack } from 'expo-router';

import { StackBackButton } from '@/feature/common/components/stack-back-button';
import { tabStackScreenOptions } from '@/feature/common/helpers/stack-screen-options';
import { useTheme } from '@/feature/common/helpers/use-theme';

export default function CourseLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={({ navigation, route }) => ({
        ...tabStackScreenOptions(colors),
        headerLargeTitleEnabled: false,
        headerBackButtonDisplayMode: 'minimal',
        headerLeft:
          navigation.getState()?.routes[0]?.key === route.key
            ? () => <StackBackButton tintColor={colors.primary} />
            : undefined
      })}
    />
  );
}
