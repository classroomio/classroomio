import htmlElements from './001_html_elements';
import htmlAttributes from './002_html_attributes';
import htmlHeadings from './003_html_headings';
import htmlPharagraphs from './004_html_paragraph';
import htmlStyles from './005_html_styles';
import htmlFormatting from './006_html_formatting';
import htmlQuotations from './007_html_quotations';
import htmlComments from './008_html_comments';
import htmlColors from './009_html_colors';
import htmlCss from './010_html_css';
import htmlLinks from './011_html_links';
import htmlImages from './012_html_images';
import htmlFavicon from './013_html_favicon';
import htmlPagetitle from './014_html_pageTitle';
import htmlTables from './015_html_tables';
import htmlLists from './016_html_lists';
import htmlBlocks from './017_html_blocks';
import htmlClasses from './018_html_classes';
import htmlId from './019_html_id';
import htmlIframes from './020_html_iframes';

export const HTML_IDS: { [key: string]: string } = {
  HTML_ELEMENTS: 'HTML_ELEMENTS',
  HTML_ATTRIBUTES: 'HTML_ATTRIBUTES',
  HTML_HEADINGS: 'HTML_HEADINGS',
  HTML_PARAGRAPH: 'HTML_PARAGRAPH',
  HTML_STYLES: 'HTML_STYLES',
  HTML_FORMATTING: 'HTML_FORMATTING',
  HTML_QUOTATIONS: 'HTML_QUOTATIONS',
  HTML_COMMENTS: 'HTML_COMMENTS',
  HTML_COLORS: 'HTML_COLORS',
  HTML_CSS: 'HTML_CSS',
  HTML_LINKS: 'HTML_LINKS',
  HTML_IMAGES: 'HTML_IMAGES',
  HTML_FAVICON: 'HTML_FAVICON',
  HTML_PAGETITLE: 'HTML_PAGETITLE',
  HTML_TABLES: 'HTML_TABLES',
  HTML_LISTS: 'HTML_LISTS',
  HTML_BLOCKS: 'HTML_BLOCKS',
  HTML_CLASSES: 'HTML_CLASSES',
  HTML_ID: 'HTML_ID',
  HTML_IFRAMES: 'HTML_IFRAMES'
};

export const HTML_TEMPLATES = {
  [HTML_IDS.HTML_ELEMENTS]: htmlElements,
  [HTML_IDS.HTML_ATTRIBUTES]: htmlAttributes,
  [HTML_IDS.HTML_HEADINGS]: htmlHeadings,
  [HTML_IDS.HTML_PARAGRAPH]: htmlPharagraphs,
  [HTML_IDS.HTML_STYLES]: htmlStyles,
  [HTML_IDS.HTML_FORMATTING]: htmlFormatting,
  [HTML_IDS.HTML_QUOTATIONS]: htmlQuotations,
  [HTML_IDS.HTML_COMMENTS]: htmlComments,
  [HTML_IDS.HTML_COLORS]: htmlColors,
  [HTML_IDS.HTML_CSS]: htmlCss,
  [HTML_IDS.HTML_LINKS]: htmlLinks,
  [HTML_IDS.HTML_IMAGES]: htmlImages,
  [HTML_IDS.HTML_FAVICON]: htmlFavicon,
  [HTML_IDS.HTML_PAGETITLE]: htmlPagetitle,
  [HTML_IDS.HTML_TABLES]: htmlTables,
  [HTML_IDS.HTML_LISTS]: htmlLists,
  [HTML_IDS.HTML_BLOCKS]: htmlBlocks,
  [HTML_IDS.HTML_CLASSES]: htmlClasses,
  [HTML_IDS.HTML_ID]: htmlId,
  [HTML_IDS.HTML_IFRAMES]: htmlIframes
};
