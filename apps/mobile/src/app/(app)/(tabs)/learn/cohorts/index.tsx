import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { router } from 'expo-router';

import { useCohortsQuery } from '@/feature/cohort/api/cohorts';
import { CohortItem } from '@/feature/cohort/components/cohort-item';
import { CohortListSkeleton } from '@/feature/cohort/components/cohort-skeleton';
import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { ScreenScrollView } from '@/feature/common/components/screen';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function CohortsScreen() {
  const t = useTranslations(cohortCatalog);
  const common = useTranslations(commonCatalog);
  const cohorts = useCohortsQuery();

  return (
    <ScreenScrollView onRefresh={() => cohorts.refetch()}>
      {cohorts.isPending ? <CohortListSkeleton /> : null}

      {cohorts.isError && !cohorts.data ? (
        <Empty>
          <EmptyMedia icon={UsersThreeIcon} />
          <EmptyTitle>{t('cohortsLoadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(cohorts.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={() => cohorts.refetch()}>
              <ButtonText>{common('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {cohorts.data?.length === 0 ? (
        <Empty>
          <EmptyMedia icon={UsersThreeIcon} />
          <EmptyTitle>{t('noCohortsTitle')}</EmptyTitle>
          <EmptyDescription>{t('noCohortsDescription')}</EmptyDescription>
        </Empty>
      ) : null}

      {cohorts.data && cohorts.data.length > 0 ? (
        <ItemGroup>
          {cohorts.data.map((cohort) => (
            <CohortItem
              key={cohort.id}
              cohort={cohort}
              onPress={() => router.push({ pathname: '/learn/cohorts/[cohortId]', params: { cohortId: cohort.id } })}
            />
          ))}
        </ItemGroup>
      ) : null}
    </ScreenScrollView>
  );
}
