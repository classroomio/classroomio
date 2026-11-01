import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { ProgressRing } from '@/feature/common/components/progress';
import { HIT_SLOP } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { courseDownloadPercent } from '@/feature/downloads/helpers/download-copy';
import { useCourseDownload } from '@/feature/downloads/helpers/download-store';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import type { en } from '@/feature/downloads/translations/en';
import type { DownloadStatus } from '@/feature/downloads/types/downloads';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { DownloadSheet } from './download-sheet';

type HeaderGlyphProps = { status: DownloadStatus | null; percent: number };

function HeaderGlyph({ status, percent }: HeaderGlyphProps) {
  if (status === 'downloading' || status === 'queued' || status === 'waiting') {
    return <ProgressRing value={status === 'downloading' ? percent : 0} size={22} strokeWidth={2.5} />;
  }

  const icon: AppIcon = status === 'complete' ? CheckCircleIcon : DownloadSimpleIcon;

  return <Icon icon={icon} size={22} tone={status === 'complete' ? 'success' : 'primary'} />;
}

const STATUS_LABEL_KEYS = {
  course: {
    complete: 'courseDownloaded',
    downloading: 'courseDownloading',
    queued: 'courseQueued',
    paused: 'coursePaused',
    idle: 'downloadCourse'
  },
  lesson: {
    complete: 'lessonDownloaded',
    downloading: 'lessonDownloading',
    queued: 'lessonQueued',
    paused: 'lessonPaused',
    idle: 'downloadLesson'
  }
} as const satisfies Record<string, Record<string, keyof typeof en>>;

function statusLabelKey(status: DownloadStatus | null, subject: keyof typeof STATUS_LABEL_KEYS) {
  const keys = STATUS_LABEL_KEYS[subject];
  if (status === 'complete') return keys.complete;
  if (status === 'downloading') return keys.downloading;
  if (status === 'queued' || status === 'waiting') return keys.queued;
  if (status === 'paused') return keys.paused;

  return keys.idle;
}

function HeaderButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={styles.button}
    >
      {children}
    </Pressable>
  );
}

export function CourseDownloadHeaderButton({ courseId }: { courseId: string }) {
  const t = useTranslations(downloadsCatalog);
  const course = useCourseDownload(courseId);
  const [open, setOpen] = useState(false);
  const status = course?.status ?? null;

  return (
    <>
      <HeaderButton label={t(statusLabelKey(status, 'course'))} onPress={() => setOpen(true)}>
        <HeaderGlyph status={status} percent={course ? courseDownloadPercent(course) : 0} />
      </HeaderButton>
      <DownloadSheet open={open} onOpenChange={setOpen} courseId={courseId} />
    </>
  );
}

export function LessonDownloadHeaderButton({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const t = useTranslations(downloadsCatalog);
  const lesson = useCourseDownload(courseId)?.lessons.find((entry) => entry.lessonId === lessonId) ?? null;
  const [open, setOpen] = useState(false);
  const status = lesson?.status ?? null;
  const percent = lesson && lesson.expectedBytes > 0 ? Math.min(99, (lesson.bytes / lesson.expectedBytes) * 100) : 0;

  return (
    <>
      <HeaderButton label={t(statusLabelKey(status, 'lesson'))} onPress={() => setOpen(true)}>
        <HeaderGlyph status={status} percent={percent} />
      </HeaderButton>
      <DownloadSheet open={open} onOpenChange={setOpen} courseId={courseId} lessonId={lessonId} />
    </>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }
});
