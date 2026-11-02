import type { ApiClient } from '@/feature/common/api/api-client';
import { ApiError } from '@/feature/common/api/request';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';
import type { Certificate, CertificateFormat } from '@/feature/certificate/types/certificate';

type CertificateFileRequest = {
  certificate: Certificate;
  recipientName: string;
  profileId: string;
  format: CertificateFormat;
};

async function errorFrom(response: { status: number; json(): Promise<unknown> }) {
  const body = (await response.json().catch(() => null)) as { error?: unknown; code?: unknown } | null;
  const message =
    typeof body?.error === 'string'
      ? body.error
      : createTranslator(commonCatalog, getCurrentLocale())('requestFailed', { status: response.status });

  return new ApiError(message, response.status, typeof body?.code === 'string' ? body.code : undefined);
}

/** Renders the certificate through the same endpoint the dashboard downloads from, and returns the file bytes. */
export async function fetchCertificateFile(
  api: ApiClient,
  { certificate, recipientName, profileId, format }: CertificateFileRequest
) {
  const args = {
    param: { courseId: certificate.courseId },
    json: { studentName: recipientName, studentId: profileId, issuedAt: certificate.issuedAt }
  };
  const endpoint = api.course[':courseId'].download.certificate;
  const response = format === 'png' ? await endpoint.png.$post(args) : await endpoint.$post(args);

  if (!response.ok) throw await errorFrom(response);

  return response.arrayBuffer();
}
