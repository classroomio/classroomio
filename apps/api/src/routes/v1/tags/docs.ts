import {
  ZPublicApiTagGroupResponse,
  ZPublicApiTagGroupWithTagsResponse,
  ZPublicApiTagResponse
} from '@cio/utils/validation/public-api';
import { itemResponse, paginatedResponse } from '@api/utils/openapi/responses';

export const TAG_READ_RULE =
  'Needs public_api:* or course:read, and the key creator must be a member of the organization.';
export const TAG_WRITE_RULE =
  'Needs public_api:* or course:tag:write, and the key creator must be an org admin, as in the dashboard.';

export const tagForbiddenResponses = {
  read: { description: 'The key has neither public_api:* nor course:read, or the key creator is not an org member' },
  write: {
    description: 'The key has neither public_api:* nor course:tag:write, or the key creator is not an org admin'
  }
};

export const TagGroupsResponse = paginatedResponse(ZPublicApiTagGroupWithTagsResponse);
export const TagGroupResponse = itemResponse(ZPublicApiTagGroupResponse);
export const TagResponse = itemResponse(ZPublicApiTagResponse);
