import { HTML_IDS, HTML_TEMPLATES } from './html';

export const TAGS = {
  HTML: 'HTML',
  CSS: 'CSS',
  JS: 'JS',
  Typescript: 'Typescript',
  ReactJS: 'ReactJS',
  VueJS: 'VueJS'
};

export const TEMPLATES = {
  [TAGS.HTML]: [
    {
      id: HTML_IDS.HTML_ELEMENTS,
      title: 'Learn HTML Elements',
      questions: 10,
      points: 20,
      data: HTML_TEMPLATES[HTML_IDS.HTML_ELEMENTS]
    },
    {
      id: HTML_IDS.HTML_ATTRIBUTES,
      title: 'HTML Attributes',
      questions: 5,
      points: 10,
      data: HTML_TEMPLATES[HTML_IDS.HTML_ATTRIBUTES]
    },
    {
      id: HTML_IDS.HTML_HEADINGS,
      title: 'Practice HTML Headings',
      questions: 15,
      points: 50,
      data: HTML_TEMPLATES[HTML_IDS.HTML_ELEMENTS]
    },
    {
      id: HTML_IDS.HTML_PARAGRAPH,
      title: 'Understand p tag',
      questions: 15,
      points: 20,
      data: HTML_TEMPLATES[HTML_IDS.HTML_ELEMENTS]
    }
  ],
  [TAGS.CSS]: [],
  [TAGS.JS]: [],
  [TAGS.Typescript]: [],
  [TAGS.ReactJS]: [],
  [TAGS.VueJS]: []
};
