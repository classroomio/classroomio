import { TargetIcon } from 'phosphor-react-native/src/icons/Target';

import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { RADII } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useGoalsQuery } from '@/feature/goals/api/goals';
import { MilestoneBoard } from '@/feature/goals/components/milestone-board';
import { StreakHero } from '@/feature/goals/components/streak-hero';
import { WeeklyGoalCard } from '@/feature/goals/components/weekly-goal-card';
import { goalsCatalog } from '@/feature/goals/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function GoalsScreen() {
  const t = useTranslations(goalsCatalog);
  const common = useTranslations(commonCatalog);
  const goals = useGoalsQuery();
  const data = goals.data;

  if (goals.isPending) {
    return (
      <ScreenScrollView scrollEnabled={false}>
        <Skeleton height={330} radius={RADII.xl} />
        <Skeleton height={148} radius={RADII.xl} />
        <Skeleton height={300} radius={RADII.xl} />
      </ScreenScrollView>
    );
  }

  if (!data) {
    return (
      <ScreenScrollView onRefresh={() => goals.refetch()}>
        <Empty>
          <EmptyMedia icon={TargetIcon} />
          <EmptyTitle>{t('loadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(goals.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={() => goals.refetch()}>
              <ButtonText>{common('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView onRefresh={() => goals.refetch()}>
      <StreakHero streak={data.streak} />

      <WeeklyGoalCard goal={data.weeklyGoal} />

      <ScreenSection>
        <ScreenSectionHeader title={t('milestonesTitle')} />
        <MilestoneBoard milestones={data.milestones} current={data.streak.current} />
      </ScreenSection>
    </ScreenScrollView>
  );
}
