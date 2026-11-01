import { Stack } from 'expo-router';
import {} from 'lucide-react-native';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { Button } from '@/feature/common/components/button';
import { Empty, EmptyDescription, EmptyIllustration, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { DownloadCourseRow } from '@/feature/downloads/components/download-course-row';
import { DownloadSettingsGroup } from '@/feature/downloads/components/download-settings-group';
import {
  StorageBar,
  StorageLegend,
  StorageSummary,
  StorageSummaryHeader
} from '@/feature/downloads/components/storage-summary';
import { useDownloadErrorMessage } from '@/feature/downloads/helpers/download-error';
import { availableDiskSpace } from '@/feature/downloads/helpers/download-files';
import { removeAllDownloads } from '@/feature/downloads/helpers/download-manager';
import { useAllCourseDownloads, useDownloadedCourseIds } from '@/feature/downloads/helpers/download-store';
import { formatBytes } from '@/feature/downloads/helpers/format-bytes';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { SyncQueuePanel } from '@/feature/offline/components/sync-queue-panel';
import { showToast } from '@/feature/toast/helpers/toast-store';

export default function DownloadsScreen() {
  const t = useTranslations(downloadsCatalog);
  const locale = useLocale();
  const downloadErrorMessage = useDownloadErrorMessage();
  const courseIds = useDownloadedCourseIds();
  const courses = useAllCourseDownloads();
  const [confirmingRemoveAll, setConfirmingRemoveAll] = useState(false);
  const [removing, setRemoving] = useState(false);
  const usedBytes = courses.reduce((total, course) => total + course.bytes, 0);
  const lessonCount = courses.reduce((total, course) => total + course.lessons.length, 0);

  const removeAll = async () => {
    setRemoving(true);
    try {
      await removeAllDownloads();
      setConfirmingRemoveAll(false);
    } catch (error) {
      showToast({ tone: 'danger', title: t('removeAllError'), description: downloadErrorMessage(error) });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t('downloadsTitle') }} />
      <ScreenScrollView>
        {courseIds.length === 0 ? (
          <Empty>
            <EmptyIllustration name="downloads" />
            <EmptyTitle>{t('noDownloadsTitle')}</EmptyTitle>
            <EmptyDescription>{t('noDownloadsDescription')}</EmptyDescription>
          </Empty>
        ) : (
          <>
            <StorageSummary
              items={courses.map((course) => ({ id: course.courseId, label: course.title, bytes: course.bytes }))}
            >
              <StorageSummaryHeader freeBytes={availableDiskSpace()} />
              <StorageBar />
              <StorageLegend />
            </StorageSummary>

            <ScreenSection>
              <ScreenSectionHeader title={t('coursesSection')} />
              <ItemGroup>
                {courseIds.map((courseId) => (
                  <DownloadCourseRow key={courseId} courseId={courseId} />
                ))}
              </ItemGroup>
            </ScreenSection>
          </>
        )}

        <ScreenSection>
          <ScreenSectionHeader title={t('settingsSection')} />
          <DownloadSettingsGroup />
        </ScreenSection>

        <SyncQueuePanel />

        {courseIds.length > 0 ? (
          <Button variant="outline" size="lg" onPress={() => setConfirmingRemoveAll(true)}>
            <Text variant="label" tone="danger">
              {`${t('removeAllDownloads')} · ${formatBytes(usedBytes, locale)}`}
            </Text>
          </Button>
        ) : null}
      </ScreenScrollView>

      <AlertDialog open={confirmingRemoveAll} onOpenChange={setConfirmingRemoveAll} busy={removing}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('removeAllTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('removeAllDescription', { count: lessonCount })}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('keep')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" loading={removing} onPress={removeAll}>
              {t('removeAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
