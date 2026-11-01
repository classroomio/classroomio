import { CircleCheck, CirclePause, Download, TriangleAlert, Wifi, WifiOff, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { Progress } from '@/feature/common/components/progress';
import { Text, type TextTone } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { courseDownloadPercent, courseDownloadSummary } from '@/feature/downloads/helpers/download-copy';
import { useCourseDownload } from '@/feature/downloads/helpers/download-store';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import type { DownloadStatus } from '@/feature/downloads/types/downloads';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const STATUS_ICON: Record<DownloadStatus, { icon: LucideIcon; tone: TextTone }> = {
  complete: { icon: CircleCheck, tone: 'success' },
  downloading: { icon: Download, tone: 'primary' },
  queued: { icon: Download, tone: 'muted' },
  waiting: { icon: WifiOff, tone: 'muted' },
  paused: { icon: CirclePause, tone: 'muted' },
  failed: { icon: TriangleAlert, tone: 'danger' }
};

export function CourseDownloadStatus({ courseId }: { courseId: string }) {
  const t = useTranslations(downloadsCatalog);
  const locale = useLocale();
  const course = useCourseDownload(courseId);
  if (!course) return null;

  const { icon: statusIcon, tone } = STATUS_ICON[course.status];
  const icon = course.status === 'waiting' && course.waitReason === 'wifi' ? Wifi : statusIcon;
  const summary = courseDownloadSummary(course, t, locale);
  const label = course.status === 'complete' ? `${t('downloaded')} · ${summary}` : summary;
  const showProgress = course.status === 'downloading' || course.status === 'paused';

  return (
    <View style={styles.root} accessible accessibilityLabel={label}>
      <View style={styles.row}>
        <Icon icon={icon} size={16} tone={tone} />
        <Text
          variant="caption"
          tone={course.status === 'failed' ? 'danger' : 'muted'}
          numberOfLines={1}
          style={styles.label}
        >
          {label}
        </Text>
      </View>
      {showProgress ? <Progress value={courseDownloadPercent(course)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  label: { flex: 1, fontVariant: ['tabular-nums'] }
});
