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
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useCourseWebUrl } from '@/feature/course/helpers/course-web-url';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { DownloadSheet } from '@/feature/downloads/components/download-sheet';
import { useCourseAvailableOffline } from '@/feature/downloads/helpers/download-store';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';

import { CourseRow } from './course-row';
import { PullRefreshControl, type RefreshHandler } from '@/feature/common/components/pull-refresh-control';

type CourseActions = {
  webUrl: (courseId: string) => string | null;
  onDownload: (courseId: string) => void;
  onCopyLink: (url: string) => void;
  onOpenMenu: (course: EnrolledCourse) => void;
};

function courseHref(courseId: string) {
  return { pathname: '/course/[courseId]', params: { courseId } } as const;
}

type CourseListRowProps = { course: EnrolledCourse; first: boolean; last: boolean; actions: CourseActions };

function CourseListRow({ course, first, last, actions }: CourseListRowProps) {
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const downloaded = useCourseAvailableOffline(course.id);
  const url = actions.webUrl(course.id);

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        first && styles.first,
        last && styles.last
      ]}
    >
      {first ? null : <View style={[styles.separator, { backgroundColor: colors.border }]} />}
      <Link href={courseHref(course.id)} push asChild>
        <Link.Trigger>
          <CourseRow
            course={course}
            onLongPress={Platform.OS === 'android' ? () => actions.onOpenMenu(course) : undefined}
          />
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
    </View>
  );
}

type CourseListProps = {
  courses: EnrolledCourse[];
  header?: ReactElement;
  empty?: ReactElement;
  onRefresh: RefreshHandler;
};

/** The learner's courses as one grouped list. Long-press a row for a preview and Open, Download and Copy link. */
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
        renderItem={({ item, index }) => (
          <CourseListRow course={item} first={index === 0} last={index === courses.length - 1} actions={actions} />
        )}
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
  row: { borderLeftWidth: StyleSheet.hairlineWidth * 2, borderRightWidth: StyleSheet.hairlineWidth * 2 },
  first: {
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  last: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomLeftRadius: RADII.xl,
    borderBottomRightRadius: RADII.xl,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  separator: { height: StyleSheet.hairlineWidth * 2, marginLeft: SPACING.md }
});
