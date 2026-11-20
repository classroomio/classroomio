import {
  ZPublicApiSkillsQuery,
  ZSetQuestionSkills,
  ZSkillCreate,
  ZSkillImport,
  ZSkillParam,
  ZSkillUpdate
} from '@cio/utils/validation/skill';
import { ZPublicApiCourseExerciseParam, ZPublicApiExerciseQuestionParam } from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };

const ADMIN_RULE = 'the API key creator must be an org admin';
const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';

export const ZListSkillsToolInput = ZPublicApiSkillsQuery;
export const ZCreateSkillToolInput = ZSkillCreate;
export const ZUpdateSkillToolInput = ZSkillUpdate.safeExtend({ skillId: ZSkillParam.shape.skillId });
export const ZImportSkillsToolInput = ZSkillImport;
export const ZSetQuestionSkillsToolInput = ZPublicApiExerciseQuestionParam.extend({
  skillIds: ZSetQuestionSkills.shape.skillIds
});
export const ZGetExerciseSkillMasteryToolInput = ZPublicApiCourseExerciseParam;

const listSkillsShape = ZListSkillsToolInput.shape as unknown as ZodRawShapeCompat;
const createSkillShape = ZCreateSkillToolInput.shape as unknown as ZodRawShapeCompat;
const updateSkillShape = ZUpdateSkillToolInput.shape as unknown as ZodRawShapeCompat;
const importSkillsShape = ZImportSkillsToolInput.shape as unknown as ZodRawShapeCompat;
const setQuestionSkillsShape = ZSetQuestionSkillsToolInput.shape as unknown as ZodRawShapeCompat;
const getExerciseSkillMasteryShape = ZGetExerciseSkillMasteryToolInput.shape as unknown as ZodRawShapeCompat;

export function registerSkillTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_skills',
    "List the organization's skills and standards with how many questions each is tagged on; the API key creator must be an org member.",
    listSkillsShape,
    READ_ONLY,
    async (args) => jsonContent(await apiClient.listSkills(ZListSkillsToolInput.parse(args)))
  );

  server.tool(
    'create_skill',
    `Create a skill or standard; ${ADMIN_RULE}. To add many at once, use import_skills.`,
    createSkillShape,
    CREATE,
    async (args) => jsonContent(await apiClient.createSkill(ZCreateSkillToolInput.parse(args)))
  );

  server.tool(
    'update_skill',
    `Update a skill's code, name, description, framework or parent; ${ADMIN_RULE}.`,
    updateSkillShape,
    WRITE,
    async (args) => {
      const { skillId, ...payload } = ZUpdateSkillToolInput.parse(args);

      return jsonContent(await apiClient.updateSkill(skillId, ZSkillUpdate.parse(payload)));
    }
  );

  server.tool(
    'import_skills',
    `Import skills from CSV text with the columns code, name and optionally parent_code, description and framework. Rows whose code already exists are updated. Set dryRun to true to preview without saving; an import with any error saves nothing; ${ADMIN_RULE}.`,
    importSkillsShape,
    WRITE,
    async (args) => jsonContent(await apiClient.importSkills(ZImportSkillsToolInput.parse(args)))
  );

  server.tool(
    'set_question_skills',
    `Replace the skills a question is tagged with, using skill ids from list_skills; send [] to remove them all; ${COURSE_TEAM_RULE}.`,
    setQuestionSkillsShape,
    { ...WRITE, destructiveHint: true },
    async (args) => {
      const { courseId, exerciseId, questionId, skillIds } = ZSetQuestionSkillsToolInput.parse(args);

      return jsonContent(await apiClient.setQuestionSkills(courseId, exerciseId, questionId, skillIds));
    }
  );

  server.tool(
    'get_exercise_skill_mastery',
    `Skill mastery for the skills tagged on an exercise: each student's level per skill (not started, learning, proficient, mastered) and how many students sit at each level; ${COURSE_TEAM_RULE}.`,
    getExerciseSkillMasteryShape,
    READ_ONLY,
    async (args) => {
      const { courseId, exerciseId } = ZGetExerciseSkillMasteryToolInput.parse(args);

      return jsonContent(await apiClient.getExerciseSkillMastery(courseId, exerciseId));
    }
  );
}

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
