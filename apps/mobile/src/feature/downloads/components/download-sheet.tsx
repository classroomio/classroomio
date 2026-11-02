import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { LockIcon } from 'phosphor-react-native/src/icons/Lock';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import { useQuery } from '@tanstack/react-query';
import { NetworkStateType, useNetworkState } from 'expo-network';
import { Children, Fragment, isValidElement, useState, type ReactNode, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetHeader,
  SheetHeading,
  SheetTitle,
  useSheetDismiss,
  type SheetRef
} from '@/feature/common/components/bottom-sheet';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Card } from '@/feature/common/components/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle
} from '@/feature/common/components/item';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Switch } from '@/feature/common/components/switch';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { FREE_SPACE_MARGIN_BYTES } from '@/feature/downloads/constants/downloads';
import { useDownloadErrorMessage } from '@/feature/downloads/helpers/download-error';
import { availableDiskSpace } from '@/feature/downloads/helpers/download-files';
import {
  planDownload,
  removeCourseDownload,
  removeLessonDownloads,
  startDownload
} from '@/feature/downloads/helpers/download-manager';
import { useCourseDownload } from '@/feature/downloads/helpers/download-store';
import { updateDownloadSettings, useDownloadSettings } from '@/feature/downloads/helpers/download-settings';
import { formatBytes } from '@/feature/downloads/helpers/format-bytes';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import type { en } from '@/feature/downloads/translations/en';
import type { DownloadPlan } from '@/feature/downloads/types/downloads';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { Locale } from '@/feature/i18n/types/i18n';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import { showToast } from '@/feature/toast/helpers/toast-store';

type DownloadSheetProps = {
  ref: Ref<SheetRef>;
  courseId: string | null;
  lessonId?: string;
  onDismiss?: () => void;
};

export function DownloadSheet({ ref, courseId, lessonId, onDismiss }: DownloadSheetProps) {
  return (
    <Sheet ref={ref} onDismiss={onDismiss}>
      {courseId ? <DownloadSheetBody courseId={courseId} lessonId={lessonId} /> : null}
    </Sheet>
  );
}

type DownloadsTranslator = Translator<typeof en>;

function connectionLabel(type: NetworkStateType | undefined, offline: boolean, t: DownloadsTranslator) {
  if (offline) return t('connectionOffline');
  if (type === NetworkStateType.WIFI) return t('connectionWifi');
  if (type === NetworkStateType.ETHERNET) return t('connectionEthernet');
  if (type === NetworkStateType.CELLULAR) return t('connectionCellular');

  return t('connectionConnected');
}

function sizeLabel(plan: DownloadPlan, t: DownloadsTranslator, locale: Locale) {
  if (plan.sizeBytes === 0) return plan.sizeComplete ? formatBytes(0, locale) : t('unknown');

  const size = formatBytes(plan.sizeBytes, locale);

  return plan.sizeComplete ? size : t('atLeastSize', { size });
}

