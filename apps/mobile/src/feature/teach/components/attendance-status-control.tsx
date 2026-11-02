import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { RADII } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { AttendanceStatus } from '@/feature/teach/types/teach';

const SIZE = 36;
const HIT_SLOP = { top: 4, bottom: 4, left: 2, right: 2 } as const;

const OPTIONS: Array<{ status: AttendanceStatus; icon: AppIcon; label: 'present' | 'statusLate' | 'absent' }> = [
  { status: 'present', icon: CheckIcon, label: 'present' },
  { status: 'late', icon: ClockIcon, label: 'statusLate' },
  { status: 'absent', icon: XIcon, label: 'absent' }
];

type AttendanceStatusControlProps = {
  value: AttendanceStatus | null;
  learner: string;
  onChange: (status: AttendanceStatus) => void;
};

/** Present, late and absent as three square toggles; the chosen one fills with its status colour. */
export function AttendanceStatusControl({ value, learner, onChange }: AttendanceStatusControlProps) {
  const t = useTranslations(teachCatalog);
  const { colors } = useTheme();
  const fill: Record<AttendanceStatus, string> = {
    present: colors.success,
    late: colors.warning,
    absent: colors.danger
  };

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('markLearner', { name: learner })} style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = value === option.status;

        return (
          <PressableScale
            key={option.status}
            accessibilityRole="radio"
            accessibilityLabel={t(option.label)}
            accessibilityState={{ selected }}
            hitSlop={HIT_SLOP}
            scaleTo={0.9}
            onPress={() => {
              if (selected) return;

              selectionHaptic();
              onChange(option.status);
            }}
            style={[styles.option, { backgroundColor: selected ? fill[option.status] : colors.muted }]}
          >
            <Icon icon={option.icon} size={18} weight="bold" color={selected ? colors.onSolid : colors.inkSubtle} />
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  option: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  }
});
