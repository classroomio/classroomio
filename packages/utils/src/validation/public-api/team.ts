import * as z from 'zod';

import { ROLE } from '../../constants/roles';
import { MEMBER_NAME_DESCRIPTION, ZPublicApiMemberName } from './audience';
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
    name: ZPublicApiMemberName.optional().describe(MEMBER_NAME_DESCRIPTION)
  })
  .refine((data) => data.roleId !== undefined || data.name !== undefined, { message: 'No fields to update' })
  .describe(
    'Send only the fields to change. Email, password, username and avatar belong to the person and cannot be changed here.'
  );
export type TPublicApiUpdateTeamMember = z.infer<typeof ZPublicApiUpdateTeamMember>;
