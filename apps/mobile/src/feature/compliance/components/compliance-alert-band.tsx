import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useComplianceQuery } from '@/feature/compliance/api/compliance';
import { complianceAlertCopy, useComplianceCopy } from '@/feature/compliance/helpers/compliance-copy';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';

/** Home alert shown while a requirement is overdue, in its grace period or due soon. Opens the compliance screen. */
export function ComplianceAlertBand() {
  const compliance = useComplianceQuery();
  const { isStaff } = useActiveOrg();
  const complianceCopy = useComplianceCopy();
  const copy = compliance.data ? complianceAlertCopy(compliance.data, complianceCopy) : null;
  if (!compliance.data || !copy) return null;

  const urgent = compliance.data.status === 'overdue' || compliance.data.status === 'in_grace_period';

  const open = () => {
    tapHaptic();
    if (isStaff) {
      router.push('/certificates/compliance');
    } else {
      router.navigate('/compliance');
    }
  };

  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={`${copy.title}. ${copy.description}`}
      accessibilityHint={complianceCopy.t('alertHint')}
      scaleTo={0.985}
      onPress={open}
    >
      <Banner tone={urgent ? 'danger' : 'warning'}>
        <BannerIcon icon={urgent ? WarningIcon : CalendarDotsIcon} />
        <BannerContent>
          <BannerTitle>{copy.title}</BannerTitle>
          <BannerDescription>{copy.description}</BannerDescription>
        </BannerContent>
        <View style={styles.chevron}>
          <Icon icon={CaretRightIcon} size={17} tone="muted" />
        </View>
      </Banner>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chevron: { alignSelf: 'center' }
});
