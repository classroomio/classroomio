import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { Empty, EmptyDescription, EmptyIllustration, EmptyTitle } from '@/feature/common/components/empty';
import { Icon } from '@/feature/common/components/icon';
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { DownloadCourseRow } from '@/feature/downloads/components/download-course-row';
import { DownloadSettingsGroup } from '@/feature/downloads/components/download-settings-group';
import {
  StorageLegend,
  StorageMeter,
  StorageSummary,
  StorageSummaryHeader
} from '@/feature/downloads/components/storage-summary';
import { useDownloadErrorMessage } from '@/feature/downloads/helpers/download-error';
import { availableDiskSpace, totalDiskSpace } from '@/feature/downloads/helpers/download-files';
import { removeAllDownloads } from '@/feature/downloads/helpers/download-manager';
import {
  useAllCourseDownloads,
  useDownloadedBytes,
  useDownloadedCourseIds
} from '@/feature/downloads/helpers/download-store';
import { formatBytes } from '@/feature/downloads/helpers/format-bytes';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { SyncQueuePanel } from '@/feature/offline/components/sync-queue-panel';
import { SettingValue } from '@/feature/settings/components/setting-value';
import { showToast } from '@/feature/toast/helpers/toast-store';

export default function DownloadsScreen() {
  const t = useTranslations(downloadsCatalog);
  const { colors } = useTheme();
  const locale = useLocale();
  const downloadErrorMessage = useDownloadErrorMessage();
  const courseIds = useDownloadedCourseIds();
  const courses = useAllCourseDownloads();
  const usedBytes = useDownloadedBytes();
  const [confirmingRemoveAll, setConfirmingRemoveAll] = useState(false);
  const [removing, setRemoving] = useState(false);
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
            <StorageSummary usedBytes={usedBytes} freeBytes={availableDiskSpace()} totalBytes={totalDiskSpace()}>
              <StorageSummaryHeader />
              <StorageMeter />
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
          <ItemGroup>
            <Item onPress={() => setConfirmingRemoveAll(true)}>
              <ItemMedia>
                <View style={[styles.dangerIcon, { backgroundColor: colors.dangerTint }]}>
                  <Icon icon={TrashIcon} size={18} tone="danger" weight="bold" />
                </View>
              </ItemMedia>
              <ItemContent>
                <ItemTitle numberOfLines={1} style={{ color: colors.danger }}>
                  {t('removeAllDownloads')}
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                <SettingValue>{formatBytes(usedBytes, locale)}</SettingValue>
              </ItemActions>
            </Item>
          </ItemGroup>
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

const styles = StyleSheet.create({
  dangerIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: RADII.input }
});
