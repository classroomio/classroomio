import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  CertificateCard,
  CertificateCardBody,
  CertificateCardHeader
} from '@/feature/certificate/components/certificate-card';
import { PendingCertificateRow } from '@/feature/certificate/components/pending-certificate-row';
import { certificatesSummaryText, useCertificateCopy } from '@/feature/certificate/helpers/certificate-copy';
import { useCertificateWallet } from '@/feature/certificate/helpers/certificate-wallet';
import type { Certificate, PendingCertificate } from '@/feature/certificate/types/certificate';
import { Button, ButtonText } from '@/feature/common/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle
} from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';

function openCertificate(certificate: Certificate) {
  router.push({ pathname: '/certificates/[courseId]', params: { courseId: certificate.courseId } });
}

function openCourse(pending: PendingCertificate) {
  router.push({ pathname: '/course/[courseId]', params: { courseId: pending.courseId } });
}

export default function CertificatesScreen() {
  const { query: certificates, earned, pending, offline, savedCourseIds, refresh } = useCertificateWallet();
  const copy = useCertificateCopy();
  const tc = useTranslations(commonCatalog);
  const { org } = useActiveOrg();
  const { t } = copy;

  return (
    <ScreenScrollView onRefresh={refresh}>
      {certificates.isPending && (
        <>
          <Skeleton height={216} radius={RADII.sheet} />
          <SkeletonList count={2} media="thumbnail" />
        </>
      )}

      {certificates.isError && earned.length === 0 && (
        <Empty>
          <EmptyMedia icon={MedalIcon} />
          <EmptyTitle>{t('listLoadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(certificates.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={refresh}>
              <ButtonText>{tc('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {certificates.isSuccess && earned.length === 0 && (
        <Empty>
          <EmptyIllustration name="certificate" />
          <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
          <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
        </Empty>
      )}

      {earned.length > 0 && (
        <ScreenSection>
          <Text variant="caption" tone="muted">
            {offline ? t('offlineNotice') : certificatesSummaryText(earned, copy)}
          </Text>
          <View style={styles.wallet}>
            {earned.map((certificate) => (
              <CertificateCard key={certificate.courseId} certificate={certificate} onPress={openCertificate}>
                <CertificateCardHeader issuer={org?.name} saved={savedCourseIds.has(certificate.courseId)} />
                <CertificateCardBody />
              </CertificateCard>
            ))}
          </View>
        </ScreenSection>
      )}

      {pending.length > 0 && (
        <ScreenSection>
          <ScreenSectionHeader title={t('sectionStillToEarn')} />
          <ItemGroup>
            {pending.map((item) => (
              <PendingCertificateRow key={item.courseId} pending={item} onPress={openCourse} />
            ))}
          </ItemGroup>
        </ScreenSection>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  wallet: { gap: SPACING.md }
});
