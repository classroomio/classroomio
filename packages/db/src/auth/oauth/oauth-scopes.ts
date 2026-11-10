import { OFFLINE_ACCESS_SCOPE } from '@cio/utils/constants/oauth-scopes';
import { ZOrganizationApiKeyScope } from '@cio/utils/validation/organization';

export { OFFLINE_ACCESS_SCOPE };

export const OAUTH_API_SCOPES = ZOrganizationApiKeyScope.options.filter((scope) => scope !== 'public_api:*');

export const OAUTH_SCOPES = [...OAUTH_API_SCOPES, OFFLINE_ACCESS_SCOPE];
