import {
  ZPublicApiAddCohortMembers,
  ZPublicApiAddCourseToCohort,
  ZPublicApiCohortCourseParam,
  ZPublicApiCohortMemberParam,
  ZPublicApiCohortParam,
  ZPublicApiCreateCohort,
  ZPublicApiUpdateCohort,
  ZPublicApiUpdateCohortMember
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import * as z from 'zod';

export const ZListOrgCohortsToolInput = z.object({});

export const ZCreateCohortToolInput = ZPublicApiCreateCohort;

export const ZGetCohortToolInput = ZPublicApiCohortParam;

export const ZUpdateCohortToolInput = ZPublicApiUpdateCohort.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZDeleteCohortToolInput = ZPublicApiCohortParam;

export const ZListCohortMembersToolInput = ZPublicApiCohortParam;

export const ZAddCohortMembersToolInput = ZPublicApiAddCohortMembers.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZUpdateCohortMemberToolInput = ZPublicApiUpdateCohortMember.extend({
  cohortId: ZPublicApiCohortMemberParam.shape.cohortId,
  memberId: ZPublicApiCohortMemberParam.shape.memberId
});

export const ZDeleteCohortMemberToolInput = ZPublicApiCohortMemberParam;

export const ZListCohortCoursesToolInput = ZPublicApiCohortParam;

export const ZAddCohortCourseToolInput = ZPublicApiAddCourseToCohort.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZRemoveCohortCourseToolInput = ZPublicApiCohortCourseParam;

const listOrgCohortsShape = ZListOrgCohortsToolInput.shape as unknown as ZodRawShapeCompat;
const createCohortShape = ZCreateCohortToolInput.shape as unknown as ZodRawShapeCompat;
const getCohortShape = ZGetCohortToolInput.shape as unknown as ZodRawShapeCompat;
const updateCohortShape = ZUpdateCohortToolInput.shape as unknown as ZodRawShapeCompat;
const deleteCohortShape = ZDeleteCohortToolInput.shape as unknown as ZodRawShapeCompat;
const listCohortMembersShape = ZListCohortMembersToolInput.shape as unknown as ZodRawShapeCompat;
const addCohortMembersShape = ZAddCohortMembersToolInput.shape as unknown as ZodRawShapeCompat;
const updateCohortMemberShape = ZUpdateCohortMemberToolInput.shape as unknown as ZodRawShapeCompat;
const deleteCohortMemberShape = ZDeleteCohortMemberToolInput.shape as unknown as ZodRawShapeCompat;
const listCohortCoursesShape = ZListCohortCoursesToolInput.shape as unknown as ZodRawShapeCompat;
const addCohortCourseShape = ZAddCohortCourseToolInput.shape as unknown as ZodRawShapeCompat;
const removeCohortCourseShape = ZRemoveCohortCourseToolInput.shape as unknown as ZodRawShapeCompat;

export function registerCohortTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_org_cohorts',
    'List the cohorts in your organization.',
    listOrgCohortsShape,
    async () => {
      const result = await apiClient.listCohorts();
      return jsonContent(result);
    }
  );

  server.tool(
    'create_cohort',
    'Create a cohort.',
    createCohortShape,
    async (args) => {
      const payload = ZCreateCohortToolInput.parse(args);
      const result = await apiClient.createCohort(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_cohort',
    'Get a cohort by id.',
    getCohortShape,
    async (args) => {
      const { cohortId } = ZGetCohortToolInput.parse(args);
      const result = await apiClient.getCohort(cohortId);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_cohort',
    'Update a cohort.',
    updateCohortShape,
    async (args) => {
      const { cohortId, ...payload } = ZUpdateCohortToolInput.parse(args);
      const result = await apiClient.updateCohort(cohortId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort',
    'Delete a cohort.',
    deleteCohortShape,
    async (args) => {
      const { cohortId } = ZDeleteCohortToolInput.parse(args);
      const result = await apiClient.deleteCohort(cohortId);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_cohort_members',
    'List the members of a cohort.',
    listCohortMembersShape,
    async (args) => {
      const { cohortId } = ZListCohortMembersToolInput.parse(args);
      const result = await apiClient.listCohortMembers(cohortId);
      return jsonContent(result);
    }
  );

  server.tool(
    'add_cohort_members',
    'Add one or more members to a cohort, by profileId (existing org member) or email. Each member must be given a role.',
    addCohortMembersShape,
    async (args) => {
      const { cohortId, ...payload } = ZAddCohortMembersToolInput.parse(args);
      const result = await apiClient.addCohortMembers(cohortId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_cohort_member',
    "Update an existing cohort member's role.",
    updateCohortMemberShape,
    async (args) => {
      const { cohortId, memberId, ...payload } = ZUpdateCohortMemberToolInput.parse(args);
      const result = await apiClient.updateCohortMember(cohortId, memberId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort_member',
    'Remove a member from a cohort.',
    deleteCohortMemberShape,
    async (args) => {
      const { cohortId, memberId } = ZDeleteCohortMemberToolInput.parse(args);
      const result = await apiClient.deleteCohortMember(cohortId, memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_cohort_courses',
    'List the courses linked to a cohort.',
    listCohortCoursesShape,
    async (args) => {
      const { cohortId } = ZListCohortCoursesToolInput.parse(args);
      const result = await apiClient.listCohortCourses(cohortId);
      return jsonContent(result);
    }
  );

  server.tool(
    'add_cohort_course',
    'Link a course to a cohort.',
    addCohortCourseShape,
    async (args) => {
      const { cohortId, ...payload } = ZAddCohortCourseToolInput.parse(args);
      const result = await apiClient.addCohortCourse(cohortId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'remove_cohort_course',
    'Unlink a course from a cohort.',
    removeCohortCourseShape,
    async (args) => {
      const { cohortId, courseId } = ZRemoveCohortCourseToolInput.parse(args);
      const result = await apiClient.removeCohortCourse(cohortId, courseId);
      return jsonContent(result);
    }
  );
}

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data)
      }
    ]
  };
}
