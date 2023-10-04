import htmlElements from './001_html_elements';
import htmlAttributes from './002_html_attributes';

export const HTML_IDS = {
  HTML_ELEMENTS: 'HTML_ELEMENTS',
  HTML_ATTRIBUTES: 'HTML_ATTRIBUTES',
  HTML_HEADINGS: 'HTML_HEADINGS',
  HTML_PARAGRAPH: 'HTML_PARAGRAPH'
};

export const HTML_TEMPLATES = {
  [HTML_IDS.HTML_ELEMENTS]: htmlElements,
  [HTML_IDS.HTML_ATTRIBUTES]: htmlAttributes,
  [HTML_IDS.HTML_HEADINGS]: htmlElements,
  [HTML_IDS.HTML_PARAGRAPH]: htmlElements
};
