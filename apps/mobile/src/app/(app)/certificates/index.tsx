import { router } from 'expo-router';
import { Award } from 'lucide-react-native';

import { CertificateRow } from '@/feature/certificate/components/certificate-row';
import { PendingCertificateRow } from '@/feature/certificate/components/pending-certificate-row';
import { certificatesSummaryText, useCertificateCopy } from '@/feature/certificate/helpers/certificate-copy';
import { useCertificateWallet } from '@/feature/certificate/helpers/certificate-wallet';
import type { Certificate, PendingCertificate } from '@/feature/certificate/types/certificate';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { RADII } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

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
  const { t } = copy;

  return (
    <ScreenScrollView refreshing={certificates.isRefetching} onRefresh={refresh}>
      {certificates.isPending && <Skeleton height={232} radius={RADII.xl} />}

      {certificates.isError && !offline && (
        <Empty>
          <EmptyMedia icon={Award} />
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
          <EmptyMedia icon={Award} />
          <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
          <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
        </Empty>
      )}

      {earned.length > 0 && (
        <ScreenSection>
          <Text variant="caption" tone="muted">
            {offline ? t('offlineNotice') : certificatesSummaryText(earned, copy)}
          </Text>
          <ItemGroup>
            {earned.map((certificate) => (
              <CertificateRow
                key={certificate.courseId}
                certificate={certificate}
                saved={savedCourseIds.has(certificate.courseId)}
                onPress={openCertificate}
              />
            ))}
          </ItemGroup>
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
