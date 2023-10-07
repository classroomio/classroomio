import { HTML_IDS, HTML_TEMPLATES } from './html';
import { CSS_IDS, CSS_TEMPLATES } from './css';
import { calculateTotalPoints, shuffleOptions } from './utils';
import type { ExerciseTemplate } from '$lib/utils/types';
import { JS_IDS, JS_TEMPLATES } from './js';

export const TAGS = {
  HTML: 'HTML',
  CSS: 'CSS',
  JS: 'JS',
  Typescript: 'Typescript',
  ReactJS: 'ReactJS',
  VueJS: 'VueJS'
};

function generateTemplateForTag(
  keys: { [key: string]: string },
  templates: {
    [x: string]: ExerciseTemplate;
  }
) {
  const template = [];

  for (const key in keys) {
    const id = keys[key];
    templates[id].questionnaire.questions = templates[id].questionnaire.questions.map((q) => {
      q.options = shuffleOptions(q.options);
      return q;
    });
    template.push({
      id,
      title: templates[id].title,
      questions: templates[id].questionnaire.questions.length,
      points: calculateTotalPoints(templates[id]),
      data: templates[id]
    });
  }

  return template;
}

export const TEMPLATES = {
  [TAGS.HTML]: generateTemplateForTag(HTML_IDS, HTML_TEMPLATES),
  [TAGS.CSS]: generateTemplateForTag(CSS_IDS, CSS_TEMPLATES),
  [TAGS.JS]: generateTemplateForTag(JS_IDS, JS_TEMPLATES),
  [TAGS.Typescript]: [],
  [TAGS.ReactJS]: [],
  [TAGS.VueJS]: []
};
