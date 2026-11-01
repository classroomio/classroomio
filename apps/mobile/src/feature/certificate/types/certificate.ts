import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type CertificatesResponse = Extract<
  InferResponseType<ApiClient['account']['certificates']['$get'], 200>,
  { success: true }
>;

export type CertificateList = CertificatesResponse['data'];

export type Certificate = CertificateList['earned'][number];

export type PendingCertificate = CertificateList['pending'][number];

export type CertificateStatus = Certificate['status'];

export type CertificateFormat = 'pdf' | 'png';

/** What the app keeps on disk so a downloaded certificate opens without a connection. */
export type SavedCertificate = {
  certificate: Certificate;
  recipientName: string;
  orgName: string;
  savedAt: string;
};
