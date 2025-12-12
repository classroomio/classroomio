import { calculateTotalPoints } from '@api/utils/template';
import { getAllTemplates, getTemplateById, getTemplateByTag } from '@db/queries/template/template';
import { TNewTemplate, TTemplate } from '@db/types';

function mapTemplateToMetadata(templates: TNewTemplate[]) {
  return templates.map((template) => {
    const questionnaire = template.questionnaire;

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      questions: questionnaire.questions.length,
      points: calculateTotalPoints({ questionnaire }),
      tag: template.tag
    };
  });
}

export async function fetchAllTemplatesMetadata() {
  let templates: TTemplate[];
  try {
    templates = await getAllTemplates();
  } catch (error) {
    console.error('Failed to fetch templates from DB:', error);
    throw error;
  }

  return mapTemplateToMetadata(templates);
}

export async function fetchTemplateById(id: number): Promise<TTemplate> {
  let template: TTemplate;
  try {
    template = await getTemplateById(id);
  } catch (error) {
    console.error('Failed to fetch template from DB:', error);
    throw error;
  }

  return template;
}

export async function fetchTemplatesByTag(tag: string) {
  let templates: TNewTemplate[];
  try {
    templates = await getTemplateByTag(tag);
  } catch (error) {
    console.error('Failed to fetch templates from DB:', error);
    throw error;
  }

  return mapTemplateToMetadata(templates);
}
