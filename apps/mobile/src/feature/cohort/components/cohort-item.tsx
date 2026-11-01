import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';

import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import type { LearnerCohort } from '@/feature/cohort/types/cohort';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { IconTile } from '@/feature/common/components/icon-tile';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

/** A cohort the learner belongs to, with its course and learner counts. */
export function CohortItem({ cohort, onPress }: { cohort: LearnerCohort; onPress: () => void }) {
  const t = useTranslations(cohortCatalog);
  const { colors } = useTheme();
  const meta = `${t('courseCount', { count: cohort.courseCount })} · ${t('learnerCount', { count: cohort.studentCount })}`;

  return (
    <Item onPress={onPress} accessibilityLabel={`${cohort.name}, ${meta}`}>
      <ItemMedia>
        <IconTile icon={UsersThreeIcon} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{cohort.name}</ItemTitle>
        <ItemDescription numberOfLines={1}>{meta}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}
