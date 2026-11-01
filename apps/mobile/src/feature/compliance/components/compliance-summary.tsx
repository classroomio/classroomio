import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconTile, type IconTileTone } from '@/feature/common/components/icon-tile';
import { Card } from '@/feature/common/components/card';
import { ItemChevron } from '@/feature/common/components/item';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text, type TextTone } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { OVERALL_DISPLAY } from '@/feature/compliance/constants/compliance-standing';
import { complianceSummaryText, useComplianceCopy } from '@/feature/compliance/helpers/compliance-copy';
import { nextDeadlineOf, standingTotalsOf } from '@/feature/compliance/helpers/compliance-standing';
import type { ComplianceOverview } from '@/feature/compliance/types/compliance';
import { CourseThumbnail } from '@/feature/course/components/course-thumbnail';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';

import { openRequirementCourse } from './compliance-requirement';

const SummaryContext = createContext<ComplianceOverview | null>(null);

function useSummary() {
  const overview = use(SummaryContext);
  if (!overview) throw new Error('Compliance summary parts must be inside ComplianceSummary');

  return overview;
}

function tileToneOf(tone: TextTone): IconTileTone {
  if (tone === 'danger' || tone === 'warning' || tone === 'success') return tone;

  return 'neutral';
}

/** The learner's standing at a glance. Renders nothing when they have no requirements. */
export function ComplianceSummary({ overview, children }: { overview: ComplianceOverview; children: ReactNode }) {
  if (overview.status === 'none') return null;

  return (
    <SummaryContext value={overview}>
      <Card>{children}</Card>
    </SummaryContext>
  );
}

export function ComplianceSummaryStatus() {
  const overview = useSummary();
  const copy = useComplianceCopy();
  const display = overview.status === 'none' ? null : OVERALL_DISPLAY[overview.status];
  const tileTone = tileToneOf(display?.tone ?? 'muted');
  if (!display) return null;

  const toDo = overview.counts.open + overview.counts.unscheduled;
  const title = overview.status === 'compliant' && toDo > 0 ? copy.t('standingOnTrack') : copy.t(display.labelKey);

  return (
    <View style={styles.status}>
      <IconTile icon={overview.status === 'compliant' ? ShieldCheckIcon : display.icon} tone={tileTone} />
      <View style={styles.statusText}>
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="caption" tone="muted">
          {complianceSummaryText(overview, copy)}
        </Text>
      </View>
    </View>
  );
}

export function ComplianceSummaryNextDeadline() {
  const { requirements } = useSummary();
  const { colors } = useTheme();
  const { t, date } = useComplianceCopy();
  const formatters = useFormatters();
  const next = nextDeadlineOf(requirements);
  if (!next) return null;

  const { requirement, target, days } = next;
  const renewal = requirement.status === 'compliant';
  const urgent = requirement.standing === 'due_soon' || requirement.standing === 'in_grace_period';
  const countdown = t(renewal ? 'countdownUntilRenewalLabel' : 'countdownLeftLabel', { count: days });

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${t('nextDeadline')}, ${requirement.courseTitle}, ${date(target)}, ${countdown}`}
      scaleTo={0.985}
      onPress={() => {
        tapHaptic();
        openRequirementCourse(requirement);
      }}
      style={[styles.section, { borderTopColor: colors.border }]}
    >
      <CourseThumbnail uri={requirement.courseImage} size={48} recyclingKey={requirement.courseId} />
      <View style={styles.deadlineText}>
        <Text variant="captionStrong" tone="muted">
          {t('nextDeadline')}
        </Text>
        <Text variant="bodyStrong" numberOfLines={1}>
          {requirement.courseTitle}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {renewal ? t('detailValidUntil', { date: date(target) }) : t('detailDeadline', { date: date(target) })}
        </Text>
      </View>
      <View style={styles.countdown}>
        <Text variant="display" tone={urgent ? 'warning' : 'ink'} style={styles.numbers}>
          {formatters.number(days)}
        </Text>
        <Text variant="micro" tone="muted" numberOfLines={1}>
          {t(renewal ? 'countdownUntilRenewal' : 'countdownLeft', { count: days })}
        </Text>
      </View>
      <ItemChevron />
    </PressableScale>
  );
}

function SummaryStat({ value, label, tone }: { value: number; label: string; tone: TextTone }) {
  const formatters = useFormatters();

  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Text variant="title" tone={value > 0 ? tone : 'subtle'} style={styles.numbers}>
        {formatters.number(value)}
      </Text>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function ComplianceSummaryCounts() {
  const { counts } = useSummary();
  const { colors } = useTheme();
  const { t } = useComplianceCopy();
  const totals = standingTotalsOf(counts);

  return (
    <View style={[styles.section, styles.stats, { borderTopColor: colors.border }]}>
      <SummaryStat value={totals.overdue} label={t('standingOverdue')} tone="danger" />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <SummaryStat value={totals.dueSoon} label={t('standingDueSoon')} tone="warning" />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <SummaryStat value={totals.onTrack} label={t('standingOnTrack')} tone="success" />
    </View>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, padding: SPACING.md },
  statusText: { flex: 1, gap: 2 },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth * 2
  },
  deadlineText: { flex: 1, gap: 1 },
  countdown: { alignItems: 'flex-end', minWidth: 48 },
  numbers: { fontVariant: ['tabular-nums'] },
  stats: { paddingVertical: SPACING.sm, gap: 0 },
  stat: { flex: 1, alignItems: 'center', gap: 0 },
  divider: { width: StyleSheet.hairlineWidth * 2, alignSelf: 'stretch' }
});
