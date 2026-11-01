import { ContentType } from '@cio/utils/constants/content';

import {
  OutlineList,
  OutlineRow,
  OutlineRowContent,
  OutlineRowDescription,
  OutlineRowIndicator,
  OutlineRowTitle,
  OutlineSection,
  OutlineSectionHeader
} from '@/feature/course/components/course-outline';
import { lessonKindLabel, lockReasonOf } from '@/feature/course/helpers/content-copy';
import { contentIconOf } from '@/feature/course/helpers/content-icon';
import { isAccessible } from '@/feature/course/helpers/course-content';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { ContentItemState, CourseContentItem } from '@/feature/course/types/course-detail';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import { useCompletionPending } from '@/feature/offline/helpers/sync-queue';

type LessonSectionListProps = {
  title: string | null;
  items: CourseContentItem[];
  /** Every item in the course, for explaining why one is locked. */
  allItems: CourseContentItem[];
  currentId: string;
  onOpen: (item: CourseContentItem) => void;
};

/** The items of the current section, with what is done, what is locked and where the learner is. */
export function LessonSectionList({ title, items, allItems, currentId, onOpen }: LessonSectionListProps) {
  const t = useTranslations(lessonCatalog);
  if (items.length < 2) return null;

  return (
    <OutlineSection>
      <OutlineSectionHeader title={title || t('inThisSection')} />
      <OutlineList>
        {items.map((item) => (
          <SectionRow key={item.id} item={item} allItems={allItems} viewing={item.id === currentId} onOpen={onOpen} />
        ))}
      </OutlineList>
    </OutlineSection>
  );
}

type SectionRowProps = {
  item: CourseContentItem;
  allItems: CourseContentItem[];
  viewing: boolean;
  onOpen: (item: CourseContentItem) => void;
};

function SectionRow({ item, allItems, viewing, onOpen }: SectionRowProps) {
  const t = useTranslations(lessonCatalog);
  const courseT = useTranslations(courseCatalog);
  const locked = !isAccessible(item);
  const syncPending = useCompletionPending(item.id) && !locked && !item.isComplete;
  const state: ContentItemState = viewing
    ? 'current'
    : item.isComplete || syncPending
      ? 'complete'
      : locked
        ? 'locked'
        : 'available';
  const isExercise = item.type === ContentType.Exercise;
  const title = item.title || (isExercise ? courseT('untitledExercise') : courseT('untitledLesson'));
  const kind = isExercise ? courseT('kindExercise') : lessonKindLabel(item, courseT);
  const description =
    state === 'locked'
      ? lockReasonOf(item, allItems, courseT)
      : syncPending
        ? `${kind} · ${courseT('syncsWhenOnline')}`
        : kind;
  const status = [viewing ? t('nowViewing') : null, item.isComplete || syncPending ? t('completed') : null]
    .filter(Boolean)
    .join(', ');

  return (
    <OutlineRow
      state={state}
      onPress={viewing ? undefined : () => onOpen(item)}
      accessibilityLabel={[title, status || null, description].filter(Boolean).join(', ')}
    >
      <OutlineRowIndicator icon={contentIconOf(item)} />
      <OutlineRowContent>
        <OutlineRowTitle>{title}</OutlineRowTitle>
        <OutlineRowDescription>{description}</OutlineRowDescription>
      </OutlineRowContent>
    </OutlineRow>
  );
}
