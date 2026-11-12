import {
  ZPublicApiTagGroupResponse,
  ZPublicApiTagGroupWithTagsResponse,
  ZPublicApiTagResponse
} from '@cio/utils/validation/public-api';
import { itemResponse, paginatedResponse } from '@api/utils/openapi/responses';

export const ORG_MEMBER_RULE = 'the key creator must be a member of the organization';

export const tagForbiddenResponses = {
  read: {
    description: 'Missing the course:read scope, or the key creator is not an org member'
  },
  write: {
    description: 'Missing the course:tag:write scope, or the key creator is not an org admin'
  }
};

export const TagGroupsResponse = paginatedResponse(ZPublicApiTagGroupWithTagsResponse);
export const TagGroupResponse = itemResponse(ZPublicApiTagGroupResponse);
export const TagResponse = itemResponse(ZPublicApiTagResponse);
