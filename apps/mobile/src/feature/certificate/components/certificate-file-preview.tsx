import { Award, CloudOff } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import type { useCertificateFilesQuery } from '@/feature/certificate/helpers/certificate-files';
import { certificateCatalog } from '@/feature/certificate/translations/catalog';
import type { Certificate } from '@/feature/certificate/types/certificate';
import { Button, ButtonText } from '@/feature/common/components/button';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import {
  CertificatePreview,
  CertificatePreviewImage,
  CertificatePreviewLoading,
  CertificatePreviewMessage
} from './certificate-preview';

type CertificateFilePreviewProps = {
  certificate: Certificate;
  files: ReturnType<typeof useCertificateFilesQuery>;
};

/** The rendered certificate once downloaded, with loading, unavailable and failed states. */
export function CertificateFilePreview({ certificate, files }: CertificateFilePreviewProps) {
  const t = useTranslations(certificateCatalog);
  const tc = useTranslations(commonCatalog);

  if (files.data) {
    return (
      <CertificatePreview>
        <CertificatePreviewImage
          uri={files.data.pngUri}
          label={t('previewLabel', { course: certificate.courseTitle })}
        />
      </CertificatePreview>
    );
  }

  if (!certificate.canDownload) {
    return (
      <CertificatePreview>
        <CertificatePreviewMessage
          icon={Award}
          title={t('downloadUnavailableTitle')}
          description={t('downloadUnavailableDescription')}
        />
      </CertificatePreview>
    );
  }

  if (files.isError) {
    return (
      <CertificatePreview>
        <CertificatePreviewMessage
          icon={CloudOff}
          title={t('downloadFailedTitle')}
          description={errorMessage(files.error)}
        >
          <Button size="sm" variant="outline" onPress={() => files.refetch()} style={styles.retry}>
            <ButtonText>{tc('retry')}</ButtonText>
          </Button>
        </CertificatePreviewMessage>
      </CertificatePreview>
    );
  }

  return (
    <CertificatePreview>
      <CertificatePreviewLoading />
    </CertificatePreview>
  );
}

const styles = StyleSheet.create({
  retry: { marginTop: SPACING.xs }
});
