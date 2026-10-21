import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type { TLocale } from '@cio/db/types';

export type AccountResponse = InferResponseType<typeof classroomio.account.$get> | null;

export type AccountSuccess = Extract<InferResponseType<typeof classroomio.account.$get>, { success: true }>;

export type AccountOrg = AccountSuccess['organizations'][number];

export type PublicOrg = Pick<
  AccountOrg,
  | 'id'
  | 'name'
  | 'siteName'
  | 'avatarUrl'
  | 'favicon'
  | 'theme'
  | 'isRestricted'
  | 'landingpage'
  | 'customDomain'
  | 'isCustomDomainVerified'
  | 'disableSignup'
  | 'disableSignupMessage'
  | 'disableEmailPassword'
  | 'disableGoogleAuth'
> & {
  settings: {
    signup?: {
      inviteOnly?: boolean;
    };
    language?: {
      locale?: TLocale;
      enforced?: boolean;
    };
  };
  customization: {
    auth?: {
      backgroundImage?: string;
    };
  };
  plans: Array<Pick<AccountOrg['plans'][number], 'planName' | 'isActive'>>;
};
