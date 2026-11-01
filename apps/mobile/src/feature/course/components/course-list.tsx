import { ArrowSquareOutIcon } from 'phosphor-react-native/src/icons/ArrowSquareOut';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { LinkIcon } from 'phosphor-react-native/src/icons/Link';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { Link, router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetContent,
  OptionSheetItem,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { PullRefreshControl, type RefreshHandler } from '@/feature/common/components/pull-refresh-control';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useScreenReaderEnabled } from '@/feature/common/helpers/use-screen-reader-enabled';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useCourseWebUrl } from '@/feature/course/helpers/course-web-url';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { DownloadSheet } from '@/feature/downloads/components/download-sheet';
import { useCourseAvailableOffline } from '@/feature/downloads/helpers/download-store';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';

import { COURSE_ROW_ARTWORK_WIDTH, CourseRow } from './course-row';

type CourseActions = {
  webUrl: (courseId: string) => string | null;
  onDownload: (courseId: string) => void;
  onCopyLink: (url: string) => void;
  onOpenMenu: (course: EnrolledCourse) => void;
};

function courseHref(courseId: string) {
  return { pathname: '/course/[courseId]', params: { courseId } } as const;
}

type CourseListRowProps = { course: EnrolledCourse; actions: CourseActions };

function CourseListRow({ course, actions }: CourseListRowProps) {
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const downloaded = useCourseAvailableOffline(course.id);
  const url = actions.webUrl(course.id);
  const screenReader = useScreenReaderEnabled();

  if (screenReader || Platform.OS === 'android') {
    // The native preview and menu remove the row from the iOS accessibility tree.
    return (
      <Link href={courseHref(course.id)} push asChild>
        <CourseRow
          course={course}
          onLongPress={() => actions.onOpenMenu(course)}
          accessibilityActions={[
            { name: 'download', label: downloaded ? t('menuManageDownload') : t('menuDownload') },
            ...(url ? [{ name: 'copyLink', label: t('menuCopyLink') }] : [])
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'download') actions.onDownload(course.id);
            if (event.nativeEvent.actionName === 'copyLink' && url) actions.onCopyLink(url);
          }}
        />
      </Link>
    );
  }

  return (
    <Link href={courseHref(course.id)} push asChild>
      <Link.Trigger>
        <CourseRow course={course} />
      </Link.Trigger>
      <Link.Preview />
      <Link.Menu>
        <Link.MenuAction icon="arrow.up.right.square" onPress={() => router.push(courseHref(course.id))}>
          {common('open')}
        </Link.MenuAction>
        <Link.MenuAction
          icon={downloaded ? 'checkmark.circle' : 'arrow.down.circle'}
          onPress={() => actions.onDownload(course.id)}
        >
          {downloaded ? t('menuManageDownload') : t('menuDownload')}
        </Link.MenuAction>
        <Link.MenuAction icon="link" hidden={!url} onPress={() => url && actions.onCopyLink(url)}>
          {t('menuCopyLink')}
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  );
}

function CourseListSeparator() {
  const { colors } = useTheme();

  return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
}

type CourseListProps = {
  courses: EnrolledCourse[];
  header?: ReactElement;
  empty?: ReactElement;
  onRefresh: RefreshHandler;
};

/** The learner's courses as a list of artwork rows. Long-press a row for a preview and Open, Download and Copy link. */
export function CourseList({ courses, header, empty, onRefresh }: CourseListProps) {
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const webUrl = useCourseWebUrl();
  const [downloadCourseId, setDownloadCourseId] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [menuCourse, setMenuCourse] = useState<EnrolledCourse | null>(null);
  const menuUrl = menuCourse ? webUrl(menuCourse.id) : null;

  const actions: CourseActions = {
    webUrl,
    onDownload: (courseId) => {
      setDownloadCourseId(courseId);
      setDownloadOpen(true);
    },
    onCopyLink: (url) => {
      void Clipboard.setStringAsync(url).then(() => showToast({ tone: 'success', title: t('linkCopied') }));
    },
    onOpenMenu: setMenuCourse
  };

  return (
    <>
      <FlashList
        data={courses}
        keyExtractor={(course) => course.id}
        renderItem={({ item }) => <CourseListRow course={item} actions={actions} />}
        ItemSeparatorComponent={CourseListSeparator}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        refreshControl={<PullRefreshControl onRefresh={onRefresh} />}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      />

      {downloadCourseId ? (
        <DownloadSheet open={downloadOpen} onOpenChange={setDownloadOpen} courseId={downloadCourseId} />
      ) : null}

      <OptionSheet open={menuCourse !== null} onOpenChange={(open) => !open && setMenuCourse(null)}>
        <OptionSheetContent>
          {menuCourse ? <OptionSheetTitle>{menuCourse.title}</OptionSheetTitle> : null}
          <OptionSheetItem
            icon={ArrowSquareOutIcon}
            onSelect={() => menuCourse && router.push(courseHref(menuCourse.id))}
          >
            {common('open')}
          </OptionSheetItem>
          <OptionSheetItem icon={DownloadSimpleIcon} onSelect={() => menuCourse && actions.onDownload(menuCourse.id)}>
            {t('menuDownload')}
          </OptionSheetItem>
          {menuUrl ? (
            <OptionSheetItem icon={LinkIcon} onSelect={() => actions.onCopyLink(menuUrl)}>
              {t('menuCopyLink')}
            </OptionSheetItem>
          ) : null}
          <OptionSheetCancel />
        </OptionSheetContent>
      </OptionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: COURSE_ROW_ARTWORK_WIDTH + SPACING.md }
});
