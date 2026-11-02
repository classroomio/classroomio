import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { CopyIcon } from 'phosphor-react-native/src/icons/Copy';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { ExportIcon } from 'phosphor-react-native/src/icons/Export';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAccountQuery } from '@/feature/account/api/account';
import { IconTile } from '@/feature/common/components/icon-tile';
import { CertificateAction, CertificateActions } from '@/feature/certificate/components/certificate-actions';
import {
  CertificateCard,
  CertificateCardBody,
  CertificateCardHeader
} from '@/feature/certificate/components/certificate-card';
import { CertificateFact, CertificateFacts } from '@/feature/certificate/components/certificate-facts';
import { CertificateFilePreview } from '@/feature/certificate/components/certificate-file-preview';
import { CertificateStatus } from '@/feature/certificate/components/certificate-status';
import { useCertificateActions } from '@/feature/certificate/helpers/certificate-actions';
import { useCertificateCopy } from '@/feature/certificate/helpers/certificate-copy';
import { useCertificateFilesQuery } from '@/feature/certificate/helpers/certificate-files';
import { useCertificate } from '@/feature/certificate/helpers/certificate-wallet';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';

export default function CertificateScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { query, certificate, savedCopy, isPending } = useCertificate(courseId);
  const files = useCertificateFilesQuery(certificate);
  const account = useAccountQuery();
  const { org } = useActiveOrg();
  const { colors } = useTheme();
  const pdfUri = files.data?.pdfUri;
  const { busy, share, save, copyId } = useCertificateActions(certificate, pdfUri);
  const { t, date } = useCertificateCopy();
  const tc = useTranslations(commonCatalog);
  const formatters = useFormatters();

  if (isPending) {
    return (
      <ScreenScrollView>
        <ScreenSection>
          <Skeleton height={240} radius={RADII.sheet} />
          <Skeleton height={28} width="70%" />
          <Skeleton height={220} radius={RADII.xl} />
        </ScreenSection>
      </ScreenScrollView>
    );
  }

  if (!certificate) {
    return (
      <ScreenScrollView>
        <Empty>
          <EmptyMedia icon={MedalIcon} />
          <EmptyTitle>{query.isError ? t('detailLoadError') : t('notFoundTitle')}</EmptyTitle>
          <EmptyDescription>{query.isError ? errorMessage(query.error) : t('notFoundDescription')}</EmptyDescription>
          {query.isError && (
            <EmptyContent>
              <Button variant="outline" onPress={() => query.refetch()}>
                <ButtonText>{tc('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </ScreenScrollView>
    );
  }

  const recipientName = savedCopy?.recipientName || account.data?.profile?.fullname || '';
  const issuerName = org?.name || savedCopy?.orgName || '';
  const renewable = certificate.status !== 'valid';
  const openCourse = () => router.push({ pathname: '/course/[courseId]', params: { courseId: certificate.courseId } });

  return (
    <ScreenScrollView>
      {certificate.canDownload ? (
        <ScreenSection>
          <CertificateFilePreview certificate={certificate} files={files} />
          <View style={styles.heading}>
            <Text variant="title" accessibilityRole="header">
              {certificate.courseTitle}
            </Text>
            <CertificateStatus certificate={certificate} />
          </View>
          <CertificateActions>
            <CertificateAction
              icon={ExportIcon}
              label={t('sharePdf')}
              busy={busy === 'share'}
              disabled={!pdfUri || (busy !== null && busy !== 'share')}
              onPress={share}
            />
            <CertificateAction
              icon={DownloadSimpleIcon}
              label={t('saveToDevice')}
              busy={busy === 'save'}
              disabled={!pdfUri || (busy !== null && busy !== 'save')}
              onPress={save}
            />
            <CertificateAction icon={CopyIcon} label={t('copyId')} onPress={copyId} />
          </CertificateActions>
        </ScreenSection>
      ) : (
        <ScreenSection>
          <CertificateCard certificate={certificate}>
            <CertificateCardHeader issuer={issuerName} />
            <CertificateCardBody />
          </CertificateCard>
          <View style={styles.note}>
            <Icon icon={InfoIcon} size={16} tone="muted" />
            <Text variant="caption" tone="muted" style={styles.noteText}>
              {t('downloadUnavailableDescription')}
            </Text>
          </View>
        </ScreenSection>
      )}

      <CertificateFacts>
        {recipientName ? <CertificateFact label={t('factIssuedTo')} value={recipientName} /> : null}
        {issuerName ? <CertificateFact label={t('factIssuedBy')} value={issuerName} /> : null}
        <CertificateFact label={t('factIssueDate')} value={date(certificate.issuedAt)} />
        {certificate.expiresAt ? (
          <CertificateFact
            label={certificate.status === 'expired' ? t('factExpired') : t('factValidUntil')}
            value={date(certificate.expiresAt)}
          />
        ) : null}
        <CertificateFact
          label={t('factCertificateId')}
          value={certificate.certificateId}
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('copyCertificateId')}
              hitSlop={HIT_SLOP}
              onPress={copyId}
            >
              <Icon icon={CopyIcon} size={17} tone="muted" />
            </Pressable>
          }
        />
        {certificate.cycleNumber ? (
          <CertificateFact label={t('factRenewalCycle')} value={formatters.number(certificate.cycleNumber)} />
        ) : null}
        {certificate.canDownload ? (
          <CertificateFact
            label={t('factSavedOnDevice')}
            value={files.data ? t('savedOnDeviceYes') : t('savedOnDeviceNo')}
          />
        ) : null}
      </CertificateFacts>

      <ItemGroup>
        <Item onPress={openCourse}>
          <ItemMedia>
            <IconTile
              icon={renewable ? ArrowCounterClockwiseIcon : BookOpenIcon}
              tone={renewable ? 'warning' : 'primary'}
            />
          </ItemMedia>
          <ItemContent>
            <ItemTitle numberOfLines={1}>{renewable ? t('retakeCourse') : t('openCourse')}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <ItemChevron />
          </ItemActions>
        </Item>
      </ItemGroup>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { gap: SPACING.xxs, marginTop: SPACING.xxs },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs, paddingHorizontal: SPACING.xxs },
  noteText: { flex: 1 }
});
