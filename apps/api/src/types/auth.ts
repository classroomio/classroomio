import { auth } from '@cio/db/auth';
import type { TOrganizationApiKey } from '@db/types';
import type { ActivityLaunchClaims } from '@cio/activity-packages';

export type AuthSession = {
  Variables: {
    actorId: string | null;
    automationKey: TOrganizationApiKey | null;
    orgId: string | null;
    orgRoles: Record<string, number>;
    /** Asset an encoder job token authorizes, set by `encoderJobMiddleware`. */
    encoderAssetId: string | undefined;
    /** Launch a SCORM run-time token authorizes, set by `verifyRuntimeLaunchToken`. */
    runtimeClaims: ActivityLaunchClaims | undefined;
    session: typeof auth.$Infer.Session.session | null;
    user: typeof auth.$Infer.Session.user | null;
    userRole: number | null;
  };
};
