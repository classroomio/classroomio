import type { AccountOrg, PublicOrg } from './types';

type OrganizationCustomization = AccountOrg['customization'] & {
  auth?: {
    backgroundImage?: string;
  };
};

/**
 * Keep the organization data serialized into public page loads intentionally small.
 * Account-only configuration, billing identifiers, and internal timestamps must not
 * cross the server-to-browser boundary for an organization site.
 */
export function toPublicOrg(org: AccountOrg): PublicOrg {
  const customization = org.customization as OrganizationCustomization;
  const signupSettings = org.settings?.signup;
  const authBackgroundImage = customization.auth?.backgroundImage;

  return {
    id: org.id,
    name: org.name,
    siteName: org.siteName,
    avatarUrl: org.avatarUrl,
    favicon: org.favicon,
    theme: org.theme,
    isRestricted: org.isRestricted,
    landingpage: org.landingpage,
    customDomain: org.customDomain,
    isCustomDomainVerified: org.isCustomDomainVerified,
    disableSignup: org.disableSignup,
    disableSignupMessage: org.disableSignupMessage,
    disableEmailPassword: org.disableEmailPassword,
    disableGoogleAuth: org.disableGoogleAuth,
    settings: signupSettings
      ? {
          signup: {
            inviteOnly: signupSettings.inviteOnly
          }
        }
      : {},
    customization: authBackgroundImage
      ? {
          auth: {
            backgroundImage: authBackgroundImage
          }
        }
      : {},
    plans: org.plans.map((plan) => ({
      planName: plan.planName,
      isActive: plan.isActive
    }))
  };
}
