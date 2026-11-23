import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
import { HourglassIcon } from 'phosphor-react-native/src/icons/Hourglass';
import { router } from 'expo-router';

import { IconTile } from '@/feature/common/components/icon-tile';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { daysUntil, formatDay } from '@/feature/course/helpers/format-date';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { learningCatalog } from '@/feature/learning/translations/catalog';
import type { Assignment } from '@/feature/learning/types/learning';

/** An exercise in one of the learner's courses, with its due date, submission or grade. */
export function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const t = useTranslations(learningCatalog);
  const format = useFormatters();
  const locale = useLocale();
  const overdue = assignment.status === 'upcoming' && assignment.dueAt !== null && daysUntil(assignment.dueAt) < 0;

  const detail =
    assignment.status === 'graded'
      ? assignment.score !== null && assignment.maxScore
        ? t('score', { score: format.number(assignment.score), max: format.number(assignment.maxScore) })
        : t('statusGraded')
      : assignment.status === 'submitted'
        ? assignment.submittedAt
          ? t('submittedOn', { date: formatDay(assignment.submittedAt, locale) })
          : t('statusSubmitted')
        : assignment.dueAt
          ? overdue
            ? t('overdueSince', { date: formatDay(assignment.dueAt, locale) })
            : t('dueOn', { date: formatDay(assignment.dueAt, locale) })
          : t('noDueDate');

  return (
    <Item
      onPress={() =>
        router.push({
          pathname: '/course/[courseId]/exercise/[exerciseId]',
          params: { courseId: assignment.course.id, exerciseId: assignment.exerciseId }
        })
      }
    >
      <ItemMedia>
        <IconTile
          icon={
            assignment.status === 'graded'
              ? CheckCircleIcon
              : assignment.status === 'submitted'
                ? HourglassIcon
                : ClipboardTextIcon
          }
          tone={overdue ? 'danger' : assignment.status === 'graded' ? 'success' : 'neutral'}
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={2}>{assignment.title}</ItemTitle>
        <ItemDescription numberOfLines={1}>{assignment.course.title}</ItemDescription>
        <ItemDescription numberOfLines={1} tone={overdue ? 'danger' : undefined}>
          {detail}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
