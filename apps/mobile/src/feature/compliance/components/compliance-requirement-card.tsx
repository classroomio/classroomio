import { StyleSheet, View } from 'react-native';

import { Card, CardContent, CardFooter } from '@/feature/common/components/card';
import { SPACING } from '@/feature/common/constants/layout';
import type { ComplianceRequirement as Requirement } from '@/feature/compliance/types/compliance';

import {
  ComplianceRequirement,
  ComplianceRequirementArtwork,
  ComplianceRequirementCountdown,
  ComplianceRequirementCourseButton,
  ComplianceRequirementDetails,
  ComplianceRequirementProgress,
  ComplianceRequirementProofButton,
  ComplianceRequirementStatus,
  ComplianceRequirementTitle
} from './compliance-requirement';

/** A requirement that needs action: overdue, in its grace period or due soon. */
export function ComplianceRequirementCard({ requirement }: { requirement: Requirement }) {
  return (
    <ComplianceRequirement requirement={requirement}>
      <Card>
        <CardContent style={styles.content}>
          <View style={styles.header}>
            <ComplianceRequirementArtwork size={56} />
            <View style={styles.heading}>
              <ComplianceRequirementTitle variant="heading" />
              <ComplianceRequirementStatus />
            </View>
            {requirement.standing === 'due_soon' && <ComplianceRequirementCountdown />}
          </View>
          <ComplianceRequirementDetails />
          <ComplianceRequirementProgress />
        </CardContent>
        <CardFooter>
          <ComplianceRequirementCourseButton />
          <ComplianceRequirementProofButton />
        </CardFooter>
      </Card>
    </ComplianceRequirement>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  heading: { flex: 1, gap: SPACING.xxs }
});
