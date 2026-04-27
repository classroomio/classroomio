import type { TWidgetLayoutType } from '@cio/utils/validation/widget';

/** Served from `apps/dashboard/static/templates/widget-layouts/*.png` (~720px max edge for sharp downscaling). */
export const WIDGET_LAYOUT_THUMBNAIL_BASE = '/templates/widget-layouts';

export function widgetLayoutThumbnailSrc(layoutType: TWidgetLayoutType): string {
  return `${WIDGET_LAYOUT_THUMBNAIL_BASE}/${layoutType}.png`;
}
