import * as z from 'zod';

import { ROLE } from '../../constants/roles';
import { MEMBER_PROFILE_EMAIL_NOTE, ZPublicApiMemberProfileFields, hasMemberProfileField } from './audience';
import { ZPublicApiPaginationQuery } from './pagination';

const ZPublicApiTeamRoleId = z
  .union([z.literal(ROLE.ADMIN), z.literal(ROLE.TUTOR)])
  .describe(
    "1 = admin, 2 = tutor. You cannot change your own role, and the organization must keep at least one admin. A pending member's invite is updated to match."
  );

export const ZPublicApiTeamQuery = ZPublicApiPaginationQuery;
export type TPublicApiTeamQuery = z.infer<typeof ZPublicApiTeamQuery>;

export const ZPublicApiTeamMemberParam = z.object({
  memberId: z.coerce.number().int().positive()
});
export type TPublicApiTeamMemberParam = z.infer<typeof ZPublicApiTeamMemberParam>;

export const ZPublicApiUpdateTeamMember = z
  .object({
    roleId: ZPublicApiTeamRoleId.optional(),
    ...ZPublicApiMemberProfileFields
  })
  .refine((data) => data.roleId !== undefined || hasMemberProfileField(data), { message: 'No fields to update' })
  .describe(`Send only the fields to change. ${MEMBER_PROFILE_EMAIL_NOTE}`);
export type TPublicApiUpdateTeamMember = z.infer<typeof ZPublicApiUpdateTeamMember>;
