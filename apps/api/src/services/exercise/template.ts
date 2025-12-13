import { calculateTotalPoints } from '@api/utils/template';
import { getAllTemplates, getTemplateById, getTemplateByTag } from '@db/queries/template/template';
import { TNewExerciseTemplate, TExerciseTemplate } from '@db/types';

function mapTemplateToMetadata(templates: TNewExerciseTemplate[]) {
  return templates.map((template) => {
    const questionnaire = template.questionnaire;

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      questions: questionnaire.questions.length,
      points: calculateTotalPoints(template),
      tag: template.tag
    };
  });
}

export async function fetchAllTemplatesMetadata() {
  let templates: TExerciseTemplate[];
  try {
    templates = await getAllTemplates();
  } catch (error) {
    console.error('Failed to fetch templates from DB:', error);
    throw error;
  }

  return mapTemplateToMetadata(templates);
}

export async function fetchTemplateById(id: number): Promise<TExerciseTemplate> {
  let template: TExerciseTemplate;
  try {
    template = await getTemplateById(id);
  } catch (error) {
    console.error('Failed to fetch template from DB:', error);
    throw error;
  }

  return template;
}

export async function fetchTemplatesByTag(tag: string) {
  let templates: TNewExerciseTemplate[];
  try {
    templates = await getTemplateByTag(tag);
  } catch (error) {
    console.error('Failed to fetch templates from DB:', error);
    throw error;
  }

  return mapTemplateToMetadata(templates);
}
