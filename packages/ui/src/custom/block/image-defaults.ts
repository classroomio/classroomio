const oversizedMark = new URL('../../assets/brand-covers/oversized-mark.webp', import.meta.url).href;
const shapeTiles = new URL('../../assets/brand-covers/shape-tiles.webp', import.meta.url).href;
const blueprint = new URL('../../assets/brand-covers/blueprint.webp', import.meta.url).href;

export const BRAND_COVER_IMAGES = {
  blueprint,
  oversizedMark,
  shapeTiles
} as const;

export const DEFAULT_IMAGE_BLOCK_IMAGE = BRAND_COVER_IMAGES.oversizedMark;
