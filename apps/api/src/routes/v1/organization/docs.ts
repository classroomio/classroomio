import { ORG_ADMIN_FORBIDDEN } from '../team/docs';

export { ORG_ADMIN_RULE } from '../team/docs';

export const ORGANIZATION_TAG = 'Organization';
export const EMAIL_TEMPLATES_TAG = 'Organization Email Templates';
export const LANDING_PAGE_TAG = 'Organization Landing Page';
export const DOMAIN_TAG = 'Organization Domain';
export const CUSTOMIZATION_TAG = 'Organization Customization';

/** Templates change whenever an admin edits them, so no cache (private ones included) may store them. */
export const EMAIL_TEMPLATES_CACHE_CONTROL = 'private, no-store';

/** Admins can rename or rebrand the organization at any time, so no cache may store it. */
export const ORGANIZATION_CACHE_CONTROL = 'private, no-store';

export const organizationForbiddenResponse = (
  scope: 'organization:read' | 'organization:write' | 'organization:domain:write'
) => ({
  description: `Missing the ${scope} scope, or ${ORG_ADMIN_FORBIDDEN}`
});

export const organizationPlanForbiddenResponse = {
  description: `${organizationForbiddenResponse('organization:write').description}, or the plan doesn't include it (UPGRADE_REQUIRED)`
};
