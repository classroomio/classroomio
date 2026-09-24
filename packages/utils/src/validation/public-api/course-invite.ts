import * as z from 'zod';

import { ZCreateCourseInvite } from '../course/invite';
import { ZPublicApiCourseParam } from './course';

export const ZPublicApiCourseInviteParam = ZPublicApiCourseParam;
export type TPublicApiCourseInviteParam = z.infer<typeof ZPublicApiCourseInviteParam>;

export const ZPublicApiCourseInviteRevokeParam = ZPublicApiCourseParam.extend({
  inviteId: z.string().uuid()
});
export type TPublicApiCourseInviteRevokeParam = z.infer<typeof ZPublicApiCourseInviteRevokeParam>;

export const ZPublicApiCreateCourseInvite = ZCreateCourseInvite;
export type TPublicApiCreateCourseInvite = z.infer<typeof ZPublicApiCreateCourseInvite>;

export const ZPublicApiCourseInvitesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export type TPublicApiCourseInvitesQuery = z.infer<typeof ZPublicApiCourseInvitesQuery>;
