import { auth } from '@cio/db/auth';
import type { TOrganizationApiKey } from '@db/types';

export type AuthSession = {
  Variables: {
    actorId: string | null;
    automationKey: TOrganizationApiKey | null;
    orgId: string | null;
    session: typeof auth.$Infer.Session.session | null;
    user: typeof auth.$Infer.Session.user | null;
    userRole: number | null;
  };
};
