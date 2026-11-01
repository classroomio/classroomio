import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAccountQuery } from '@/feature/account/api/account';
import { useAuth } from '@/feature/auth/components/auth-provider';
import { fetchCertificateFile } from '@/feature/certificate/api/certificate-file';
import {
  certificateFiles,
  listSavedCertificates,
  readSavedCertificate,
  writeSavedCertificate
} from '@/feature/certificate/helpers/certificate-storage';
import { certificateCatalog } from '@/feature/certificate/translations/catalog';
import type { Certificate } from '@/feature/certificate/types/certificate';
import { useApi } from '@/feature/common/components/api-provider';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';

export const savedCertificatesQueryKey = (userId: string | null, orgId: string | null) =>
  ['certificates', 'saved', userId, orgId] as const;

/** Certificates already downloaded to this device for the active organization. */
export function useSavedCertificatesQuery() {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    queryKey: savedCertificatesQueryKey(userId, orgId),
    queryFn: () => (userId && orgId ? listSavedCertificates({ userId, orgId }) : []),
    enabled: Boolean(userId && orgId),
    networkMode: 'always',
    staleTime: Infinity
  });
}

/** Local PDF and image of a certificate, downloaded on first use and read from disk after that. */
export function useCertificateFilesQuery(certificate: Certificate | undefined) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const { org } = useActiveOrg();
  const account = useAccountQuery();
  const t = useTranslations(certificateCatalog);
  const recipientName = account.data?.profile?.fullname || t('recipientFallback');

  return useQuery({
    queryKey: ['certificates', 'files', userId, orgId, certificate?.courseId, certificate?.issuedAt] as const,
    queryFn: async () => {
      if (!certificate || !userId || !orgId) throw new Error('Certificate is not available');

      const owner = { userId, orgId };
      const saved = readSavedCertificate(owner, certificate);
      if (saved?.certificate.issuedAt === certificate.issuedAt) {
        const files = certificateFiles(owner, certificate);

        return { pdfUri: files.pdf.uri, pngUri: files.png.uri };
      }

      const request = { certificate, recipientName, profileId: userId };
      const [pdf, png] = await Promise.all([
        fetchCertificateFile(api, { ...request, format: 'pdf' }),
        fetchCertificateFile(api, { ...request, format: 'png' })
      ]);
      const savedAt = new Date().toISOString();
      const files = await writeSavedCertificate(
        owner,
        { certificate, recipientName, orgName: org?.name ?? '', savedAt },
        { pdf, png }
      );
      void queryClient.invalidateQueries({ queryKey: savedCertificatesQueryKey(userId, orgId) });

      return { pdfUri: files.pdf.uri, pngUri: files.png.uri };
    },
    enabled: Boolean(certificate?.canDownload && userId && orgId && account.data),
    networkMode: 'offlineFirst',
    staleTime: Infinity,
    retry: 1
  });
}
