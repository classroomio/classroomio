import * as z from 'zod';

import { ZAddCourseMembers, ZCourseMembersQuery, ZUpdateCourseMember } from '../course/people';
import { ZCourseUserAnalyticsQuery } from '../course/course';
import { ZPublicApiCourseParam } from './course';

export const ZPublicApiCourseMemberParam = ZPublicApiCourseParam.extend({
  memberId: z.string().uuid()
});
export type TPublicApiCourseMemberParam = z.infer<typeof ZPublicApiCourseMemberParam>;

export const ZPublicApiCourseMembersQuery = ZCourseMembersQuery;
export type TPublicApiCourseMembersQuery = z.infer<typeof ZPublicApiCourseMembersQuery>;

export const ZPublicApiAddCourseMember = ZAddCourseMembers.element.refine(
  (data) => Boolean(data.profileId) || Boolean(data.email),
  {
    message: 'Either profileId or email must be provided',
    path: ['profileId']
  }
);
export type TPublicApiAddCourseMember = z.infer<typeof ZPublicApiAddCourseMember>;

export const ZPublicApiUpdateCourseMember = ZUpdateCourseMember;
export type TPublicApiUpdateCourseMember = z.infer<typeof ZPublicApiUpdateCourseMember>;

export const ZPublicApiCourseMemberAnalyticsQuery = ZCourseUserAnalyticsQuery;
export type TPublicApiCourseMemberAnalyticsQuery = z.infer<typeof ZPublicApiCourseMemberAnalyticsQuery>;
