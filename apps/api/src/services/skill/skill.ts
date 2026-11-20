import type {
  TSetQuestionSkills,
  TSkillCreate,
  TSkillImport,
  TSkillListQuery,
  TSkillUpdate
} from '@cio/utils/validation/skill';
import { parseSkillCsv, previewSkillImport } from '@cio/utils/skills';
import { db } from '@cio/db/drizzle';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import {
  createSkill,
  deleteSkill,
  findSkillByCode,
  getExerciseQuestionSkills,
  getOrganizationSkillIds,
  getQuestionExerciseId,
  getSkillById,
  listOrganizationSkills,
  listSkillCodeLinks,
  replaceQuestionSkills,
  updateSkill,
  upsertImportedSkills
} from '@cio/db/queries/skill';
import { assertExerciseBelongsToCourse } from '@api/services/v1/courses/exercises';
import { AppError, ErrorCodes } from '@api/utils/errors';

async function assertParentAllowed(orgId: string, parentId: string, skillId?: string) {
  const parent = await getSkillById(orgId, parentId);
  if (!parent) throw new AppError('Parent skill not found', ErrorCodes.SKILL_NOT_FOUND, 404, 'parentId');
  if (!skillId) return;

  let ancestorId: string | null = parent.id;
  const visited = new Set<string>();

  while (ancestorId && !visited.has(ancestorId)) {
    if (ancestorId === skillId) {
      throw new AppError('A skill cannot sit under itself', ErrorCodes.SKILL_INVALID_PARENT, 400, 'parentId');
    }
    visited.add(ancestorId);
    const ancestor = await getSkillById(orgId, ancestorId);
    ancestorId = ancestor?.parentId ?? null;
  }
}

export async function listSkillsService(orgId: string, query: TSkillListQuery) {
  return listOrganizationSkills(orgId, query);
}

export async function createSkillService(orgId: string, payload: TSkillCreate) {
  if (await findSkillByCode(orgId, payload.code)) {
    throw new AppError('A skill with this code already exists', ErrorCodes.SKILL_ALREADY_EXISTS, 409, 'code');
  }
  if (payload.parentId) await assertParentAllowed(orgId, payload.parentId);

  return createSkill(orgId, payload);
}

export async function updateSkillService(orgId: string, skillId: string, payload: TSkillUpdate) {
  if (!(await getSkillById(orgId, skillId))) {
    throw new AppError('Skill not found', ErrorCodes.SKILL_NOT_FOUND, 404);
  }
  if (payload.code !== undefined && (await findSkillByCode(orgId, payload.code, db, skillId))) {
    throw new AppError('A skill with this code already exists', ErrorCodes.SKILL_ALREADY_EXISTS, 409, 'code');
  }
  if (payload.parentId) await assertParentAllowed(orgId, payload.parentId, skillId);

  const skill = await updateSkill(orgId, skillId, payload);
  if (!skill) throw new AppError('Skill not found', ErrorCodes.SKILL_NOT_FOUND, 404);

  return skill;
}

export async function deleteSkillService(orgId: string, skillId: string) {
  const deleted = await deleteSkill(orgId, skillId);
  if (!deleted) throw new AppError('Skill not found', ErrorCodes.SKILL_NOT_FOUND, 404);

  return deleted;
}

/**
 * Parses a skills CSV and checks it against the organisation's skills. A dry run only returns the preview; an import
 * with any error writes nothing, otherwise it creates and updates every row in one transaction.
 */
export async function importSkillsService(orgId: string, payload: TSkillImport) {
  const parsed = parseSkillCsv(payload.csv);
  const existing = await listSkillCodeLinks(orgId);
  const preview = previewSkillImport(parsed, existing);
  const summary = {
    toCreate: preview.rows.filter((row) => row.action === 'create').length,
    toUpdate: preview.rows.filter((row) => row.action === 'update').length
  };

  if (payload.dryRun) return { dryRun: true as const, imported: false, ...summary, ...preview };

  if (preview.errors.length > 0) {
    throw new AppError('The file has errors. Fix them and try again', ErrorCodes.SKILL_IMPORT_INVALID, 400, 'csv');
  }

  await db.transaction((tx) => upsertImportedSkills(orgId, preview.rows, tx));

  return { dryRun: false as const, imported: true, ...summary, ...preview };
}

export async function setQuestionSkillsService(orgId: string, questionId: number, payload: TSetQuestionSkills) {
  const skillIds = [...new Set(payload.skillIds)];

  return db.transaction(async (tx) => {
    const validIds = await getOrganizationSkillIds(orgId, skillIds, tx);
    if (validIds.length !== skillIds.length) {
      throw new AppError('A skill was not found in this organization', ErrorCodes.SKILL_NOT_FOUND, 404, 'skillIds');
    }

    await replaceQuestionSkills(questionId, skillIds, tx);

    return { questionId, skillIds };
  });
}

export async function getCourseOrganizationIdOrThrow(courseId: string) {
  const orgId = await getCourseOrganizationId(courseId);
  if (!orgId) throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);

  return orgId;
}

export async function getExerciseQuestionSkillsService(courseId: string, exerciseId: string) {
  await assertExerciseBelongsToCourse(courseId, exerciseId);

  return getExerciseQuestionSkills(exerciseId);
}

export async function setCourseQuestionSkillsService(
  courseId: string,
  exerciseId: string,
  questionId: number,
  payload: TSetQuestionSkills
) {
  await assertExerciseBelongsToCourse(courseId, exerciseId);

  if ((await getQuestionExerciseId(questionId)) !== exerciseId) {
    throw new AppError('Question not found', ErrorCodes.QUESTION_NOT_FOUND, 404);
  }

  const orgId = await getCourseOrganizationIdOrThrow(courseId);

  return setQuestionSkillsService(orgId, questionId, payload);
}
