import { Directory, File, Paths } from 'expo-file-system';

import type { Certificate, CertificateFormat, SavedCertificate } from '@/feature/certificate/types/certificate';

const ROOT = 'certificates';
const METADATA_FILE = 'certificate.json';

type Owner = { userId: string; orgId: string };

function ownerDirectory({ userId, orgId }: Owner) {
  return new Directory(Paths.document, ROOT, userId, orgId);
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'course'
  );
}

/** File name a certificate is shared and saved under, such as `hipaa-awareness-certificate.pdf`. */
export function certificateFileName(certificate: Pick<Certificate, 'courseTitle'>, format: CertificateFormat) {
  return `${slugify(certificate.courseTitle)}-certificate.${format}`;
}

export function certificateFiles(owner: Owner, certificate: Pick<Certificate, 'courseId' | 'courseTitle'>) {
  const directory = new Directory(ownerDirectory(owner), certificate.courseId);

  return {
    directory,
    pdf: new File(directory, certificateFileName(certificate, 'pdf')),
    png: new File(directory, certificateFileName(certificate, 'png')),
    metadata: new File(directory, METADATA_FILE)
  };
}

function readSaved(metadata: File): SavedCertificate | null {
  try {
    if (!metadata.exists) return null;

    return JSON.parse(metadata.textSync()) as SavedCertificate;
  } catch {
    return null;
  }
}

/** The saved copy of a certificate, when both files for the same issue are on disk. */
export function readSavedCertificate(owner: Owner, certificate: Pick<Certificate, 'courseId' | 'courseTitle'>) {
  const files = certificateFiles(owner, certificate);
  const saved = readSaved(files.metadata);
  if (!saved || !files.pdf.exists || !files.png.exists) return null;

  return saved;
}

export function listSavedCertificates(owner: Owner): SavedCertificate[] {
  const root = ownerDirectory(owner);
  if (!root.exists) return [];

  return root
    .list()
    .flatMap((entry) => (entry instanceof Directory ? [readSaved(new File(entry, METADATA_FILE))] : []))
    .filter((saved): saved is SavedCertificate => saved !== null)
    .filter((saved) => readSavedCertificate(owner, saved.certificate) !== null);
}

export async function writeSavedCertificate(
  owner: Owner,
  saved: SavedCertificate,
  contents: { pdf: ArrayBuffer; png: ArrayBuffer }
) {
  const files = certificateFiles(owner, saved.certificate);
  files.directory.create({ intermediates: true, idempotent: true });

  await Promise.all([files.pdf.write(new Uint8Array(contents.pdf)), files.png.write(new Uint8Array(contents.png))]);
  await files.metadata.write(JSON.stringify(saved));

  return files;
}
