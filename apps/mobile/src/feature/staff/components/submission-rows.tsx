import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';

import { Avatar } from '@/feature/common/components/avatar';
import { IconTile } from '@/feature/common/components/icon-tile';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { GradedSubmission, UpcomingSubmission } from '@/feature/staff/types/staff';

const DUE_SOON_MS = 2 * 24 * 60 * 60 * 1000;

/** An exercise with a due date ahead and how many of its students have submitted. */
export function UpcomingSubmissionRow({ item }: { item: UpcomingSubmission }) {
  const t = useTranslations(staffCatalog);
  const format = useFormatters();
  const due = new Date(parseTimestamp(item.dueBy));
  const dueSoon = due.getTime() - Date.now() < DUE_SOON_MS;
  const dueLabel = t('dueOn', { date: `${format.shortDate(due)}, ${format.time(due)}` });
  const submitted = t('upcomingSubmitted', {
    submitted: format.number(item.submittedCount),
    total: format.number(item.studentCount)
  });
  const share = item.studentCount > 0 ? (item.submittedCount / item.studentCount) * 100 : 0;

  return (
    <Item>
      <ItemMedia>
        <IconTile icon={CalendarBlankIcon} tone={dueSoon ? 'warning' : 'neutral'} size={36} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={2}>{item.title}</ItemTitle>
        <ItemDescription numberOfLines={1}>{item.courseTitle}</ItemDescription>
        <Text variant="caption" tone={dueSoon ? 'warning' : 'subtle'} numberOfLines={1}>
          {[dueLabel, submitted].join(' · ')}
        </Text>
        <Progress value={share} />
      </ItemContent>
    </Item>
  );
}

type GradedSubmissionRowProps = { item: GradedSubmission; onPress: (item: GradedSubmission) => void };

/** A graded submission with its score and when it was graded. */
export function GradedSubmissionRow({ item, onPress }: GradedSubmissionRowProps) {
  const t = useTranslations(staffCatalog);
  const format = useFormatters();
  const student = item.student?.fullname || t('learnerFallback');
  const score = t('historyScore', { score: format.number(item.total ?? 0), max: format.number(item.maxPoints) });
  const graded = item.gradedAt
    ? t('gradedOn', { date: format.shortDate(new Date(parseTimestamp(item.gradedAt))) })
    : null;

  return (
    <Item
      onPress={() => onPress(item)}
      accessibilityLabel={[student, item.exerciseTitle, item.courseTitle, score, graded].filter(Boolean).join(', ')}
    >
      <ItemMedia>
        <Avatar name={student} uri={item.student?.avatarUrl ?? null} size={36} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{student}</ItemTitle>
        <ItemDescription numberOfLines={1}>{[item.exerciseTitle, item.courseTitle].join(' · ')}</ItemDescription>
        <Text variant="caption" tone="subtle" numberOfLines={1}>
          {[score, graded].filter(Boolean).join(' · ')}
        </Text>
      </ItemContent>
      <ItemActions>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}
