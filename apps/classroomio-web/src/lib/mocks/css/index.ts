import cssSyntax from './001_css_syntax';
import cssSelectors from './002_css_selectors';
import cssHowTo from './003_css_howTo';
import cssComments from './004_css_comments';
import cssColors from './005_css_colors';
import cssBackgounds from './006_css_backgrounds';
import cssBorders from './007_css_borders';
import cssMargin from './008_css_margin';
import cssPadding from './009_css_padding';
import cssDimensions from './010_css_dimentions';
import cssBoxModel from './011_css_boxModel';
import cssOutline from './012_css_outline';
import cssText from './013_css_text';
import cssFonts from './014_css_fonts';
import cssIcons from './015_css_icons';
import cssLinks from './016_css_links';
import cssLists from './017_css_lists';
import cssTables from './018_css_tables';
import cssDisplay from './019_css_display';
import cssMaxWidth from './020_css_maxWidth';

export const CSS_IDS: { [key: string]: string } = {
  CSS_SYNTAX: 'CSS_SYNTAX',
  CSS_SELECTORS: 'CSS_SELECTORS',
  CSS_HOWTO: 'CSS_HOWTO',
  CSS_COMMENTS: 'CSS_COMMENTS',
  CSS_COLORS: 'CSS_COLORS',
  CSS_BACKGROUNDS: 'CSS_BACKGROUNDS',
  CSS_BORDERS: 'CSS_BORDERS',
  CSS_MARGIN: 'CSS_MARGIN',
  CSS_PADDING: 'CSS_PADDING',
  CSS_DIMENTIONS: 'CSS_DIMENTIONS',
  CSS_BOXMODEL: 'CSS_BOXMODEL',
  CSS_OUTLINE: 'CSS_OUTLINE',
  CSS_TEXT: 'CSS_TEXT',
  CSS_FONTS: 'CSS_FONTS',
  CSS_ICONS: 'CSS_ICONS',
  CSS_LINKS: 'CSS_LINKS',
  CSS_LISTS: 'CSS_LISTS',
  CSS_TABLES: 'CSS_TABLES',
  CSS_DISPLAY: 'CSS_DISPLAY',
  CSS_MAXWIDTH: 'CSS_MAXWIDTH'
};

export const CSS_TEMPLATES = {
  [CSS_IDS.CSS_SYNTAX]: cssSyntax,
  [CSS_IDS.CSS_SELECTORS]: cssSelectors,
  [CSS_IDS.CSS_HOWTO]: cssHowTo,
  [CSS_IDS.CSS_COMMENTS]: cssComments,
  [CSS_IDS.CSS_COLORS]: cssColors,
  [CSS_IDS.CSS_BACKGROUNDS]: cssBackgounds,
  [CSS_IDS.CSS_BORDERS]: cssBorders,
  [CSS_IDS.CSS_MARGIN]: cssMargin,
  [CSS_IDS.CSS_PADDING]: cssPadding,
  [CSS_IDS.CSS_DIMENTIONS]: cssDimensions,
  [CSS_IDS.CSS_BOXMODEL]: cssBoxModel,
  [CSS_IDS.CSS_OUTLINE]: cssOutline,
  [CSS_IDS.CSS_TEXT]: cssText,
  [CSS_IDS.CSS_FONTS]: cssFonts,
  [CSS_IDS.CSS_ICONS]: cssIcons,
  [CSS_IDS.CSS_LINKS]: cssLinks,
  [CSS_IDS.CSS_LISTS]: cssLists,
  [CSS_IDS.CSS_TABLES]: cssTables,
  [CSS_IDS.CSS_DISPLAY]: cssDisplay,
  [CSS_IDS.CSS_MAXWIDTH]: cssMaxWidth
};
