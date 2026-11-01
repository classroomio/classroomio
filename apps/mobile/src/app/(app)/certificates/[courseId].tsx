import { CopyIcon } from 'phosphor-react-native/src/icons/Copy';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { ExportIcon } from 'phosphor-react-native/src/icons/Export';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAccountQuery } from '@/feature/account/api/account';
import { CertificateFact, CertificateFacts } from '@/feature/certificate/components/certificate-facts';
import { CertificateFilePreview } from '@/feature/certificate/components/certificate-file-preview';
import { CertificateStatus } from '@/feature/certificate/components/certificate-status';
import { useCertificateActions } from '@/feature/certificate/helpers/certificate-actions';
import { useCertificateFilesQuery } from '@/feature/certificate/helpers/certificate-files';
import { useCertificateCopy } from '@/feature/certificate/helpers/certificate-copy';
import { useCertificate } from '@/feature/certificate/helpers/certificate-wallet';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Icon } from '@/feature/common/components/icon';
import { ScreenScrollView, ScreenSection } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
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
  const pdfUri = files.data?.pdfUri;
  const { busy, share, save, copyId } = useCertificateActions(certificate, pdfUri);
  const { t, date } = useCertificateCopy();
  const tc = useTranslations(commonCatalog);
  const formatters = useFormatters();

  if (isPending) {
    return (
      <ScreenScrollView>
        <ScreenSection>
          <Skeleton height={240} radius={RADII.lg} />
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

  return (
    <ScreenScrollView>
      <ScreenSection>
        <CertificateFilePreview certificate={certificate} files={files} />

        <View style={styles.heading}>
          <Text variant="title" accessibilityRole="header">
            {certificate.courseTitle}
          </Text>
          <CertificateStatus certificate={certificate} />
        </View>

        {certificate.canDownload && (
          <View style={styles.actions}>
            <Button disabled={!pdfUri || busy !== null} onPress={share} style={styles.action}>
              {busy === 'share' ? <ButtonSpinner /> : <ButtonIcon icon={ExportIcon} />}
              <ButtonText>{t('sharePdf')}</ButtonText>
            </Button>
            <Button variant="outline" disabled={!pdfUri || busy !== null} onPress={save} style={styles.action}>
              {busy === 'save' ? <ButtonSpinner /> : <ButtonIcon icon={DownloadSimpleIcon} />}
              <ButtonText>{t('saveToDevice')}</ButtonText>
            </Button>
          </View>
        )}

        {renewable && (
          <Button
            variant="secondary"
            onPress={() => router.push({ pathname: '/course/[courseId]', params: { courseId: certificate.courseId } })}
          >
            <ButtonText>{t('retakeCourse')}</ButtonText>
          </Button>
        )}
      </ScreenSection>

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
        <CertificateFact
          label={t('factSavedOnDevice')}
          value={files.data ? t('savedOnDeviceYes') : t('savedOnDeviceNo')}
        />
      </CertificateFacts>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { gap: SPACING.xxs, marginTop: SPACING.xxs },
  actions: { flexDirection: 'row', gap: SPACING.xs },
  action: { flex: 1 }
});
