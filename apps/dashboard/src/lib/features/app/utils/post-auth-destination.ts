import { isManagerMembership } from '$features/org/utils/org-memberships';

export const ORG_CHOOSER_PATH = '/organizations';

type OrgChooserContext = {
  isCloud: boolean;
  isOrgSite: boolean;
  organizations: Array<{ roleId?: number | null }>;
};

/**
 * True when a signed-in user on the cloud admin host belongs only to academies as a learner,
 * so they should pick an academy or create their own org instead of being sent to an LMS.
 */
export function shouldShowOrgChooser({ isCloud, isOrgSite, organizations }: OrgChooserContext): boolean {
  if (!isCloud || isOrgSite || organizations.length === 0) {
    return false;
  }

  return !organizations.some(isManagerMembership);
}

export function isOrgChooserAvailable({ isCloud, isOrgSite }: Omit<OrgChooserContext, 'organizations'>): boolean {
  return isCloud && !isOrgSite;
}
