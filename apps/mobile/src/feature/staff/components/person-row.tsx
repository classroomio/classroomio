import { Avatar } from '@/feature/common/components/avatar';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { OrgPerson } from '@/feature/staff/types/staff';

/** A member of the organization with their role, course count and last activity. */
export function PersonRow({ person }: { person: OrgPerson }) {
  const t = useTranslations(staffCatalog);
  const locale = useLocale();
  const name = person.fullname || person.email || t('learnerFallback');
  const role = { student: t('roleStudent'), tutor: t('roleTutor'), admin: t('roleAdmin') }[person.role];
  const status = person.invited
    ? t('invitedStatus')
    : person.lastActiveAt
      ? t('lastActive', { time: timeAgo(person.lastActiveAt, Date.now(), locale) })
      : t('neverActive');
  const courses = person.courseCount > 0 ? t('courseCount', { count: person.courseCount }) : null;

  return (
    <Item>
      <ItemMedia>
        <Avatar name={name} uri={person.avatarUrl} size={40} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{name}</ItemTitle>
        {person.email && person.email !== name ? (
          <ItemDescription numberOfLines={1}>{person.email}</ItemDescription>
        ) : null}
        <ItemDescription numberOfLines={1} tone="subtle">
          {[role, courses, status].filter(Boolean).join(' · ')}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
