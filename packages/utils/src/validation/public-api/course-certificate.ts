import * as z from 'zod';

import { ZCertificationSettings } from '../course/course';
import { ZCourseMembersQuery } from '../course/people';

const CERTIFICATE_FIELDS = Object.keys(ZCertificationSettings.shape) as Array<
  keyof typeof ZCertificationSettings.shape
>;

export const ZPublicApiUpdateCourseCertificate = ZCertificationSettings.refine(
  (data) => CERTIFICATE_FIELDS.some((field) => data[field] !== undefined),
  { message: 'Provide at least one certificate field to update' }
);
export type TPublicApiUpdateCourseCertificate = z.infer<typeof ZPublicApiUpdateCourseCertificate>;

export const ZPublicApiListCourseCertificatesQuery = ZCourseMembersQuery.pick({
  page: true,
  limit: true,
  search: true
});
export type TPublicApiListCourseCertificatesQuery = z.infer<typeof ZPublicApiListCourseCertificatesQuery>;
