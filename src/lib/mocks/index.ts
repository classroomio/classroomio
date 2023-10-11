import { HTML_IDS, HTML_TEMPLATES } from './html';
import { CSS_IDS, CSS_TEMPLATES } from './css';
import { calculateTotalPoints, shuffleOptions } from './utils';
import type { ExerciseTemplate } from '$lib/utils/types';
import { JS_IDS, JS_TEMPLATES } from './js';
import { NODE_IDS, NODE_TEMPLATES } from './node';
import { REACT_IDS, REACT_TEMPLATES } from './react';
import { TS_IDS, TS_TEMPLATES } from './typescript';
import { PHP_IDS, PHP_TEMPLATES } from './php';
import { VUE_IDS, VUE_TEMPLATES } from './vue';
import { GIT_IDS, GIT_TEMPLATES } from './git';

export const TAGS = {
  HTML: 'HTML',
  CSS: 'CSS',
  JS: 'JS',
  Typescript: 'Typescript',
  ReactJS: 'ReactJS',
  VueJS: 'VueJS',
  NodeJS: 'NodeJS',
  PHP: 'PHP',
  GIT: 'GIT'
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
  [TAGS.Typescript]: generateTemplateForTag(TS_IDS, TS_TEMPLATES),
  [TAGS.ReactJS]: generateTemplateForTag(REACT_IDS, REACT_TEMPLATES),
  [TAGS.VueJS]: generateTemplateForTag(VUE_IDS, VUE_TEMPLATES),
  [TAGS.NodeJS]: generateTemplateForTag(NODE_IDS, NODE_TEMPLATES),
  [TAGS.PHP]: generateTemplateForTag(PHP_IDS, PHP_TEMPLATES),
  [TAGS.GIT]: generateTemplateForTag(GIT_IDS, GIT_TEMPLATES)
};