function DownloadSheetBody({ courseId, lessonId }: { courseId: string; lessonId?: string }) {
  const t = useTranslations(downloadsCatalog);
  const downloadErrorMessage = useDownloadErrorMessage();
  const locale = useLocale();
  const close = useSheetDismiss();
  const offline = useIsOffline();
  const network = useNetworkState();
  const orgId = useActiveOrgId();
  const settings = useDownloadSettings();
  const [starting, setStarting] = useState(false);
  const existing = useCourseDownload(courseId);
  const stored = lessonId
    ? existing?.lessons.some((lesson) => lesson.lessonId === lessonId && lesson.status === 'complete')
    : existing?.status === 'complete';
  const plan = useQuery({
    queryKey: ['downloads', 'plan', courseId, lessonId ?? null],
    queryFn: () => planDownload(courseId, lessonId),
    staleTime: 0,
    gcTime: 0,
    retry: 1
  });
  const free = availableDiskSpace();
  const onWifi = network.type === NetworkStateType.WIFI || network.type === NetworkStateType.ETHERNET;
  const waitsForWifi = settings.wifiOnly && !onWifi;
  const data = plan.data;
  const tooBig = Boolean(data && free !== null && data.sizeBytes + FREE_SPACE_MARGIN_BYTES > free);

  const start = async () => {
    if (!data || !orgId) return;

    setStarting(true);
    try {
      await startDownload(data, orgId);
      successHaptic();
      showToast({
        tone: 'success',
        title: waitsForWifi ? t('downloadQueued') : t('downloadingNow'),
        description: waitsForWifi ? t('startsOnWifi') : t('trackInProfile')
      });
      close();
    } catch (error) {
      showToast({ tone: 'danger', title: t('startError'), description: downloadErrorMessage(error) });
    } finally {
      setStarting(false);
    }
  };

  const remove = async () => {
    try {
      if (lessonId) await removeLessonDownloads(courseId, [lessonId]);
      else await removeCourseDownload(courseId);
      close();
    } catch (error) {
      showToast({ tone: 'danger', title: t('removeError'), description: downloadErrorMessage(error) });
    }
  };

  const title = lessonId ? t('downloadThisLesson') : t('downloadThisCourse');

  return (
    <>
      <SheetHeader>
        <SheetHeading>
          <SheetTitle>{title}</SheetTitle>
          {data ? <SheetDescription>{data.title}</SheetDescription> : null}
        </SheetHeading>
        <SheetClose />
      </SheetHeader>
      <View style={styles.body}>
        {offline && !data ? (
          <Banner tone="neutral">
            <BannerIcon icon={WifiSlashIcon} />
            <BannerContent>
              <BannerTitle>{t('needConnectionTitle')}</BannerTitle>
              <BannerDescription>{t('needConnectionDescription')}</BannerDescription>
            </BannerContent>
          </Banner>
        ) : plan.isPending ? (
          <View style={styles.loading}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={120} />
            <Skeleton height={56} />
          </View>
        ) : !data ? (
          <Banner tone="danger">
            <BannerIcon icon={WarningIcon} />
            <BannerContent>
              <BannerTitle>{t('planLoadError')}</BannerTitle>
              <BannerDescription>{downloadErrorMessage(plan.error)}</BannerDescription>
            </BannerContent>
          </Banner>
        ) : data.lessons.length === 0 && !stored ? (
          <Banner tone="neutral">
            <BannerIcon icon={LockIcon} />
            <BannerContent>
              <BannerTitle>
                {data.lockedCount > 0 ? (lessonId ? t('lessonLocked') : t('noLessonsOpen')) : t('nothingToDownload')}
              </BannerTitle>
              <BannerDescription>
                {data.lockedCount > 0 ? t('finishEarlierItems') : t('noSavableLessons')}
              </BannerDescription>
            </BannerContent>
          </Banner>
        ) : data.lessons.length === 0 ? (
          <>
            <Banner tone="success">
              <BannerIcon icon={CheckCircleIcon} />
              <BannerContent>
                <BannerTitle>{lessonId ? t('lessonOnDevice') : t('everythingOnDevice')}</BannerTitle>
                {existing ? (
                  <BannerDescription>{t('usesSize', { size: formatBytes(existing.bytes, locale) })}</BannerDescription>
                ) : null}
                {!lessonId && data.lockedCount > 0 ? (
                  <BannerDescription>{t('lockedDownloadLater')}</BannerDescription>
                ) : null}
              </BannerContent>
            </Banner>
            {stored ? (
              <Button variant="outline" onPress={remove}>
                <ButtonText>{lessonId ? t('removeLessonDownload') : t('removeDownload')}</ButtonText>
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <DownloadFacts>
              <DownloadFact
                label={lessonId ? t('factLesson') : t('factLessons')}
                value={t('lessonCount', { count: data.lessons.length })}
              />
              <DownloadFact label={t('factSize')} value={sizeLabel(data, t, locale)} />
              <DownloadFact
                label={t('factFreeSpace')}
                value={free === null ? t('unknown') : formatBytes(free, locale)}
              />
              <DownloadFact label={t('factConnection')} value={connectionLabel(network.type, offline, t)} />
            </DownloadFacts>

            <ItemGroup>
              <Item>
                <ItemContent>
                  <ItemTitle>{t('wifiOnly')}</ItemTitle>
                  <ItemDescription>{t('wifiOnlyDescription')}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch
                    accessibilityLabel={t('wifiOnly')}
                    value={settings.wifiOnly}
                    onValueChange={(wifiOnly) => updateDownloadSettings({ wifiOnly })}
                  />
                </ItemActions>
              </Item>
            </ItemGroup>

            {data.onlineOnlyCount > 0 || data.lockedCount > 0 ? (
              <Banner tone="neutral">
                <BannerIcon icon={InfoIcon} />
                <BannerContent>
                  <BannerDescription>
                    {[
                      data.onlineOnlyCount > 0 ? t('onlineOnlyNote') : null,
                      data.lockedCount > 0 ? t('lockedNotIncluded', { count: data.lockedCount }) : null
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </BannerDescription>
                </BannerContent>
              </Banner>
            ) : null}

            {tooBig ? (
              <Text variant="caption" tone="danger">
                {t('notEnoughSpace')}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Button size="lg" disabled={tooBig || starting || !orgId} onPress={start}>
                {starting ? (
                  <ButtonSpinner />
                ) : (
                  <ButtonText>
                    {waitsForWifi
                      ? t('downloadOnWifi')
                      : data.sizeBytes > 0
                        ? t('downloadSize', { size: formatBytes(data.sizeBytes, locale) })
                        : t('download')}
                  </ButtonText>
                )}
              </Button>
              <Button variant="ghost" onPress={close}>
                <ButtonText>{t('notNow')}</ButtonText>
              </Button>
            </View>
          </>
        )}
      </View>
    </>
  );
}

function DownloadFacts({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <Card style={styles.facts}>
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 ? <View style={[styles.separator, { backgroundColor: colors.border }]} /> : null}
          {row}
        </Fragment>
      ))}
    </Card>
  );
}

function DownloadFact({ label, value }: { label: string; value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.fact}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="captionStrong" style={styles.factValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: GUTTER, paddingBottom: SPACING.sm, gap: SPACING.md },
  loading: { gap: SPACING.sm },
  facts: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xxs },
  fact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, minHeight: 40 },
  separator: { height: StyleSheet.hairlineWidth * 2 },
  factValue: { fontVariant: ['tabular-nums'] },
  actions: { gap: SPACING.xxs }
});
