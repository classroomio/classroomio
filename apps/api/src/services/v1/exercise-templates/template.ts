import type {
  TPublicApiExerciseTemplateParam,
  TPublicApiExerciseTemplatesQuery
} from '@cio/utils/validation/public-api';
import { fetchAllTemplatesMetadata, fetchTemplateById, fetchTemplatesByTag } from '@api/services/exercise/template';
import { calculateTotalPoints } from '@api/utils/template';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertOrgTeamMember, paginateInMemory } from '../shared';

const TEXTAREA_QUESTION_TYPE_ID = 3;

/** The built-in exercise template catalog (shared by every organization). Templates are only used for authoring. */
export async function listExerciseTemplatesService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiExerciseTemplatesQuery
) {
  await assertOrgTeamMember(orgId, actorId);

  const templates = query.tag ? await fetchTemplatesByTag(query.tag) : await fetchAllTemplatesMetadata();
  const sorted = [...templates].sort((a, b) => Number(a.id) - Number(b.id));
  const { items, pagination } = paginateInMemory(sorted, query);

  return {
    items: items.map((template) => ({
      id: Number(template.id),
      title: template.title ?? null,
      description: template.description ?? null,
      tag: template.tag ?? null,
      questionCount: template.questions,
      points: template.points
    })),
    pagination
  };
}

export async function getExerciseTemplateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiExerciseTemplateParam
) {
  await assertOrgTeamMember(orgId, actorId);

  const template = await fetchTemplateById(params.templateId);
  if (!template?.questionnaire?.questions) {
    throw new AppError('Exercise template not found', ErrorCodes.NOT_FOUND, 404);
  }

  const questions = template.questionnaire.questions;

  return {
    id: template.id,
    title: template.title,
    description: template.description,
    tag: template.tag,
    questionCount: questions.length,
    points: calculateTotalPoints(template),
    questions: questions.map((question) => ({
      question: question.title,
      questionTypeId: question.question_type.id,
      points: question.points ?? 1,
      order: question.order ?? 0,
      settings: (question as { settings?: Record<string, unknown> }).settings ?? {},
      // Create-from-template skips TEXTAREA options, so they are not part of what gets created.
      options:
        question.question_type.id === TEXTAREA_QUESTION_TYPE_ID
          ? []
          : (question.options ?? []).map((option) => ({
              label: option.label ?? '',
              isCorrect: Boolean(option.is_correct),
              settings: (option as { settings?: Record<string, unknown> }).settings ?? {}
            }))
    }))
  };
}
