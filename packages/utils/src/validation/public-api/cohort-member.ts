import * as z from 'zod';

import { ZAddCohortMembers, ZUpdateCohortMember } from '../cohort/cohort';
import { ZPublicApiCohortParam } from './cohort';

export const ZPublicApiCohortMemberParam = ZPublicApiCohortParam.extend({
  memberId: z.string().uuid()
});
export type TPublicApiCohortMemberParam = z.infer<typeof ZPublicApiCohortMemberParam>;

export const ZPublicApiAddCohortMembers = ZAddCohortMembers;
export type TPublicApiAddCohortMembers = z.infer<typeof ZPublicApiAddCohortMembers>;

export const ZPublicApiUpdateCohortMember = ZUpdateCohortMember;
export type TPublicApiUpdateCohortMember = z.infer<typeof ZPublicApiUpdateCohortMember>;
