import { useCertificatesQuery } from '@/feature/certificate/api/certificates';
import { useSavedCertificatesQuery } from '@/feature/certificate/helpers/certificate-files';

/** Earned and pending certificates, falling back to the copies saved on this device when the list cannot load. */
export function useCertificateWallet() {
  const certificates = useCertificatesQuery();
  const saved = useSavedCertificatesQuery();
  const savedCertificates = saved.data ?? [];
  const offline = certificates.isError && savedCertificates.length > 0;
  const earned = certificates.data?.earned ?? (offline ? savedCertificates.map((item) => item.certificate) : []);

  return {
    query: certificates,
    earned,
    pending: certificates.data?.pending ?? [],
    offline,
    savedCourseIds: new Set(savedCertificates.map((item) => item.certificate.courseId)),
    refresh: () => Promise.all([certificates.refetch(), saved.refetch()])
  };
}

/** One earned certificate by course, from the API or, without a connection, from its saved copy. */
export function useCertificate(courseId: string | undefined) {
  const certificates = useCertificatesQuery();
  const saved = useSavedCertificatesQuery();
  const savedCopy = saved.data?.find((item) => item.certificate.courseId === courseId) ?? null;
  const certificate = certificates.data
    ? certificates.data.earned.find((item) => item.courseId === courseId)
    : savedCopy?.certificate;

  return {
    query: certificates,
    certificate,
    savedCopy,
    isPending: certificates.isPending && !savedCopy
  };
}
