import { auth } from '@cio/db/auth';

export type AuthSession = {
  Variables: {
    orgId: string | null;
    session: typeof auth.$Infer.Session.session | null;
    user: typeof auth.$Infer.Session.user | null;
    userRole: number | null;
  };
};
