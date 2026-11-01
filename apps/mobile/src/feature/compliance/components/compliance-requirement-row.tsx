import { StyleSheet, View } from 'react-native';

import { Item, ItemActions, ItemChevron, ItemContent } from '@/feature/common/components/item';
import { SPACING } from '@/feature/common/constants/layout';
import { requirementStatusText, useComplianceCopy } from '@/feature/compliance/helpers/compliance-copy';
import type { ComplianceRequirement as Requirement } from '@/feature/compliance/types/compliance';

import {
  ComplianceRequirement,
  ComplianceRequirementCountdown,
  ComplianceRequirementDetails,
  ComplianceRequirementProofButton,
  ComplianceRequirementStatus,
  ComplianceRequirementTitle,
  openRequirementCourse
} from './compliance-requirement';

/** A requirement in a list: to do, compliant or waived. Tapping it opens the course. */
export function ComplianceRequirementRow({ requirement }: { requirement: Requirement }) {
  const copy = useComplianceCopy();
  const compliant = requirement.standing === 'compliant';

  return (
    <ComplianceRequirement requirement={requirement}>
      <Item
        onPress={() => openRequirementCourse(requirement)}
        accessibilityLabel={`${requirement.courseTitle}, ${requirementStatusText(requirement, copy)}`}
        style={styles.item}
      >
        <ItemContent>
          <ComplianceRequirementTitle />
          <View style={styles.meta}>
            <ComplianceRequirementStatus />
            <ComplianceRequirementDetails inline limit={2} />
          </View>
          {compliant && requirement.certificate && (
            <View style={styles.proof}>
              <ComplianceRequirementProofButton />
            </View>
          )}
        </ItemContent>
        <ItemActions>{compliant ? <ComplianceRequirementCountdown /> : <ItemChevron />}</ItemActions>
      </Item>
    </ComplianceRequirement>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: 'flex-start', paddingVertical: SPACING.sm + 2 },
  meta: { gap: 2, marginTop: 2 },
  proof: { alignSelf: 'flex-start', marginTop: SPACING.xs }
});
