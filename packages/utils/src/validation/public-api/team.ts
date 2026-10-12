import * as z from 'zod';

import { ROLE } from '../../constants/roles';
import { ZPublicApiMemberName } from './audience';
import { ZPublicApiPaginationQuery } from './pagination';

const ZPublicApiTeamRoleId = z.union([z.literal(ROLE.ADMIN), z.literal(ROLE.TUTOR)]).describe('1 = admin, 2 = tutor');

export const ZPublicApiTeamQuery = ZPublicApiPaginationQuery;
export type TPublicApiTeamQuery = z.infer<typeof ZPublicApiTeamQuery>;

export const ZPublicApiTeamMemberParam = z.object({
  memberId: z.coerce.number().int().positive()
});
export type TPublicApiTeamMemberParam = z.infer<typeof ZPublicApiTeamMemberParam>;

export const ZPublicApiUpdateTeamMember = z
  .object({
    roleId: ZPublicApiTeamRoleId.optional(),
    name: ZPublicApiMemberName.optional().describe('Joined members only: sets the full name on their profile')
  })
  .refine((data) => data.roleId !== undefined || data.name !== undefined, { message: 'No fields to update' });
export type TPublicApiUpdateTeamMember = z.infer<typeof ZPublicApiUpdateTeamMember>;
