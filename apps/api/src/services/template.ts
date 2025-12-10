import { ExerciseTemplate } from '@api/types/template';
import { calculateTotalPoints } from '@api/utils/template';
import { getAllTemplates, getTemplateById } from '@db/queries/template/template';

export async function handleGetAllTemplatesMetadata() {
  let templates;
  try {
    templates = await getAllTemplates();
    console.log('Fetched templates from DB:', templates);
  } catch (error) {
    console.error('Failed to fetch templates from DB:', error);
    throw error;
  }

  return templates.map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    points: calculateTotalPoints({ questionnaire: template.questionnaire } as ExerciseTemplate)
  }));
}

export async function handleGetTemplateById(id: number): Promise<ExerciseTemplate[]> {
  let template;
  try {
    template = await getTemplateById(id);
  } catch (error) {
    console.error('Failed to fetch templates from DB:', error);
    throw error;
  }

  return template;
}
