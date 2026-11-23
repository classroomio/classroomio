import { DotsThreeIcon } from 'phosphor-react-native/src/icons/DotsThree';

import { Avatar } from '@/feature/common/components/avatar';
import { Button, ButtonIcon } from '@/feature/common/components/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { CourseMember } from '@/feature/staff/types/staff';

/** The name shown for a course member, falling back to their email and then a generic label. */
export function memberName(member: CourseMember, fallback: string) {
  return member.profile?.fullname || member.profile?.username || member.profile?.email || member.email || fallback;
}

type StudentRowProps = { member: CourseMember; onActions: (member: CourseMember) => void };

/** A student in a course with their progress and last sign-in, and a button for the row's actions. */
export function StudentRow({ member, onActions }: StudentRowProps) {
  const t = useTranslations(staffCatalog);
  const format = useFormatters();
  const locale = useLocale();
  const name = memberName(member, t('learnerFallback'));
  const progress = member.completedAt
    ? t('learnerCompleted')
    : t('progressComplete', { percent: format.percent(member.progressPercent) });
  const active = member.lastLoginAt
    ? t('lastActive', { time: timeAgo(member.lastLoginAt, Date.now(), locale) })
    : t('neverActive');
  const email = member.profile?.email || member.email;

  return (
    <Item>
      <ItemMedia>
        <Avatar name={name} uri={member.profile?.avatarUrl ?? null} size={40} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{name}</ItemTitle>
        {email && email !== name ? <ItemDescription numberOfLines={1}>{email}</ItemDescription> : null}
        <ItemDescription numberOfLines={1} tone="subtle">
          {[progress, active].join(' · ')}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          variant="secondary"
          size="icon"
          accessibilityLabel={t('studentActions', { name })}
          onPress={() => onActions(member)}
        >
          <ButtonIcon icon={DotsThreeIcon} />
        </Button>
      </ItemActions>
    </Item>
  );
}
