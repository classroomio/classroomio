import { calculateTotalPoints, shuffleOptions } from './utils';
import type { ExerciseTemplate } from '$lib/utils/types';

// Rule to add new template
// The key and value must match
// The template should have both `{VALUE}_IDS` and `{VALUE}_TEMPLATES`
export const TAGS = {
  HTML: 'HTML',
  CSS: 'CSS',
  JS: 'JS',
  Typescript: 'Typescript',
  ReactJS: 'ReactJS',
  VueJS: 'VueJS',
  NodeJS: 'NodeJS',
  Python: 'Python',
  PHP: 'PHP',
  GIT: 'GIT'
};

export interface GeneratedTemplates {
  [key: string]: LangTemplate[];
}
interface LangTemplate {
  id: string;
  title: string;
  questions: number;
  points: number;
  data: ExerciseTemplate;
}

async function generateTemplateForTag(
  keys: { [key: string]: string },
  template: {
    [x: string]: () => ExerciseTemplate;
  }
) {
  const templates: LangTemplate[] = [];

  for (const key in keys) {
    const id = keys[key];
    const data = await template[id]();

    data.questionnaire.questions = data.questionnaire.questions.map((q) => {
      q.options = shuffleOptions(q.options);
      return q;
    });
    templates.push({
      id,
      title: data.title,
      questions: data.questionnaire.questions.length,
      points: calculateTotalPoints(data),
      data: data
    });
  }

  return templates;
}

export const getAllTemplates = async (): Promise<GeneratedTemplates> => {
  const templateModules = {
    HTML: await import('./html'),
    CSS: await import('./css'),
    JS: await import('./js'),
    Typescript: await import('./typescript'),
    ReactJS: await import('./react'),
    VueJS: await import('./vue'),
    NodeJS: await import('./node'),
    Python: await import('./python'),
    PHP: await import('./php'),
    GIT: await import('./git')
  };

  const templates: GeneratedTemplates = {};

  for (const tag in templateModules) {
    try {
      const module = templateModules[tag];
      const ids = module[`${tag.toUpperCase()}_IDS`];
      const templatesData = module[`${tag.toUpperCase()}_TEMPLATES`];
      if (!templatesData) {
        throw 'Templates not found';
      }

      templates[tag] = await generateTemplateForTag(ids, templatesData);
    } catch (error) {
      console.error('error finding template', error);
    }
  }

  return templates;
};
