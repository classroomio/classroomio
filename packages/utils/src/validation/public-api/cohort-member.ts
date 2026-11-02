import * as z from 'zod';

import { ROLE } from '@cio/utils/constants';
import {
  CohortPeopleActivityWindow,
  CohortPeopleMembership,
  CohortPeopleSortBy,
  CohortPeopleSortOrder
} from '../cohort/people';
import { ZPublicApiCohortParam } from './cohort';
import { ZPublicApiPaginationQuery } from './pagination';

const ZPublicApiCohortMemberRole = z
  .union([z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)])
  .describe('2 = tutor, 3 = student');

export const ZPublicApiCohortMemberParam = ZPublicApiCohortParam.extend({
  memberId: z.string().uuid()
});
export type TPublicApiCohortMemberParam = z.infer<typeof ZPublicApiCohortMemberParam>;

export const ZPublicApiCohortMembersQuery = ZPublicApiPaginationQuery.extend({
  search: z.string().trim().max(200).optional().describe('Matches name or email.'),
  roleId: z.coerce.number().int().min(ROLE.TUTOR).max(ROLE.STUDENT).optional().describe('2 = tutor, 3 = student'),
  sortBy: CohortPeopleSortBy.default('joined').describe('joined = when they were added. Default: joined.'),
  sortOrder: CohortPeopleSortOrder.default('asc').describe('Default: asc.'),
  membership: CohortPeopleMembership.optional().describe('invited = the invite has not been accepted yet.'),
  lastLoginBefore: CohortPeopleActivityWindow.optional().describe(
    'Not logged in for N days or more (including never); never = no login recorded.'
  )
});
export type TPublicApiCohortMembersQuery = z.infer<typeof ZPublicApiCohortMembersQuery>;

export const ZPublicApiAddCohortMembers = z.object({
  members: z
    .array(
      z.object({
        profileId: z.string().uuid().optional().describe('Must belong to someone already in your organization.'),
        email: z
          .string()
          .email()
          .optional()
          .describe(
            'Linked to its existing profile if there is one; otherwise the membership is stored against the email alone.'
          ),
        name: z.string().optional(),
        roleId: ZPublicApiCohortMemberRole
      })
    )
    .min(1)
    .refine((members) => members.every((member) => member.profileId || member.email), {
      message: 'Each member must include a profileId or email'
    })
    .refine(
      (members) => {
        const keys = members.map((member) => member.profileId ?? member.email?.toLowerCase().trim());
        return new Set(keys).size === keys.length;
      },
      { message: 'Each profileId or email may appear only once per request' }
    )
    .describe(
      "People to add, each with a profileId or an email that appears only once per request. No invitation email or organization invite is sent; use POST /cohorts/{cohortId}/invite for the dashboard's invite flow. When the cohort has courses, students with a profile are also added to your organization and to those courses."
    )
});
export type TPublicApiAddCohortMembers = z.infer<typeof ZPublicApiAddCohortMembers>;

export const ZPublicApiUpdateCohortMember = z.object({
  roleId: ZPublicApiCohortMemberRole
});
export type TPublicApiUpdateCohortMember = z.infer<typeof ZPublicApiUpdateCohortMember>;
