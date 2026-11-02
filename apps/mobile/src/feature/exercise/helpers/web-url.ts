import type { AccountOrganization } from '@/feature/account/types/account';
import { CLOUD_ROOT_DOMAIN, orgWebHostOf } from '@/feature/org/helpers/org-web-host';

export function exerciseWebUrlOf(org: AccountOrganization | null, courseId: string, exerciseId: string) {
  const host = (org && orgWebHostOf(org)) || `app.${CLOUD_ROOT_DOMAIN}`;

  return `https://${host}/courses/${courseId}/exercises/${exerciseId}`;
}
