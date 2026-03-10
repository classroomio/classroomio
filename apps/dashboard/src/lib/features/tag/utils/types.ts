import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetTagGroupsRequest = (typeof classroomio.organization)['tags']['$get'];
export type GetTagGroupsResponse = InferResponseType<GetTagGroupsRequest>;
export type GetTagGroupsSuccess = Extract<GetTagGroupsResponse, { success: true }>;
export type OrganizationTagGroups = GetTagGroupsSuccess['data'];
export type OrganizationTagGroup = OrganizationTagGroups[number];
export type OrganizationTag = OrganizationTagGroup['tags'][number];

export type CreateTagGroupRequest = (typeof classroomio.organization)['tags']['groups']['$post'];
export type UpdateTagGroupRequest = (typeof classroomio.organization)['tags']['groups'][':groupId']['$put'];
export type CreateTagRequest = (typeof classroomio.organization)['tags']['$post'];
export type UpdateTagRequest = (typeof classroomio.organization)['tags'][':tagId']['$put'];

export type GetCourseTagsRequest = (typeof classroomio.course)[':courseId']['tags']['$get'];
export type UpdateCourseTagsRequest = (typeof classroomio.course)[':courseId']['tags']['$put'];
export type GetCourseTagsResponse = InferResponseType<GetCourseTagsRequest>;
export type GetCourseTagsSuccess = Extract<GetCourseTagsResponse, { success: true }>;
export type OrganizationCourseTags = GetCourseTagsSuccess['data'];
