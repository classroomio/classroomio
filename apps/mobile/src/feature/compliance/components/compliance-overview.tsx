import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { router } from 'expo-router';

import { Button, ButtonText } from '@/feature/common/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle
} from '@/feature/common/components/empty';
import { IconTile } from '@/feature/common/components/icon-tile';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton, SkeletonList, SkeletonText } from '@/feature/common/components/skeleton';
import { RADII } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
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
  ComplianceSummaryNextDeadline,
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

function ComplianceOverviewSkeleton() {
  return (
    <>
      <Skeleton height={232} radius={RADII.xl} />
      <ScreenSection>
        <SkeletonText variant="subheading" lines={1} width={120} />
        <SkeletonList count={3} media="thumbnail" />
      </ScreenSection>
    </>
  );
}

/** The learner's compliance status and every requirement behind it. Used by the Compliance tab and the staff screen. */
export function ComplianceOverview() {
  const t = useTranslations(complianceCatalog);
  const tc = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const compliance = useComplianceQuery();
  const requirements = compliance.data?.requirements ?? [];
  const attention = withStanding(requirements, ATTENTION_STANDINGS);
  const toDo = withStanding(requirements, TODO_STANDINGS);
  const compliant = withStanding(requirements, ['compliant']);
  const waived = withStanding(requirements, ['waived']);

  return (
    <ScreenScrollView onRefresh={() => compliance.refetch()}>
      {compliance.isPending && <ComplianceOverviewSkeleton />}

      {compliance.isError && !compliance.data && (
        <Empty>
          <EmptyMedia icon={ShieldCheckIcon} />
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
          <EmptyIllustration name="calendar" />
          <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
          <EmptyDescription>{t('summaryNone')}</EmptyDescription>
        </Empty>
      )}

      {compliance.data && (
        <ComplianceSummary overview={compliance.data}>
          <ComplianceSummaryStatus />
          <ComplianceSummaryNextDeadline />
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
            <ItemMedia>
              <IconTile icon={MedalIcon} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('certificates')}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <ItemChevron />
            </ItemActions>
          </Item>
        </ItemGroup>
      )}
    </ScreenScrollView>
  );
}
