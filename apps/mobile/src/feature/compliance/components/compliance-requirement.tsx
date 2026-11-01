import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { router } from 'expo-router';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { calendarDaysUntil } from '@/feature/common/helpers/calendar-date';
import { STANDING_DISPLAY } from '@/feature/compliance/constants/compliance-standing';
import {
  requirementDetails,
  requirementStatusText,
  requirementTargetDate,
  useComplianceCopy
} from '@/feature/compliance/helpers/compliance-copy';
import type { ComplianceRequirement as Requirement } from '@/feature/compliance/types/compliance';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';

const RequirementContext = createContext<Requirement | null>(null);

function useRequirement() {
  const requirement = use(RequirementContext);
  if (!requirement) throw new Error('Compliance requirement parts must be inside ComplianceRequirement');

  return requirement;
}

export function openRequirementCourse(requirement: Requirement) {
  router.push({ pathname: '/course/[courseId]', params: { courseId: requirement.courseId } });
}

/** Shares one requirement with the parts inside it. */
export function ComplianceRequirement({ requirement, children }: { requirement: Requirement; children: ReactNode }) {
  return <RequirementContext value={requirement}>{children}</RequirementContext>;
}

export function ComplianceRequirementTitle({ variant = 'bodyStrong' }: { variant?: 'bodyStrong' | 'heading' }) {
  const requirement = useRequirement();

  return (
    <Text variant={variant} numberOfLines={2}>
      {requirement.courseTitle}
    </Text>
  );
}

export function ComplianceRequirementStatus() {
  const requirement = useRequirement();
  const copy = useComplianceCopy();
  const display = STANDING_DISPLAY[requirement.standing];

  return (
    <View style={styles.status}>
      <Icon icon={display.icon} size={15} tone={display.tone} />
      <Text
        variant="captionStrong"
        tone={display.tone === 'muted' ? 'body' : display.tone}
        numberOfLines={1}
        style={styles.statusText}
      >
        {requirementStatusText(requirement, copy)}
      </Text>
    </View>
  );
}

/** Dated facts as separate lines, or joined into one line with `inline`. */
export function ComplianceRequirementDetails({ inline = false, limit }: { inline?: boolean; limit?: number }) {
  const requirement = useRequirement();
  const copy = useComplianceCopy();
  const details = requirementDetails(requirement, copy).slice(0, limit);
  if (details.length === 0) return null;

  if (inline) {
    return (
      <Text variant="caption" tone="muted" numberOfLines={2}>
        {details.join(' · ')}
      </Text>
    );
  }

  return (
    <View style={styles.details}>
      {details.map((detail) => (
        <Text key={detail} variant="caption" tone="muted">
          {detail}
        </Text>
      ))}
    </View>
  );
}

export function ComplianceRequirementProgress() {
  const requirement = useRequirement();
  const { t } = useComplianceCopy();
  const formatters = useFormatters();
  if (requirement.status === 'compliant' || requirement.status === 'waived') return null;

  return (
    <View style={styles.progress}>
      <Progress value={requirement.progressPercent} />
      <Text variant="micro" tone="muted">
        {t('progressComplete', { percent: formatters.percent(requirement.progressPercent) })}
      </Text>
    </View>
  );
}

/** Days left until the deadline or renewal date. */
export function ComplianceRequirementCountdown() {
  const requirement = useRequirement();
  const { t } = useComplianceCopy();
  const formatters = useFormatters();
  const target = requirementTargetDate(requirement);
  if (!target) return null;

  const days = calendarDaysUntil(target);
  if (days < 0) return null;

  const tone = requirement.standing === 'due_soon' ? 'warning' : 'ink';
  const renewal = requirement.status === 'compliant';

  return (
    <View
      accessible
      accessibilityLabel={t(renewal ? 'countdownUntilRenewalLabel' : 'countdownLeftLabel', { count: days })}
      style={styles.countdown}
    >
      <Text variant="title" tone={tone} style={styles.countdownValue}>
        {formatters.number(days)}
      </Text>
      <Text variant="micro" tone="muted">
        {t(renewal ? 'countdownUntilRenewal' : 'countdownLeft', { count: days })}
      </Text>
    </View>
  );
}

export function ComplianceRequirementCourseButton() {
  const requirement = useRequirement();
  const { t } = useComplianceCopy();
  const label =
    requirement.status === 'compliant'
      ? t('openCourse')
      : requirement.progressPercent > 0
        ? t('resumeCourse')
        : t('startCourse');

  return (
    <Button
      size="sm"
      variant={requirement.status === 'compliant' ? 'outline' : 'primary'}
      onPress={() => openRequirementCourse(requirement)}
    >
      <ButtonText>{label}</ButtonText>
    </Button>
  );
}

export function ComplianceRequirementProofButton({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const requirement = useRequirement();
  const { t } = useComplianceCopy();
  if (!requirement.certificate) return null;

  return (
    <Button
      size={size}
      variant="outline"
      accessibilityLabel={t('proofLabel', { course: requirement.courseTitle })}
      onPress={() => router.push({ pathname: '/certificates/[courseId]', params: { courseId: requirement.courseId } })}
    >
      <ButtonIcon icon={MedalIcon} />
      <ButtonText>{t('proof')}</ButtonText>
    </Button>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { flexShrink: 1 },
  details: { gap: 2 },
  progress: { gap: 6 },
  countdown: { alignItems: 'flex-end', minWidth: 56 },
  countdownValue: { fontVariant: ['tabular-nums'] }
});
