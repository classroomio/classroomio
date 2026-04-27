import widgetStyles from './styles.css?raw';

export { default as CourseWidget } from './course-widget.svelte';
export { default as CardGridLayout } from './card-grid.svelte';
export { default as TagFilterLayout } from './tag-filter.svelte';
export { default as CarouselLayout } from './carousel.svelte';
export { default as PrimaryCourseLayout } from './primary-course.svelte';
export { default as CompactListLayout } from './compact-list.svelte';
export { default as EditorialSpotlightLayout } from './editorial-spotlight.svelte';
export { default as CategoryShelfLayout } from './category-shelf.svelte';

export {
  buildCssVarsFromDesign,
  buildPoweredByMarketingUrl,
  formatLessonsLine,
  getCourseExcerpt,
  getOrgDomainForUtm,
  getCourseTypeMeta,
  getStarSegments
} from './utils';

export { ensureWidgetGoogleFontsLoaded } from './ensure-google-fonts';

export { widgetStyles };
