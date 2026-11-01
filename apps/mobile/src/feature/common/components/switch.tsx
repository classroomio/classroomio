import { Switch as NativeSwitch, type SwitchProps as NativeSwitchProps } from 'react-native';

import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

type SwitchProps = Omit<NativeSwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'>;

export function Switch({ onValueChange, ...props }: SwitchProps) {
  const { colors } = useTheme();

  return (
    <NativeSwitch
      trackColor={{ false: colors.sandStrong, true: colors.primary }}
      ios_backgroundColor={colors.sandStrong}
      {...props}
      onValueChange={(value) => {
        selectionHaptic();
        onValueChange?.(value);
      }}
    />
  );
}
