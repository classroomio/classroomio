import * as Clipboard from 'expo-clipboard';
import { Directory, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform } from 'react-native';

import { certificateFileName } from '@/feature/certificate/helpers/certificate-storage';
import { certificateCatalog } from '@/feature/certificate/translations/catalog';
import type { Certificate } from '@/feature/certificate/types/certificate';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';

const PDF_MIME_TYPE = 'application/pdf';

function isPickerCancelled(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.includes('CANCELLED')
  );
}

async function shareCertificatePdf(pdfUri: string, dialogTitle: string) {
  await Sharing.shareAsync(pdfUri, { mimeType: PDF_MIME_TYPE, UTI: 'com.adobe.pdf', dialogTitle });
}

/** Asks for a folder and writes the certificate PDF into it. Rejects with a cancellation code if the picker is dismissed. */
async function saveCertificatePdf(pdfUri: string, certificate: Pick<Certificate, 'courseTitle'>) {
  const directory = await Directory.pickDirectoryAsync();
  const name = certificateFileName(certificate, 'pdf');
  // Android folders are Storage Access Framework URIs, where files can only be made through createFile.
  const target = Platform.OS === 'android' ? directory.createFile(name, PDF_MIME_TYPE) : new File(directory, name);
  const bytes = await new File(pdfUri).bytes();

  await target.write(bytes);
}

/** Share, save and copy actions for a downloaded certificate, with the action in flight. */
export function useCertificateActions(
  certificate: Pick<Certificate, 'courseTitle' | 'certificateId'> | undefined,
  pdfUri: string | undefined
) {
  const t = useTranslations(certificateCatalog);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);

  const share = async () => {
    if (!pdfUri) return;

    setBusy('share');
    try {
      await shareCertificatePdf(pdfUri, t('shareDialogTitle'));
    } catch (error) {
      showToast({ tone: 'danger', title: t('shareFailed'), description: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!pdfUri || !certificate) return;

    setBusy('save');
    try {
      await saveCertificatePdf(pdfUri, certificate);
      showToast({ tone: 'success', title: t('saved'), description: t('savedDescription') });
    } catch (error) {
      if (!isPickerCancelled(error)) {
        showToast({ tone: 'danger', title: t('saveFailed'), description: errorMessage(error) });
      }
    } finally {
      setBusy(null);
    }
  };

  const copyId = async () => {
    if (!certificate) return;

    selectionHaptic();
    await Clipboard.setStringAsync(certificate.certificateId);
    showToast({ tone: 'success', title: t('idCopied') });
  };

  return { busy, share, save, copyId };
}
