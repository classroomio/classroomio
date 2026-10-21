import type { TLocale } from '@cio/db/types';

export type AppOrgParams = {
  isOrgSite: boolean;
  orgSiteName: string;
  /** Tenant identity used for pending invite checks and explicit academy joining. */
  orgId?: string | null;
  orgLocale?: TLocale;
  orgLocaleEnforced?: boolean;
};

type LayoutOrgData = {
  isOrgSite: boolean;
  orgSiteName: string;
  org: { id?: string; settings?: { language?: { locale?: TLocale; enforced?: boolean } } } | null;
};

/**
 * Resolve which organization the dashboard should treat as "current" for API calls.
 *
 * - Org sites: subdomain/custom domain from `getOrgSiteInfo`.
 * - App host: `/org/[slug]` when the user is in the admin dashboard.
 */
export function resolveAppOrgParams(layoutData: LayoutOrgData, pathname: string, slugParam?: string): AppOrgParams {
  if (layoutData.isOrgSite) {
    return {
      isOrgSite: true,
      orgSiteName: layoutData.orgSiteName,
      orgId: layoutData.org?.id ?? null,
      orgLocale: layoutData.org?.settings?.language?.locale,
      orgLocaleEnforced: layoutData.org?.settings?.language?.enforced
    };
  }

  const adminOrgSlug = pathname.startsWith('/org/') && slugParam && slugParam !== '*' ? slugParam : '';

  return {
    isOrgSite: false,
    orgSiteName: adminOrgSlug,
    orgId: null
  };
}
