import { PauseCircleIcon } from 'phosphor-react-native/src/icons/PauseCircle';
import { PlayCircleIcon } from 'phosphor-react-native/src/icons/PlayCircle';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { CourseThumbnail } from '@/feature/course/components/course-thumbnail';
import {
  courseDownloadPercent,
  courseDownloadSummary,
  downloadStatusIconOf
} from '@/feature/downloads/helpers/download-copy';
import { useDownloadErrorMessage } from '@/feature/downloads/helpers/download-error';
import {
  pauseCourseDownload,
  removeCourseDownload,
  resumeCourseDownload
} from '@/feature/downloads/helpers/download-manager';
import { useCourseDownload } from '@/feature/downloads/helpers/download-store';
import { formatBytes } from '@/feature/downloads/helpers/format-bytes';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';

function RowIconButton({ icon, label, onPress }: { icon: AppIcon; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={styles.iconButton}
    >
      <Icon icon={icon} size={20} tone="muted" />
    </Pressable>
  );
}

/** One downloaded or downloading course; subscribes to its own progress so siblings do not re-render. */
export function DownloadCourseRow({ courseId }: { courseId: string }) {
  const t = useTranslations(downloadsCatalog);
  const downloadErrorMessage = useDownloadErrorMessage();
  const locale = useLocale();
  const course = useCourseDownload(courseId);
  const enrolled = useEnrolledCoursesQuery();
  const artwork = enrolled.data?.find((item) => item.id === courseId);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  if (!course) return null;

  const active = course.status === 'downloading' || course.status === 'queued' || course.status === 'waiting';
  const resumable = course.status === 'paused' || course.status === 'failed';
  const summary = courseDownloadSummary(course, t, locale);
  const status = downloadStatusIconOf(course);

  const remove = async () => {
    setRemoving(true);
    try {
      await removeCourseDownload(courseId);
      setConfirming(false);
    } catch (error) {
      showToast({ tone: 'danger', title: t('removeError'), description: downloadErrorMessage(error) });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <Item
        onPress={() => router.push({ pathname: '/course/[courseId]', params: { courseId } })}
        accessibilityLabel={`${course.title}, ${summary}`}
        accessibilityHint={t('opensCourse')}
      >
        <ItemMedia>
          <CourseThumbnail uri={artwork?.bannerImage || artwork?.logo} size={48} recyclingKey={courseId} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle numberOfLines={2}>{course.title}</ItemTitle>
          <View style={styles.status}>
            <Icon
              icon={status.icon}
              size={14}
              tone={status.tone}
              weight={course.status === 'complete' ? 'fill' : 'regular'}
            />
            <Text
              variant="caption"
              tone={course.status === 'failed' ? 'danger' : 'muted'}
              numberOfLines={1}
              style={styles.numbers}
            >
              {summary}
            </Text>
          </View>
          {active || course.status === 'paused' ? (
            <View style={styles.progress}>
              <Progress value={courseDownloadPercent(course)} />
            </View>
          ) : null}
        </ItemContent>
        <ItemActions>
          {active ? (
            <RowIconButton
              icon={PauseCircleIcon}
              label={t('pauseItem', { title: course.title })}
              onPress={() => void pauseCourseDownload(courseId)}
            />
          ) : null}
          {resumable ? (
            <RowIconButton
              icon={PlayCircleIcon}
              label={t('resumeItem', { title: course.title })}
              onPress={() => void resumeCourseDownload(courseId)}
            />
          ) : null}
          <RowIconButton
            icon={TrashIcon}
            label={t('removeItem', { title: course.title })}
            onPress={() => setConfirming(true)}
          />
        </ItemActions>
      </Item>

      <AlertDialog open={confirming} onOpenChange={setConfirming} busy={removing}>
        <AlertDialogContent>
          <AlertDialogTitle>{active ? t('cancelDownloadTitle') : t('removeDownloadTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('removeDownloadDescription', { title: course.title, size: formatBytes(course.bytes, locale) })}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('keep')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" loading={removing} onPress={remove}>
              {t('remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs + 1 },
  numbers: { flexShrink: 1, fontVariant: ['tabular-nums'] },
  progress: { marginTop: SPACING.xs },
  iconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }
});
