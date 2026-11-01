import { router } from 'expo-router';
import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';

import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { relativeDays } from '@/feature/course/helpers/compliance-deadline';
import { daysUntil, formatDay } from '@/feature/course/helpers/format-date';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { DueSoonItem } from '@/feature/course/types/home-digest';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

/** Required courses with a deadline coming up, nearest first. */
export function DueSoonList({ items }: { items: DueSoonItem[] }) {
  const t = useTranslations(courseCatalog);
  const locale = useLocale();

  return (
    <ItemGroup>
      {items.map((item) => {
        const days = Math.max(0, daysUntil(item.dueDate));

        return (
          <Item
            key={item.courseId}
            onPress={() => router.push({ pathname: '/course/[courseId]', params: { courseId: item.courseId } })}
          >
            <ItemMedia variant="tile">
              <Icon icon={CalendarDotsIcon} size={20} tone={days <= 3 ? 'danger' : 'warning'} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle numberOfLines={1}>{item.courseTitle}</ItemTitle>
              <ItemDescription>
                {t('complianceDue', { date: formatDay(item.dueDate, locale), relative: relativeDays(days, t) })}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <ItemChevron />
            </ItemActions>
          </Item>
        );
      })}
    </ItemGroup>
  );
}
