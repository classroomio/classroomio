import { router } from 'expo-router';
import { Award, ShieldCheck } from 'lucide-react-native';

import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Icon } from '@/feature/common/components/icon';
import { Item, ItemChevron, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { RADII } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useComplianceQuery } from '@/feature/compliance/api/compliance';
import { ATTENTION_STANDINGS, TODO_STANDINGS } from '@/feature/compliance/constants/compliance-standing';
import { complianceCatalog } from '@/feature/compliance/translations/catalog';
import type { ComplianceRequirement, ComplianceStanding } from '@/feature/compliance/types/compliance';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { ComplianceRequirementCard } from './compliance-requirement-card';
import { ComplianceRequirementRow } from './compliance-requirement-row';
import {
  ComplianceSummary,
  ComplianceSummaryCounts,
  ComplianceSummaryDescription,
  ComplianceSummaryStatus
} from './compliance-summary';

function withStanding(requirements: ComplianceRequirement[], standings: ComplianceStanding[]) {
  return requirements.filter((requirement) => standings.includes(requirement.standing));
}

function RequirementRowsSection({ title, requirements }: { title: string; requirements: ComplianceRequirement[] }) {
  if (requirements.length === 0) return null;

  return (
    <ScreenSection>
      <ScreenSectionHeader title={title} />
      <ItemGroup>
        {requirements.map((requirement) => (
          <ComplianceRequirementRow key={requirement.courseId} requirement={requirement} />
        ))}
      </ItemGroup>
    </ScreenSection>
  );
}

/** The learner's compliance status and every requirement behind it. Used by the Compliance tab and the staff screen. */
export function ComplianceOverview() {
  const t = useTranslations(complianceCatalog);
  const tc = useTranslations(commonCatalog);
  const compliance = useComplianceQuery();
  const requirements = compliance.data?.requirements ?? [];
  const attention = withStanding(requirements, ATTENTION_STANDINGS);
  const toDo = withStanding(requirements, TODO_STANDINGS);
  const compliant = withStanding(requirements, ['compliant']);
  const waived = withStanding(requirements, ['waived']);

  return (
    <ScreenScrollView refreshing={compliance.isRefetching} onRefresh={() => compliance.refetch()}>
      {compliance.isPending && (
        <ScreenSection>
          <Skeleton height={132} radius={RADII.md} />
          <Skeleton height={196} radius={RADII.xl} />
          <Skeleton height={148} radius={RADII.xl} />
        </ScreenSection>
      )}

      {compliance.isError && (
        <Empty>
          <EmptyMedia icon={ShieldCheck} />
          <EmptyTitle>{t('loadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(compliance.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={() => compliance.refetch()}>
              <ButtonText>{tc('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {compliance.data?.status === 'none' && (
        <Empty>
          <EmptyMedia icon={ShieldCheck} />
          <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
          <EmptyDescription>{t('summaryNone')}</EmptyDescription>
        </Empty>
      )}

      {compliance.data && (
        <ComplianceSummary overview={compliance.data}>
          <ComplianceSummaryStatus />
          <ComplianceSummaryDescription />
          <ComplianceSummaryCounts />
        </ComplianceSummary>
      )}

      {attention.length > 0 && (
        <ScreenSection>
          <ScreenSectionHeader title={t('sectionNeedsAttention')} />
          {attention.map((requirement) => (
            <ComplianceRequirementCard key={requirement.courseId} requirement={requirement} />
          ))}
        </ScreenSection>
      )}

      <RequirementRowsSection title={t('sectionToDo')} requirements={toDo} />
      <RequirementRowsSection title={t('standingCompliant')} requirements={compliant} />
      <RequirementRowsSection title={t('standingWaived')} requirements={waived} />

      {requirements.length > 0 && (
        <ItemGroup>
          <Item onPress={() => router.push('/certificates')}>
            <ItemMedia variant="tile">
              <Icon icon={Award} size={20} tone="ink" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('certificates')}</ItemTitle>
            </ItemContent>
            <ItemChevron />
          </Item>
        </ItemGroup>
      )}
    </ScreenScrollView>
  );
}
