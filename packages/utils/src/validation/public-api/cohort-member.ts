import * as z from 'zod';

import { ROLE } from '@cio/utils/constants';
import { ZPublicApiCohortParam } from './cohort';

const ZPublicApiCohortMemberRole = z.union([z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)]);

export const ZPublicApiCohortMemberParam = ZPublicApiCohortParam.extend({
  memberId: z.string().uuid()
});
export type TPublicApiCohortMemberParam = z.infer<typeof ZPublicApiCohortMemberParam>;

export const ZPublicApiAddCohortMembers = z.object({
  members: z
    .array(
      z.object({
        profileId: z.string().uuid().optional(),
        email: z.string().email().optional(),
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
});
export type TPublicApiAddCohortMembers = z.infer<typeof ZPublicApiAddCohortMembers>;

export const ZPublicApiUpdateCohortMember = z.object({
  roleId: ZPublicApiCohortMemberRole
});
export type TPublicApiUpdateCohortMember = z.infer<typeof ZPublicApiUpdateCohortMember>;
