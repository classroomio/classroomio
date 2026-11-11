import type { Bundle, ZObject } from 'zapier-platform-core';

import { WEBHOOK_EXAMPLE_ID_PREFIX } from '@cio/utils/validation/webhook';

import { apiUrl } from './lib/config';
import { readString, type EventRecord } from './lib/records';

type CertificateFileInput = { courseId: string; memberId: string };

export const hydrators = {
  certificateFile: async (z: ZObject, bundle: Bundle<Record<string, any>>) => {
    const input = bundle.inputData as CertificateFileInput;
    const download = z.request({
      url: apiUrl(`/courses/${input.courseId}/certificates/${input.memberId}/download`),
      params: { format: 'pdf' },
      raw: true
    });

    return z.stashFile(download);
  }
};

export function attachCertificateFile(z: ZObject, record: EventRecord): EventRecord {
  const courseId = readString(record.courseId);
  const memberId = readString(record.memberId);

  if (!courseId || !memberId || record.id.startsWith(WEBHOOK_EXAMPLE_ID_PREFIX)) return record;

  return { ...record, certificate_file: z.dehydrateFile(hydrators.certificateFile, { courseId, memberId }) };
}
