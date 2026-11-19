import {
  createExerciseSectionService,
  deleteExerciseSectionService,
  updateExerciseSectionService
} from '@cio/core/services/exercise/exercise';
import type {
  TPublicApiAddExerciseSection,
  TPublicApiCourseExerciseParam,
  TPublicApiExerciseSectionParam,
  TPublicApiUpdateExerciseSectionFields
} from '@cio/utils/validation/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCourseExerciseService } from './exercises';

type PublicExerciseDetail = Awaited<ReturnType<typeof getCourseExerciseService>>;

function findSection(exercise: PublicExerciseDetail, sectionId: string) {
  const section = exercise.sections.find((candidate) => candidate.id === sectionId);
  if (!section) {
    throw new AppError('Exercise section not found in this exercise', ErrorCodes.NOT_FOUND, 404);
  }

  return section;
}

function splitSectionParam({ sectionId, ...exerciseParams }: TPublicApiExerciseSectionParam) {
  return { sectionId, exerciseParams: exerciseParams as TPublicApiCourseExerciseParam };
}

/** Adds one empty section to the exercise and returns it. Throws 404 if a go_to_section target is not on the exercise. */
export async function addCourseExerciseSectionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseParam,
  payload: TPublicApiAddExerciseSection
) {
  await getCourseExerciseService(orgId, actorId, params);

  const created = await createExerciseSectionService(params.exerciseId, payload);
  const updated = await getCourseExerciseService(orgId, actorId, params);

  return findSection(updated, created.id);
}

/** Edits one section; fields the caller leaves out keep their values. */
export async function updateCourseExerciseSectionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiExerciseSectionParam,
  payload: TPublicApiUpdateExerciseSectionFields
) {
  const { sectionId, exerciseParams } = splitSectionParam(params);
  await getCourseExerciseService(orgId, actorId, exerciseParams);

  await updateExerciseSectionService(exerciseParams.exerciseId, sectionId, payload);
  const updated = await getCourseExerciseService(orgId, actorId, exerciseParams);

  return findSection(updated, sectionId);
}

/** Deletes one empty section and returns it as it was. Throws 409 if it holds questions or another section goes to it. */
export async function deleteCourseExerciseSectionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiExerciseSectionParam
) {
  const { sectionId, exerciseParams } = splitSectionParam(params);
  const exercise = await getCourseExerciseService(orgId, actorId, exerciseParams);
  const section = findSection(exercise, sectionId);

  await deleteExerciseSectionService(exerciseParams.exerciseId, sectionId);

  return section;
}
