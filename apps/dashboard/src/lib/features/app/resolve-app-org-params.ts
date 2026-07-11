export type AppOrgParams = {
  isOrgSite: boolean;
  orgSiteName: string;
  /** Tenant org id from `getOrgSiteInfo`; used to auto-enroll on org sites. */
  orgId?: string | null;
};

type LayoutOrgData = {
  isOrgSite: boolean;
  orgSiteName: string;
  org: { id?: string } | null;
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
      orgId: layoutData.org?.id ?? null
    };
  }

  const adminOrgSlug = pathname.startsWith('/org/') && slugParam && slugParam !== '*' ? slugParam : '';

  return {
    isOrgSite: false,
    orgSiteName: adminOrgSlug,
    orgId: null
  };
}
