import { ExerciseTemplate } from '@api/types/template';
import { calculateTotalPoints } from '@api/utils/template';
import { getAllTemplates, getTemplateById, getTemplateByTag } from '@db/queries/template/template';

function mapTemplateToMetadata(templates: ExerciseTemplate[]) {
  return templates.map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    questions: template.questionnaire.questions.length,
    points: calculateTotalPoints({ questionnaire: template.questionnaire } as ExerciseTemplate),
    tag: template.tag
  }));
}

export async function handleGetAllTemplatesMetadata() {
  let templates;
  try {
    templates = await getAllTemplates();
  } catch (error) {
    console.error('Failed to fetch templates from DB:', error);
    throw error;
  }

  return mapTemplateToMetadata(templates);
}

export async function handleGetTemplateById(id: number): Promise<ExerciseTemplate[]> {
  let template;
  try {
    template = await getTemplateById(id);
  } catch (error) {
    console.error('Failed to fetch template from DB:', error);
    throw error;
  }

  return template;
}

export async function handleGetTemplateByTag(tag: string) {
  let template;
  try {
    template = await getTemplateByTag(tag);
  } catch (error) {
    console.error('Failed to fetch templates from DB:', error);
    throw error;
  }

  return mapTemplateToMetadata(template);
}
