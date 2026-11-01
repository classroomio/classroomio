import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { NotchCard } from '@/feature/common/components/notch-card';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { OVERALL_DISPLAY } from '@/feature/compliance/constants/compliance-standing';
import {
  complianceCountsText,
  complianceSummaryText,
  useComplianceCopy
} from '@/feature/compliance/helpers/compliance-copy';
import type { ComplianceOverview } from '@/feature/compliance/types/compliance';

const SummaryContext = createContext<ComplianceOverview | null>(null);

function useSummary() {
  const overview = use(SummaryContext);
  if (!overview) throw new Error('Compliance summary parts must be inside ComplianceSummary');

  return overview;
}

/** The overall compliance status block. Renders nothing when the learner has no requirements. */
export function ComplianceSummary({ overview, children }: { overview: ComplianceOverview; children: ReactNode }) {
  if (overview.status === 'none') return null;

  return (
    <SummaryContext value={overview}>
      <NotchCard style={styles.card}>{children}</NotchCard>
    </SummaryContext>
  );
}

export function ComplianceSummaryStatus() {
  const { status } = useSummary();
  const { t } = useComplianceCopy();
  if (status === 'none') return null;

  const display = OVERALL_DISPLAY[status];

  return (
    <View style={styles.status} accessibilityRole="header">
      <Icon icon={display.icon} size={24} tone={display.tone} />
      <Text variant="title" tone={display.tone}>
        {t(display.labelKey)}
      </Text>
    </View>
  );
}

export function ComplianceSummaryDescription() {
  const overview = useSummary();
  const copy = useComplianceCopy();

  return <Text tone="body">{complianceSummaryText(overview, copy)}</Text>;
}

export function ComplianceSummaryCounts() {
  const { counts } = useSummary();
  const copy = useComplianceCopy();

  return (
    <Text variant="caption" tone="muted">
      {complianceCountsText(counts, copy)}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.xs },
  status: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }
});
