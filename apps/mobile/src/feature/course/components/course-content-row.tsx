import { ContentType } from '@cio/utils/constants/content';

import { Button, ButtonText } from '@/feature/common/components/button';
import {
  exerciseDetail,
  lessonKindLabel,
  liveSessionLabel,
  liveSessionPhaseOf,
  lockReasonOf
} from '@/feature/course/helpers/content-copy';
import { contentIconOf } from '@/feature/course/helpers/content-icon';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { ContentItemState, CourseContentItem } from '@/feature/course/types/course-detail';
import { useLessonDownloadStatus } from '@/feature/downloads/helpers/download-store';
import { useOpenLink } from '@/feature/lesson/helpers/open-external';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useCompletionPending } from '@/feature/offline/helpers/sync-queue';

import {
  OutlineRow,
  OutlineRowActions,
  OutlineRowContent,
  OutlineRowDescription,
  OutlineRowIndicator,
  OutlineRowTitle
} from './course-outline';

type CourseContentRowProps = {
  courseId: string;
  item: CourseContentItem;
  state: ContentItemState;
  items: CourseContentItem[];
  isLiveClass: boolean;
  offline: boolean;
  onOpen: (item: CourseContentItem) => void;
};

export function CourseContentRow({
  courseId,
  item,
  state: serverState,
  items,
  isLiveClass,
  offline,
  onOpen
}: CourseContentRowProps) {
  const t = useTranslations(courseCatalog);
  const locale = useLocale();
  const { openInSystem } = useOpenLink();
  const downloadStatus = useLessonDownloadStatus(courseId, item.id);
  const syncPending = useCompletionPending(item.id) && serverState !== 'locked' && serverState !== 'complete';
  const state: ContentItemState = syncPending ? 'complete' : serverState;
  const isExercise = item.type === ContentType.Exercise;
  const session = isLiveClass && !isExercise ? liveSessionLabel(item, t, locale) : null;
  const phase = session ? liveSessionPhaseOf(item) : null;
  const canJoin = state !== 'locked' && Boolean(item.callUrl) && (phase === 'live' || phase === 'upcoming');

  let description: string;
  if (state === 'locked') description = lockReasonOf(item, items, t);
  else if (session) description = session;
  else if (isExercise) description = exerciseDetail(item, t, locale);
  else description = lessonKindLabel(item, t);
  if (state === 'current' && !session) description = `${t('upNext')} · ${description}`;

  const offlineNote =
    state === 'locked'
      ? null
      : syncPending
        ? t('syncsWhenOnline')
        : isExercise && offline
          ? t('needsConnection')
          : downloadStatus === 'complete'
            ? t('downloaded')
            : downloadStatus === 'downloading'
              ? t('downloading')
              : null;
  if (offlineNote) description = `${description} · ${offlineNote}`;

  const status =
    state === 'complete' ? t('completed') : state === 'current' ? t('upNext') : state === 'locked' ? t('locked') : null;

  return (
    <OutlineRow
      state={state}
      onPress={() => onOpen(item)}
      accessibilityLabel={[item.title, status, description].filter(Boolean).join(', ')}
      accessibilityHint={isExercise ? t('opensExercise') : t('opensLesson')}
    >
      <OutlineRowIndicator icon={contentIconOf(item)} />
      <OutlineRowContent>
        <OutlineRowTitle>{item.title || (isExercise ? t('untitledExercise') : t('untitledLesson'))}</OutlineRowTitle>
        <OutlineRowDescription tone={phase === 'live' && state !== 'locked' ? 'primary' : undefined}>
          {description}
        </OutlineRowDescription>
      </OutlineRowContent>
      <OutlineRowActions>
        {canJoin && item.callUrl ? (
          <Button
            size="sm"
            variant={phase === 'live' ? 'primary' : 'outline'}
            onPress={() => openInSystem(item.callUrl!)}
          >
            <ButtonText>{t('join')}</ButtonText>
          </Button>
        ) : null}
      </OutlineRowActions>
    </OutlineRow>
  );
}
