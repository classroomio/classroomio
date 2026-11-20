import type {
  TPublicApiSkillsQuery,
  TSetQuestionSkills,
  TSkillCreate,
  TSkillImport,
  TSkillUpdate
} from '@cio/utils/validation/skill';
import {
  createSkillService,
  importSkillsService,
  listSkillsService,
  setCourseQuestionSkillsService,
  updateSkillService
} from '@api/services/skill/skill';
import { getExerciseSkillMastery } from '@api/services/skill/mastery';
import { assertCourseHasPaidMathFeature } from '@api/services/math/premium';
import {
  assertCourseBelongsToOrganization,
  assertCourseTeamMemberOrOrgAdmin,
  assertOrgAdmin,
  assertOrgMember,
  paginateInMemory
} from '@api/services/v1/shared';

export async function listPublicApiSkillsService(orgId: string, actorId: string | null, query: TPublicApiSkillsQuery) {
  await assertOrgMember(orgId, actorId);

  return paginateInMemory(await listSkillsService(orgId, query), query);
}

export async function createPublicApiSkillService(orgId: string, actorId: string | null, payload: TSkillCreate) {
  await assertOrgAdmin(orgId, actorId);

  return createSkillService(orgId, payload);
}

export async function updatePublicApiSkillService(
  orgId: string,
  actorId: string | null,
  skillId: string,
  payload: TSkillUpdate
) {
  await assertOrgAdmin(orgId, actorId);

  return updateSkillService(orgId, skillId, payload);
}

export async function importPublicApiSkillsService(orgId: string, actorId: string | null, payload: TSkillImport) {
  await assertOrgAdmin(orgId, actorId);

  return importSkillsService(orgId, payload);
}

export async function setPublicApiQuestionSkillsService(
  orgId: string,
  actorId: string | null,
  courseId: string,
  exerciseId: string,
  questionId: number,
  payload: TSetQuestionSkills
) {
  await assertCourseBelongsToOrganization(orgId, courseId);
  await assertCourseTeamMemberOrOrgAdmin(courseId, actorId);

  return setCourseQuestionSkillsService(courseId, exerciseId, questionId, payload);
}

export async function getPublicApiExerciseSkillMasteryService(
  orgId: string,
  actorId: string | null,
  courseId: string,
  exerciseId: string
) {
  await assertCourseBelongsToOrganization(orgId, courseId);
  await assertCourseTeamMemberOrOrgAdmin(courseId, actorId);
  await assertCourseHasPaidMathFeature(courseId, 'skill_mastery');

  return getExerciseSkillMastery(courseId, exerciseId);
}
