import type { TWidgetLayoutType } from '@cio/utils/validation/widget';

/** Served from CDN. */
export const WIDGET_LAYOUT_THUMBNAIL_BASE = 'https://assets.cdn.clsrio.com/templates/widget-layouts';

export function widgetLayoutThumbnailSrc(layoutType: TWidgetLayoutType): string {
  return `${WIDGET_LAYOUT_THUMBNAIL_BASE}/${layoutType}.png`;
}
