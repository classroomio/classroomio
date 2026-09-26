import { auth } from '@cio/db/auth';
import type { TOrganizationApiKey } from '@db/types';

export type AuthSession = {
  Variables: {
    actorId: string | null;
    automationKey: TOrganizationApiKey | null;
    orgId: string | null;
    orgRoles: Record<string, number>;
    /** Organizations whose storage keys the caller may presign. */
    presignOrgIds: string[];
    /** Organization new upload keys are prefixed with, when one can be resolved. */
    presignUploadOrgId: string | undefined;
    session: typeof auth.$Infer.Session.session | null;
    user: typeof auth.$Infer.Session.user | null;
    userRole: number | null;
  };
};
