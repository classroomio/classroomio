import * as z from 'zod';

import { ROLE } from '../../constants/roles';
import { MEMBER_NAME_DESCRIPTION, ZPublicApiMemberName } from './audience';
import { ZPublicApiPaginationQuery } from './pagination';

const ZTeamRoleId = z.union([z.literal(ROLE.ADMIN), z.literal(ROLE.TUTOR)]);

const ZPublicApiTeamRoleId = ZTeamRoleId.describe(
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

export const ZPublicApiInviteTeamMembers = z.object({
  emails: z.array(z.email()).min(1).max(50).describe('Up to 50 addresses, all invited with the same role'),
  roleId: ZTeamRoleId.describe('1 = admin, 2 = tutor'),
  confirmedStudentEmails: z
    .array(z.email())
    .max(50)
    .default([])
    .describe(
      'Addresses that already belong to students and should be promoted to this role. If any student in emails is missing here, nothing is sent and the response lists them in studentEmails.'
    )
});
export type TPublicApiInviteTeamMembers = z.infer<typeof ZPublicApiInviteTeamMembers>;

const ZTeamInviteLinkRoleId = z.coerce
  .number()
  .pipe(ZTeamRoleId)
  .describe('1 = admin, 2 = tutor. Each role has its own link');

export const ZPublicApiTeamInviteLinkQuery = z.object({
  roleId: ZTeamInviteLinkRoleId
});
export type TPublicApiTeamInviteLinkQuery = z.infer<typeof ZPublicApiTeamInviteLinkQuery>;

export const ZPublicApiCreateTeamInviteLink = z.object({
  roleId: ZTeamRoleId.describe('1 = admin, 2 = tutor. Each role has its own link')
});
export type TPublicApiCreateTeamInviteLink = z.infer<typeof ZPublicApiCreateTeamInviteLink>;

export const ZPublicApiUpdateTeamInviteLink = z.object({
  roleId: ZTeamRoleId.describe('1 = admin, 2 = tutor. Each role has its own link'),
  enabled: z.boolean().describe('false turns the link off so it stops working; true turns the same link back on')
});
export type TPublicApiUpdateTeamInviteLink = z.infer<typeof ZPublicApiUpdateTeamInviteLink>;
