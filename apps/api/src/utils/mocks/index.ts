import { calculateTotalPoints, type ExerciseTemplate, shuffleOptions } from './utils';

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
export interface LangTemplate {
  id: string;
  title: string;
  questions: number;
  points: number;
  data: ExerciseTemplate;
}

export interface TemplateMetadata {
  id: string;
  title: string;
  questions: number;
  points: number;
}

export interface GeneratedTemplatesMetadata {
  [key: string]: TemplateMetadata[];
}

async function generateTemplateForTag(
  keys: { [key: string]: string },
  template: {
    [x: string]: () => ExerciseTemplate;
  }
) {
  const templates: ExerciseTemplate[] = [];

  for (const key in keys) {
    const id = keys[key];
    const data = await template[id]();

    data.questionnaire.questions = data.questionnaire.questions.map((q) => {
      q.options = shuffleOptions(q.options);
      return q;
    });
    templates.push(data);
  }

  return templates;
}

async function generateTemplateMetadataForTag(
  keys: { [key: string]: string },
  template: {
    [x: string]: () => ExerciseTemplate;
  }
) {
  const templates: TemplateMetadata[] = [];

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
      points: calculateTotalPoints(data)
    });
  }

  return templates;
}

export const getTemplatesById = async (id: string): Promise<ExerciseTemplate[]> => {
  // --- extract the tag from the id (e.g., 'html_basics' -> 'html')
  const tagPrefix = id.split('_')[0].toLowerCase();

  // --- map lowercase prefix to actual tag name
  const tagMap: Record<string, keyof typeof TAGS> = {
    html: 'HTML',
    css: 'CSS',
    js: 'JS',
    typescript: 'Typescript',
    reactjs: 'ReactJS',
    vuejs: 'VueJS',
    nodejs: 'NodeJS',
    python: 'Python',
    php: 'PHP',
    git: 'GIT'
  };

  const tag = tagMap[tagPrefix];
  if (!tag) {
    throw new Error(`Template tag for prefix '${tagPrefix}' not found`);
  }

  // --- dynamically import only the needed module
  const module = await import(`./${tagPrefix}`);

  const ids = module[`${tag.toUpperCase()}_IDS`];
  const templatesData = module[`${tag.toUpperCase()}_TEMPLATES`];

  if (!templatesData) {
    throw new Error(`Templates not found for ${tag}`);
  }

  // --- get specific template by ID
  if (!ids[id]) {
    throw new Error(`Template with id '${id}' not found`);
  }

  const templateFn = templatesData[ids[id]];
  if (!templateFn) {
    throw new Error(`Template function for '${id}' not found`);
  }

  const data = await templateFn();
  data.questionnaire.questions = data.questionnaire.questions.map((q) => {
    q.options = shuffleOptions(q.options);
    return q;
  });

  return [data];
};

export const getAllTemplatesMetadata = async (): Promise<GeneratedTemplatesMetadata> => {
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

  const templates: GeneratedTemplatesMetadata = {};

  for (const tag in templateModules) {
    try {
      const module = templateModules[tag];
      const ids = module[`${tag.toUpperCase()}_IDS`];
      const templatesData = module[`${tag.toUpperCase()}_TEMPLATES`];
      if (!templatesData) {
        throw 'Templates not found';
      }

      const fullTemplates = await generateTemplateMetadataForTag(ids, templatesData);
      templates[tag] = fullTemplates;
    } catch (error) {
      console.error('error finding template', error);
    }
  }

  return templates;
};
